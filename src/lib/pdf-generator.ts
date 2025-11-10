import { BookStructure, BookCompilationOptions } from "@/types";
import { formatDate } from "@/lib/utils";
import { join } from "path";

export class PDFGenerator {
  private options: BookCompilationOptions;
  private structure: BookStructure;

  constructor(options: BookCompilationOptions, structure: BookStructure) {
    this.options = options;
    this.structure = structure;
  }

  generateHTML(): string {
    const styles = this.getStyles();
    const coverPage = this.options.includeCoverPage ? this.generateCoverPage() : "";
    const tableOfContents = this.options.includeTableOfContents ? this.generateTableOfContents() : "";
    const chapters = this.generateChapters();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.structure.metadata.title}</title>
        <style>${styles}</style>
      </head>
      <body>
        ${coverPage}
        ${tableOfContents}
        ${chapters}
      </body>
      </html>
    `;
  }

  private getStyles(): string {
    const fontSize = {
      small: "12px",
      medium: "14px",
      large: "16px"
    }[this.options.fontSize];

    const pageSize = this.options.pageSize === "a4" ? "A4" : 
                    this.options.pageSize === "us-letter" ? "Letter" :
                    this.options.pageSize === "a5" ? "A5" : "6in 9in";

    return `
      @page {
        size: ${pageSize};
        margin: 1in 0.75in;
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: ${fontSize};
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }

      .page-break {
        page-break-before: always;
      }

      .cover-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
        page-break-after: always;
      }

      .cover-title {
        font-size: 2.5em;
        font-weight: bold;
        margin-bottom: 0.5em;
        color: #1a365d;
      }

      .cover-subtitle {
        font-size: 1.3em;
        margin-bottom: 2em;
        color: #666;
        font-style: italic;
      }

      .cover-author {
        font-size: 1.2em;
        margin-top: 2em;
        color: #333;
      }

      .toc {
        page-break-after: always;
      }

      .toc-title {
        font-size: 1.8em;
        font-weight: bold;
        margin-bottom: 1em;
        text-align: center;
        color: #1a365d;
      }

      .toc-entry {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5em;
        border-bottom: 1px dotted #ccc;
        padding-bottom: 0.2em;
      }

      .toc-entry.level-1 {
        font-weight: bold;
        margin-top: 1em;
      }

      .chapter {
        page-break-before: always;
      }

      .chapter-title {
        font-size: 1.5em;
        font-weight: bold;
        margin-bottom: 1.5em;
        color: #1a365d;
        border-bottom: 2px solid #1a365d;
        padding-bottom: 0.5em;
      }

      .post {
        margin-bottom: 2em;
        page-break-inside: avoid;
      }

      .post-title {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 0.5em;
        color: #2d3748;
      }

      .post-date {
        font-size: 0.9em;
        color: #666;
        margin-bottom: 0.5em;
        font-style: italic;
      }

      .post-excerpt {
        margin-bottom: 1em;
        font-weight: 500;
        color: #4a5568;
      }

      .post-content {
        text-align: justify;
        margin-bottom: 1em;
      }

      .post-content p {
        margin-bottom: 0.8em;
      }

      .post-images {
        margin: 1em 0;
      }

      .post-image {
        max-width: 100%;
        height: auto;
        margin: 0.5em 0;
        page-break-inside: avoid;
      }

      .image-caption {
        font-size: 0.9em;
        color: #666;
        font-style: italic;
        text-align: center;
        margin-top: 0.3em;
      }

      .post-categories, .post-tags {
        margin-top: 1em;
        font-size: 0.9em;
      }

      .category, .tag {
        display: inline-block;
        background-color: #e2e8f0;
        color: #2d3748;
        padding: 0.2em 0.5em;
        margin: 0.1em;
        border-radius: 0.3em;
        font-size: 0.8em;
      }

      .divider {
        border-top: 1px solid #e2e8f0;
        margin: 1.5em 0;
      }

      /* Template-specific styles */
      ${this.getTemplateStyles()}
    `;
  }

  private getTemplateStyles(): string {
    switch (this.options.template) {
      case "academic":
        return `
          body { font-family: 'Times New Roman', serif; }
          .chapter-title { text-transform: uppercase; letter-spacing: 1px; }
          .post-title { text-decoration: underline; }
        `;
      case "coffee-table":
        return `
          .post-image { max-width: 80%; margin: 1em auto; display: block; }
          .image-caption { font-size: 1em; margin-bottom: 1em; }
          .post { page-break-before: always; }
        `;
      case "minimal":
        return `
          .chapter-title { border: none; font-size: 1.3em; }
          .category, .tag { display: none; }
          .post-date { display: none; }
        `;
      default:
        return "";
    }
  }

  private generateCoverPage(): string {
    return `
      <div class="cover-page">
        <h1 class="cover-title">${this.structure.metadata.title}</h1>
        ${this.structure.metadata.subtitle ? `<h2 class="cover-subtitle">${this.structure.metadata.subtitle}</h2>` : ""}
        <div class="cover-author">by ${this.structure.metadata.author}</div>
        <div style="margin-top: 3em; font-size: 0.9em; color: #666;">
          ${this.structure.metadata.totalPosts} Historical Events
        </div>
      </div>
    `;
  }

  private generateTableOfContents(): string {
    return `
      <div class="toc">
        <h2 class="toc-title">Table of Contents</h2>
        ${this.structure.tableOfContents.map(entry => `
          <div class="toc-entry level-${entry.level}">
            <span>${entry.title}</span>
            <span>${entry.page}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  private generateChapters(): string {
    return this.structure.chapters.map((chapter, chapterIndex) => `
      <div class="chapter">
        <h2 class="chapter-title">${chapter.title}</h2>
        ${chapter.posts.map((post, postIndex) => this.generatePost(post, chapterIndex, postIndex)).join("")}
      </div>
    `).join("");
  }

  private generatePost(post: any, chapterIndex: number, postIndex: number): string {
    const formattedDate = formatDate(post.dateOfEvent);
    const year = post.yearOfEvent;
    
    return `
      <div class="post">
        <h3 class="post-title">${post.title}</h3>
        <div class="post-date">${formattedDate}, ${year}</div>
        <div class="post-excerpt">${post.excerpt}</div>
        <div class="post-content">
          ${this.formatContent(post.content)}
        </div>
        ${this.options.includeImages ? this.generatePostImages(post.id) : ""}
        <div class="post-categories">
          <strong>Categories:</strong>
          ${post.categories.map((cat: any) => `<span class="category">${cat.name}</span>`).join("")}
        </div>
        <div class="post-tags">
          <strong>Tags:</strong>
          ${post.tags.map((tag: any) => `<span class="tag">${tag.name}</span>`).join("")}
        </div>
        ${postIndex < this.structure.chapters[chapterIndex].posts.length - 1 ? '<div class="divider"></div>' : ""}
      </div>
    `;
  }

  private formatContent(content: string): string {
    // Convert line breaks to paragraphs
    return content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  private generatePostImages(postId: number): string {
    // This would need to be populated with actual images
    // For now, return placeholder
    return `
      <div class="post-images">
        <!-- Images for post ${postId} would be inserted here -->
      </div>
    `;
  }
}