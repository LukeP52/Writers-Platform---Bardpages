import { NextRequest, NextResponse } from "next/server";
import { db, comments } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const commentId = parseInt(resolvedParams.id);
    const body = await request.json();

    const result = await db.update(comments)
      .set({
        ...body,
        updatedAt: new Date().toISOString()
      })
      .where(eq(comments.id, commentId))
      .returning();

    const updatedComments = Array.isArray(result) ? result : [];

    if (updatedComments.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json(updatedComments[0]);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const commentId = parseInt(resolvedParams.id);

    await db.delete(comments).where(eq(comments.id, commentId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}