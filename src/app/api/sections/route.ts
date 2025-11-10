import { NextRequest, NextResponse } from "next/server";
import { db, sections } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manuscriptId, parentId, title, type } = body;

    if (!manuscriptId || !title?.trim()) {
      return NextResponse.json({ error: "Manuscript ID and title are required" }, { status: 400 });
    }

    const result = await db.insert(sections).values({
      manuscriptId,
      parentId: parentId || null,
      title: title.trim(),
      type: type || 'document',
      content: "",
      wordCount: 0,
    }).returning();

    const newSections = Array.isArray(result) ? result : [];
    
    if (newSections.length === 0) {
      throw new Error("Failed to create section");
    }

    return NextResponse.json(newSections[0]);
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}