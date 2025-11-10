import { NextRequest, NextResponse } from "next/server";
import { db, manuscripts, sections } from "@/lib/db";
import { eq } from "drizzle-orm";

interface SaveBookRequest {
  manuscriptId: number;
  title: string;
  content: string;
  wordCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveBookRequest = await request.json();
    const { manuscriptId, title, content, wordCount } = body;

    if (!manuscriptId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: manuscriptId, title, content" },
        { status: 400 }
      );
    }

    // Update manuscript with the compiled book content
    const updatedManuscript = await db
      .update(manuscripts)
      .set({
        title: title,
        wordCount: wordCount || 0,
        status: "completed",
        updatedAt: new Date().toISOString(),
        // Store the compiled book content in settings as JSON
        settings: JSON.stringify({
          compiledBookContent: content,
          lastCompiled: new Date().toISOString(),
          contentType: "compiled-book"
        })
      })
      .where(eq(manuscripts.id, manuscriptId))
      .returning();

    if (updatedManuscript.length === 0) {
      return NextResponse.json(
        { error: "Manuscript not found" },
        { status: 404 }
      );
    }

    // Optional: Create a special "compiled book" section to store the final content
    await db.insert(sections).values({
      manuscriptId: manuscriptId,
      title: `${title} - Compiled Book`,
      content: content,
      synopsis: "Final compiled book content",
      type: "document",
      sortOrder: 9999, // Put it at the end
      wordCount: wordCount || 0,
      includeInCompile: false, // Don't include this in future compilations
      notes: "Auto-generated compiled book section",
      status: "completed",
      customIcon: "📖",
      keywords: "compiled, book, final"
    });

    return NextResponse.json({
      success: true,
      message: "Book saved successfully",
      manuscript: updatedManuscript[0],
      savedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error saving book:", error);
    return NextResponse.json(
      { 
        error: "Failed to save book",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manuscriptId = searchParams.get('manuscriptId');

    if (!manuscriptId) {
      return NextResponse.json(
        { error: "manuscriptId parameter is required" },
        { status: 400 }
      );
    }

    // Get the manuscript with saved book content
    const manuscript = await db
      .select()
      .from(manuscripts)
      .where(eq(manuscripts.id, parseInt(manuscriptId)))
      .limit(1);

    if (manuscript.length === 0) {
      return NextResponse.json(
        { error: "Manuscript not found" },
        { status: 404 }
      );
    }

    let savedBookContent = null;
    let lastCompiled = null;

    try {
      if (manuscript[0].settings) {
        const settings = JSON.parse(manuscript[0].settings);
        savedBookContent = settings.compiledBookContent || null;
        lastCompiled = settings.lastCompiled || null;
      }
    } catch (parseError) {
      console.warn("Could not parse manuscript settings:", parseError);
    }

    return NextResponse.json({
      success: true,
      manuscript: manuscript[0],
      savedBookContent,
      lastCompiled,
      hasSavedContent: !!savedBookContent
    });

  } catch (error) {
    console.error("Error retrieving saved book:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve saved book",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}