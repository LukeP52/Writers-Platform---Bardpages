import { NextRequest, NextResponse } from "next/server";
import { db, sections } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);

    const manuscriptSections = await db
      .select()
      .from(sections)
      .where(eq(sections.manuscriptId, manuscriptId))
      .orderBy(sections.sortOrder, sections.createdAt);

    return NextResponse.json(manuscriptSections);
  } catch (error) {
    console.error("Error fetching manuscript sections:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
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

    console.log("Creating section with data:", {
      manuscriptId,
      postId: body.postId,
      title: body.title,
      type: body.type,
      dateOfEvent: body.dateOfEvent
    });

    // Calculate word count from content
    const wordCount = body.content ? body.content.trim().split(/\s+/).filter(Boolean).length : 0;

    const insertData = {
      manuscriptId,
      postId: body.postId || null,
      title: body.title,
      content: body.content || "",
      synopsis: body.synopsis || "",
      type: body.type || "document",
      status: body.status || "draft",
      customIcon: body.customIcon || null,
      label: body.label || null,
      sortOrder: body.sortOrder || 0,
      wordCount,
      targetWordCount: body.targetWordCount || null,
      includeInCompile: body.includeInCompile !== false,
      notes: body.notes || "",
      keywords: body.keywords || "",
      dateOfEvent: body.dateOfEvent || null,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      corkboardPosition: body.corkboardPosition ? JSON.stringify(body.corkboardPosition) : null,
    };

    console.log("Insert data prepared:", insertData);

    const result = await db.insert(sections).values(insertData).returning();

    console.log("Database result:", result);

    const newSections = Array.isArray(result) ? result : [];
    
    if (newSections.length === 0) {
      console.error("No sections returned from database insert");
      throw new Error("Failed to create section - no data returned");
    }

    console.log("Section created successfully:", newSections[0]);
    return NextResponse.json(newSections[0]);
  } catch (error) {
    console.error("Error creating section:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      name: error instanceof Error ? error.name : "Unknown"
    });
    return NextResponse.json({ 
      error: "Failed to create section",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}