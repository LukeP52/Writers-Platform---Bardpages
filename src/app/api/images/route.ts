import { NextRequest, NextResponse } from "next/server";
import { db, images } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const postImages = await db
      .select()
      .from(images)
      .where(eq(images.postId, parseInt(postId)))
      .orderBy(asc(images.sortOrder), asc(images.createdAt));

    return NextResponse.json(postImages);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, filename, originalName, alt, caption, size, mimeType, width, height, isHero } = body;

    const [newImage] = await db
      .insert(images)
      .values({
        postId,
        filename,
        originalName,
        alt: alt || "",
        caption: caption || "",
        size,
        mimeType,
        width: width || 0,
        height: height || 0,
        isHero: isHero || false,
        sortOrder: 0,
      })
      .returning();

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error("Error creating image record:", error);
    return NextResponse.json({ error: "Failed to create image record" }, { status: 500 });
  }
}