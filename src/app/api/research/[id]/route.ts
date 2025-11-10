import { NextRequest, NextResponse } from "next/server";
import { db, researchReferences } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const referenceId = parseInt(resolvedParams.id);
    const body = await request.json();

    const result = await db.update(researchReferences)
      .set({
        ...body,
        updatedAt: new Date().toISOString()
      })
      .where(eq(researchReferences.id, referenceId))
      .returning();

    const updatedReferences = Array.isArray(result) ? result : [];

    if (updatedReferences.length === 0) {
      return NextResponse.json({ error: "Research reference not found" }, { status: 404 });
    }

    return NextResponse.json(updatedReferences[0]);
  } catch (error) {
    console.error("Error updating research reference:", error);
    return NextResponse.json({ error: "Failed to update research reference" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const referenceId = parseInt(resolvedParams.id);

    await db.delete(researchReferences).where(eq(researchReferences.id, referenceId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting research reference:", error);
    return NextResponse.json({ error: "Failed to delete research reference" }, { status: 500 });
  }
}