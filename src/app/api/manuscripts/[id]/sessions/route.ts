import { NextRequest, NextResponse } from "next/server";
import { db, writingSessions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const sessions = await db
      .select()
      .from(writingSessions)
      .where(eq(writingSessions.manuscriptId, manuscriptId))
      .orderBy(desc(writingSessions.startedAt))
      .limit(limit);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching writing sessions:", error);
    return NextResponse.json({ error: "Failed to fetch writing sessions" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { sectionId, wordsWritten, charactersWritten, timeSpent, sessionGoal, startedAt, endedAt } = body;

    const goalAchieved = sessionGoal ? wordsWritten >= sessionGoal : false;

    const result = await db.insert(writingSessions).values({
      manuscriptId,
      sectionId: sectionId || null,
      wordsWritten,
      charactersWritten,
      timeSpent,
      startedAt,
      endedAt,
      sessionGoal: sessionGoal || null,
      goalAchieved,
    }).returning();

    const newSessions = Array.isArray(result) ? result : [];
    
    if (newSessions.length === 0) {
      throw new Error("Failed to create writing session");
    }

    return NextResponse.json(newSessions[0]);
  } catch (error) {
    console.error("Error creating writing session:", error);
    return NextResponse.json({ error: "Failed to create writing session" }, { status: 500 });
  }
}