import { NextRequest, NextResponse } from "next/server";
import { db, posts, postCategories, postTags } from "@/lib/db";
import { generateSlug, getYearFromDate } from "@/lib/utils";
import { eq, desc, like, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let allPosts;

    if (search && status && status !== "all") {
      allPosts = await db.select()
        .from(posts)
        .where(
          and(
            like(posts.title, `%${search}%`),
            eq(posts.status, status as "draft" | "published")
          )
        )
        .orderBy(desc(posts.updatedAt))
        .limit(limit)
        .offset(offset);
    } else if (search) {
      allPosts = await db.select()
        .from(posts)
        .where(like(posts.title, `%${search}%`))
        .orderBy(desc(posts.updatedAt))
        .limit(limit)
        .offset(offset);
    } else if (status && status !== "all") {
      allPosts = await db.select()
        .from(posts)
        .where(eq(posts.status, status as "draft" | "published"))
        .orderBy(desc(posts.updatedAt))
        .limit(limit)
        .offset(offset);
    } else {
      allPosts = await db.select()
        .from(posts)
        .orderBy(desc(posts.updatedAt))
        .limit(limit)
        .offset(offset);
    }

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, dateOfEvent, categoryIds, tagIds, status } = body;

    // Generate slug from title
    const slug = generateSlug(title);
    const yearOfEvent = getYearFromDate(dateOfEvent);

    // Insert the post
    const [newPost] = await db
      .insert(posts)
      .values({
        title,
        content,
        excerpt,
        dateOfEvent,
        yearOfEvent,
        slug,
        status: status || "draft",
      })
      .returning();

    // Insert category relationships
    if (categoryIds && categoryIds.length > 0) {
      await db.insert(postCategories).values(
        categoryIds.map((categoryId: number) => ({
          postId: newPost.id,
          categoryId,
        }))
      );
    }

    // Insert tag relationships
    if (tagIds && tagIds.length > 0) {
      await db.insert(postTags).values(
        tagIds.map((tagId: number) => ({
          postId: newPost.id,
          tagId,
        }))
      );
    }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}