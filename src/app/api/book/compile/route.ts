import { NextRequest, NextResponse } from "next/server";
import { BookCompiler } from "@/lib/book-compiler";
import { PDFGenerator } from "@/lib/pdf-generator";
import { BookCompilationOptions } from "@/types";
import puppeteer from "puppeteer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const options: BookCompilationOptions = await request.json();

    // Validate required fields
    if (!options.title || !options.author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    // Initialize compiler
    const compiler = new BookCompiler(options);

    // Fetch and organize posts
    const posts = await compiler.fetchPosts();
    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No posts found matching the specified criteria" },
        { status: 400 }
      );
    }

    const bookStructure = compiler.organizeIntoChapters(posts);

    // Generate HTML
    const pdfGenerator = new PDFGenerator(options, bookStructure);
    const html = pdfGenerator.generateHTML();

    // Create output directory
    const outputDir = join(process.cwd(), "public", "books");
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Configure PDF options based on page size
    const pdfOptions: any = {
      format: options.pageSize === "a4" ? "A4" : 
              options.pageSize === "us-letter" ? "Letter" : undefined,
      printBackground: true,
      margin: {
        top: '1in',
        bottom: '1in',
        left: '0.75in',
        right: '0.75in'
      }
    };

    if (options.pageSize === "a5") {
      pdfOptions.format = "A5";
    } else if (options.pageSize === "6x9") {
      pdfOptions.width = "6in";
      pdfOptions.height = "9in";
    }

    const pdf = await page.pdf(pdfOptions);
    await browser.close();

    // Save PDF
    const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4()}.pdf`;
    const filePath = join(outputDir, filename);
    await writeFile(filePath, pdf);

    // Return success response with download URL
    return NextResponse.json({
      success: true,
      downloadUrl: `/books/${filename}`,
      metadata: {
        ...bookStructure.metadata,
        filename,
        fileSize: pdf.length,
        chapters: bookStructure.chapters.length,
        options: {
          template: options.template,
          pageSize: options.pageSize,
          fontSize: options.fontSize,
          includeImages: options.includeImages,
        }
      }
    });

  } catch (error) {
    console.error("Book compilation error:", error);
    return NextResponse.json(
      { error: "Failed to compile book. Please try again." },
      { status: 500 }
    );
  }
}

// Get compilation status/progress (for future use with long-running compilations)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // For now, return a simple response
    // In the future, this could track actual compilation progress
    return NextResponse.json({
      stage: "complete",
      progress: 100,
      message: "Compilation complete"
    });

  } catch (error) {
    console.error("Error checking compilation status:", error);
    return NextResponse.json(
      { error: "Failed to check compilation status" },
      { status: 500 }
    );
  }
}