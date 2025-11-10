import { NextRequest, NextResponse } from "next/server";
import { db, collections, collectionItems, sections } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const manuscriptId = parseInt(resolvedParams.id);

    // Get all collections for this manuscript with section counts
    const manuscriptCollections = await db
      .select({
        id: collections.id,
        manuscriptId: collections.manuscriptId,
        name: collections.name,
        description: collections.description,
        color: collections.color,
        isSmartCollection: collections.isSmartCollection,
        smartFilters: collections.smartFilters,
        createdAt: collections.createdAt,
        sectionCount: sql<number>`COALESCE(COUNT(${collectionItems.sectionId}), 0)`
      })
      .from(collections)
      .leftJoin(collectionItems, eq(collections.id, collectionItems.collectionId))
      .where(eq(collections.manuscriptId, manuscriptId))
      .groupBy(collections.id);

    // Get section IDs for each collection
    const collectionsWithSections = await Promise.all(
      manuscriptCollections.map(async (collection) => {
        const items = await db
          .select({ sectionId: collectionItems.sectionId })
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, collection.id));

        return {
          ...collection,
          sectionIds: items.map(item => item.sectionId)
        };
      })
    );

    return NextResponse.json(collectionsWithSections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
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
    const { name, description, color, isSmartCollection, smartFilters } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const result = await db.insert(collections).values({
      manuscriptId,
      name: name.trim(),
      description: description || null,
      color: color || "#3b82f6",
      isSmartCollection: isSmartCollection || false,
      smartFilters: smartFilters || null,
    }).returning();

    const newCollections = Array.isArray(result) ? result : [];
    
    if (newCollections.length === 0) {
      throw new Error("Failed to create collection");
    }

    return NextResponse.json({
      ...newCollections[0],
      sectionIds: [],
      sectionCount: 0
    });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}