import { NextRequest, NextResponse } from "next/server";
import { db, images } from "@/lib/db";
import { eq } from "drizzle-orm";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const imageId = parseInt(resolvedParams.id);

    // Get image info before deleting
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, imageId));

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from database
    await db.delete(images).where(eq(images.id, imageId));

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), "public", "uploads", image.filename);
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue even if file deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const imageId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { alt, caption, isHero, sortOrder } = body;

    const [updatedImage] = await db
      .update(images)
      .set({
        alt,
        caption,
        isHero,
        sortOrder,
      })
      .where(eq(images.id, imageId))
      .returning();

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
  }
}