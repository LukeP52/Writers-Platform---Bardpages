import { NextRequest, NextResponse } from "next/server";
import { db, writingGoals } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);

    const goals = await db
      .select()
      .from(writingGoals)
      .where(eq(writingGoals.manuscriptId, manuscriptId))
      .orderBy(writingGoals.createdAt);

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching writing goals:", error);
    return NextResponse.json({ error: "Failed to fetch writing goals" }, { status: 500 });
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
    const { sectionId, type, targetWords, targetCharacters, targetTime, deadline } = body;

    if (!type) {
      return NextResponse.json({ error: "Goal type is required" }, { status: 400 });
    }

    const result = await db.insert(writingGoals).values({
      manuscriptId,
      sectionId: sectionId || null,
      type,
      targetWords: targetWords || null,
      targetCharacters: targetCharacters || null,
      targetTime: targetTime || null,
      deadline: deadline || null,
    }).returning();

    const newGoals = Array.isArray(result) ? result : [];
    
    if (newGoals.length === 0) {
      throw new Error("Failed to create writing goal");
    }

    return NextResponse.json(newGoals[0]);
  } catch (error) {
    console.error("Error creating writing goal:", error);
    return NextResponse.json({ error: "Failed to create writing goal" }, { status: 500 });
  }
}