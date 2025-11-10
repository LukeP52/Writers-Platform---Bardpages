import { NextRequest, NextResponse } from "next/server";
import { db, snapshots } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const snapshotId = parseInt(resolvedParams.id);

    await db.delete(snapshots).where(eq(snapshots.id, snapshotId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting snapshot:", error);
    return NextResponse.json({ error: "Failed to delete snapshot" }, { status: 500 });
  }
}