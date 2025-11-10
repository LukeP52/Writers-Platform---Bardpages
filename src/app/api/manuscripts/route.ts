import { NextRequest, NextResponse } from "next/server";
import { db, manuscripts } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, targetWordCount } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const result = await db.insert(manuscripts).values({
      title: title.trim(),
      description: description || null,
      targetWordCount: targetWordCount || null,
    }).returning();

    const newManuscripts = Array.isArray(result) ? result : [];
    
    if (newManuscripts.length === 0) {
      throw new Error("Failed to create manuscript");
    }

    return NextResponse.json(newManuscripts[0]);
  } catch (error) {
    console.error("Error creating manuscript:", error);
    return NextResponse.json({ error: "Failed to create manuscript" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allManuscripts = await db.select().from(manuscripts);
    return NextResponse.json(allManuscripts);
  } catch (error) {
    console.error("Error fetching manuscripts:", error);
    return NextResponse.json({ error: "Failed to fetch manuscripts" }, { status: 500 });
  }
}