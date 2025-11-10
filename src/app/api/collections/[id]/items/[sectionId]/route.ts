import { NextRequest, NextResponse } from "next/server";
import { db, collectionItems } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const collectionId = parseInt(resolvedParams.id);
    const sectionId = parseInt(resolvedParams.sectionId);

    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.sectionId, sectionId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from collection:", error);
    return NextResponse.json({ error: "Failed to remove from collection" }, { status: 500 });
  }
}