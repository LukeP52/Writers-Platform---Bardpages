import { NextRequest, NextResponse } from "next/server";
import { db, comments } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sectionId = parseInt(resolvedParams.id);

    const sectionComments = await db
      .select()
      .from(comments)
      .where(eq(comments.sectionId, sectionId))
      .orderBy(comments.createdAt);

    return NextResponse.json(sectionComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sectionId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { manuscriptId, content, position, length, type } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const result = await db.insert(comments).values({
      sectionId,
      manuscriptId,
      content: content.trim(),
      position: position || 0,
      length: length || 0,
      type: type || 'comment',
    }).returning();

    const newComments = Array.isArray(result) ? result : [];
    
    if (newComments.length === 0) {
      throw new Error("Failed to create comment");
    }

    return NextResponse.json(newComments[0]);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}