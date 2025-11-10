import { NextRequest, NextResponse } from "next/server";
import { db, writingSessions } from "@/lib/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const stats = await db
      .select({
        wordsWritten: sql<number>`COALESCE(SUM(${writingSessions.wordsWritten}), 0)`,
        charactersWritten: sql<number>`COALESCE(SUM(${writingSessions.charactersWritten}), 0)`,
        timeSpent: sql<number>`COALESCE(SUM(${writingSessions.timeSpent}), 0)`,
        sessionsCount: sql<number>`COUNT(*)`
      })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.manuscriptId, manuscriptId),
          gte(writingSessions.startedAt, startOfDay.toISOString()),
          lte(writingSessions.startedAt, endOfDay.toISOString())
        )
      );

    return NextResponse.json(stats[0] || {
      wordsWritten: 0,
      charactersWritten: 0,
      timeSpent: 0,
      sessionsCount: 0
    });
  } catch (error) {
    console.error("Error fetching writing stats:", error);
    return NextResponse.json({ error: "Failed to fetch writing stats" }, { status: 500 });
  }
}