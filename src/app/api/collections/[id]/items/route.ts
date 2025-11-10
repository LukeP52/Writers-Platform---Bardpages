import { NextRequest, NextResponse } from "next/server";
import { db, collectionItems } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const collectionId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { sectionId } = body;

    if (!sectionId) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 });
    }

    // Check if already exists
    const existing = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.sectionId, sectionId)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json({ message: "Section already in collection" });
    }

    await db.insert(collectionItems).values({
      collectionId,
      sectionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding to collection:", error);
    return NextResponse.json({ error: "Failed to add to collection" }, { status: 500 });
  }
}