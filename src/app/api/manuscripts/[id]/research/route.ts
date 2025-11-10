import { NextRequest, NextResponse } from "next/server";
import { db, researchReferences } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);

    const references = await db
      .select()
      .from(researchReferences)
      .where(eq(researchReferences.manuscriptId, manuscriptId))
      .orderBy(desc(researchReferences.isPinned), desc(researchReferences.updatedAt));

    return NextResponse.json(references);
  } catch (error) {
    console.error("Error fetching research references:", error);
    return NextResponse.json({ error: "Failed to fetch research references" }, { status: 500 });
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
    const { title, content, source, type, tags } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const result = await db.insert(researchReferences).values({
      manuscriptId,
      title: title.trim(),
      content: content.trim(),
      source: source || null,
      type,
      tags: tags || null,
    }).returning();

    const newReferences = Array.isArray(result) ? result : [];
    
    if (newReferences.length === 0) {
      throw new Error("Failed to create research reference");
    }

    return NextResponse.json(newReferences[0]);
  } catch (error) {
    console.error("Error creating research reference:", error);
    return NextResponse.json({ error: "Failed to create research reference" }, { status: 500 });
  }
}