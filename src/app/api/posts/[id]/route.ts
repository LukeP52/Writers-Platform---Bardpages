import { NextRequest, NextResponse } from "next/server";
import { db, posts, postCategories, postTags, categories, tags, images } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);

    // Get the post with its relationships
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    
    if (post.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get categories for this post
    const postCategoryData = await db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        color: categories.color,
      })
      .from(postCategories)
      .innerJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(postCategories.postId, postId));

    // Get tags for this post
    const postTagData = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, postId));

    // Get images for this post
    const postImages = await db
      .select()
      .from(images)
      .where(eq(images.postId, postId))
      .orderBy(images.sortOrder);

    const result = {
      ...post[0],
      categories: postCategoryData,
      tags: postTagData,
      images: postImages.map(img => ({
        ...img,
        url: `/uploads/${img.filename}`
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { categoryIds, tagIds, images: uploadedImages, ...postData } = body;

    // Update the post
    const result = await db
      .update(posts)
      .set({
        ...postData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(posts.id, postId))
      .returning();

    const updatedPosts = Array.isArray(result) ? result : [];

    if (updatedPosts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Update categories
    if (categoryIds) {
      // Remove existing categories
      await db.delete(postCategories).where(eq(postCategories.postId, postId));
      
      // Add new categories
      if (categoryIds.length > 0) {
        await db.insert(postCategories).values(
          categoryIds.map((categoryId: number) => ({ postId, categoryId }))
        );
      }
    }

    // Update tags
    if (tagIds) {
      // Remove existing tags
      await db.delete(postTags).where(eq(postTags.postId, postId));
      
      // Add new tags
      if (tagIds.length > 0) {
        await db.insert(postTags).values(
          tagIds.map((tagId: number) => ({ postId, tagId }))
        );
      }
    }

    return NextResponse.json(updatedPosts[0]);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);
    const body = await request.json();

    const result = await db
      .update(posts)
      .set({
        ...body,
        updatedAt: new Date().toISOString()
      })
      .where(eq(posts.id, postId))
      .returning();

    const updatedPosts = Array.isArray(result) ? result : [];

    if (updatedPosts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPosts[0]);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = parseInt(resolvedParams.id);

    // Delete related records first (due to foreign key constraints)
    await db.delete(postCategories).where(eq(postCategories.postId, postId));
    await db.delete(postTags).where(eq(postTags.postId, postId));
    
    // Delete the post
    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}