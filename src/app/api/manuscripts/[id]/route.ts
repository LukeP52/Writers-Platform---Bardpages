import { NextRequest, NextResponse } from "next/server";
import { db, manuscripts } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);

    const manuscript = await db
      .select()
      .from(manuscripts)
      .where(eq(manuscripts.id, manuscriptId))
      .limit(1);

    if (manuscript.length === 0) {
      return NextResponse.json({ error: "Manuscript not found" }, { status: 404 });
    }

    return NextResponse.json(manuscript[0]);
  } catch (error) {
    console.error("Error fetching manuscript:", error);
    return NextResponse.json({ error: "Failed to fetch manuscript" }, { status: 500 });
  }
}