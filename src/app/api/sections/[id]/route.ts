import { NextRequest, NextResponse } from "next/server";
import { db, sections } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sectionId = parseInt(resolvedParams.id);
    const body = await request.json();

    const result = await db.update(sections)
      .set({
        ...body,
        updatedAt: new Date().toISOString()
      })
      .where(eq(sections.id, sectionId))
      .returning();

    const updatedSections = Array.isArray(result) ? result : [];

    if (updatedSections.length === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSections[0]);
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sectionId = parseInt(resolvedParams.id);

    await db.delete(sections).where(eq(sections.id, sectionId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}