import { NextRequest, NextResponse } from "next/server";
import { db, snapshots } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sectionId = parseInt(resolvedParams.id);

    const sectionSnapshots = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.sectionId, sectionId))
      .orderBy(desc(snapshots.createdAt));

    return NextResponse.json(sectionSnapshots);
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
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
    const { manuscriptId, title, content, wordCount, description, isAutomatic } = body;

    if (!title?.trim() || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Get the next version number
    const latestSnapshot = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.sectionId, sectionId))
      .orderBy(desc(snapshots.version))
      .limit(1);

    const nextVersion = latestSnapshot.length > 0 ? latestSnapshot[0].version + 1 : 1;

    const result = await db.insert(snapshots).values({
      sectionId,
      manuscriptId,
      title: title.trim(),
      content,
      wordCount: wordCount || 0,
      version: nextVersion,
      description: description || null,
      isAutomatic: isAutomatic !== false, // default to true
    }).returning();

    const newSnapshots = Array.isArray(result) ? result : [];
    
    if (newSnapshots.length === 0) {
      throw new Error("Failed to create snapshot");
    }

    return NextResponse.json(newSnapshots[0]);
  } catch (error) {
    console.error("Error creating snapshot:", error);
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
}