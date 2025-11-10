import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { db, images } from "@/lib/db";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const postId = formData.get("postId") as string;
    const alt = formData.get("alt") as string;
    const caption = formData.get("caption") as string;
    const isHero = formData.get("isHero") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    // Create unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    
    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with Sharp to get dimensions and optimize
    const imageProcessor = sharp(buffer);
    const metadata = await imageProcessor.metadata();
    
    // Optimize image (reduce quality slightly, convert to WebP if large)
    let processedBuffer = buffer;
    let finalFilename = uniqueFilename;
    
    if (file.size > 2 * 1024 * 1024) { // If larger than 2MB, optimize
      processedBuffer = Buffer.from(await imageProcessor
        .webp({ quality: 85 })
        .toBuffer());
      finalFilename = `${uuidv4()}.webp`;
    }

    // Save file
    const filePath = join(uploadDir, finalFilename);
    await writeFile(filePath, processedBuffer);

    // If postId is provided, save to database
    if (postId && postId !== "null" && postId !== "undefined") {
      const [savedImage] = await db.insert(images).values({
        postId: parseInt(postId),
        filename: finalFilename,
        originalName: file.name,
        alt: alt || "",
        caption: caption || "",
        size: processedBuffer.length,
        mimeType: finalFilename.endsWith(".webp") ? "image/webp" : file.type,
        width: metadata.width || 0,
        height: metadata.height || 0,
        isHero: isHero,
        sortOrder: 0,
      }).returning();

      return NextResponse.json({
        success: true,
        image: savedImage,
        url: `/uploads/${finalFilename}`,
      });
    }

    // Return temporary upload info (for use during post creation)
    return NextResponse.json({
      success: true,
      filename: finalFilename,
      originalName: file.name,
      size: processedBuffer.length,
      mimeType: finalFilename.endsWith(".webp") ? "image/webp" : file.type,
      width: metadata.width || 0,
      height: metadata.height || 0,
      url: `/uploads/${finalFilename}`,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}