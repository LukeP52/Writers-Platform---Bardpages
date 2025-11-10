import { NextRequest, NextResponse } from "next/server";
import { db, tags, postTags } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const tagId = parseInt(resolvedParams.id);

    // Delete related records first
    await db.delete(postTags).where(eq(postTags.tagId, tagId));
    
    // Delete the tag
    await db.delete(tags).where(eq(tags.id, tagId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}