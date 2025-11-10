import { NextRequest, NextResponse } from "next/server";
import { db, categories, postCategories } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.id);

    // Delete related records first
    await db.delete(postCategories).where(eq(postCategories.categoryId, categoryId));
    
    // Delete the category
    await db.delete(categories).where(eq(categories.id, categoryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}