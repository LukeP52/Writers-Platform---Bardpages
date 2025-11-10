import { NextRequest, NextResponse } from "next/server";
import { db, tags } from "@/lib/db";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allTags = await db
      .select()
      .from(tags)
      .orderBy(asc(tags.name));

    return NextResponse.json(allTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, color } = body;

    const [newTag] = await db
      .insert(tags)
      .values({
        name,
        slug,
        description,
        color,
      })
      .returning();

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}