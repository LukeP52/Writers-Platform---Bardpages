import { db, posts, categories, tags, postCategories, postTags, images, manuscripts, sections } from "@/lib/db";
import { eq, inArray, and, gte, lte, desc, asc } from "drizzle-orm";
import { BookCompilationOptions, BookStructure, PostWithRelations } from "@/types";

export class BookCompiler {
  private options: BookCompilationOptions & { manuscriptId?: number };

  constructor(options: BookCompilationOptions & { manuscriptId?: number }) {
    this.options = options;
  }

  async fetchPosts(): Promise<PostWithRelations[]> {
    if (this.options.manuscriptId) {
      // Fetch posts from manuscript sections in storyboard order
      return this.fetchManuscriptPosts();
    } else {
      // Original logic: fetch all posts
      const allPosts = await db.select().from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.createdAt));

      // For now, just return posts with empty relations to avoid complex queries
      const postsWithRelations: PostWithRelations[] = allPosts.map(post => ({
        ...post,
        categories: [],
        tags: [],
      }));

      return postsWithRelations;
    }
  }

  private async fetchManuscriptPosts(): Promise<PostWithRelations[]> {
    // Fetch manuscript sections with their linked posts in storyboard order
    const manuscriptSections = await db
      .select({
        section: sections,
        post: posts,
      })
      .from(sections)
      .leftJoin(posts, eq(sections.postId, posts.id))
      .where(and(
        eq(sections.manuscriptId, this.options.manuscriptId!),
        eq(sections.type, "document") // Only include document sections
      ))
      .orderBy(sections.sortOrder);

    // Map ALL sections to PostWithRelations, using section content if no linked post
    const postsWithRelations: PostWithRelations[] = manuscriptSections.map(item => {
      if (item.post) {
        // Use linked post data
        return {
          ...item.post,
          categories: [],
          tags: [],
        };
      } else {
        // Use section data as post data
        return {
          id: item.section.id,
          title: item.section.title,
          content: item.section.content || "",
          excerpt: item.section.synopsis || (item.section.content ? item.section.content.substring(0, 200) : ""),
          dateOfEvent: item.section.dateOfEvent || new Date().toISOString().split('T')[0],
          yearOfEvent: item.section.dateOfEvent ? new Date(item.section.dateOfEvent).getFullYear() : new Date().getFullYear(),
          slug: `section-${item.section.id}`,
          status: "published" as const,
          createdAt: item.section.createdAt,
          updatedAt: item.section.updatedAt || item.section.createdAt,
          categories: [],
          tags: [],
        };
      }
    });

    return postsWithRelations;
  }

  organizeIntoChapters(posts: PostWithRelations[]): BookStructure {
    const chapterTitle = this.options.manuscriptId ? 
      "Manuscript Content" : 
      "Historical Events";
    
    // Simple organization - just one chapter with all posts
    const chapters = [
      {
        title: chapterTitle,
        posts: posts,
      }
    ];

    return {
      metadata: {
        title: this.options.title,
        subtitle: this.options.subtitle,
        author: this.options.author,
        generatedAt: new Date().toISOString(),
        totalPosts: posts.length,
      },
      chapters,
      tableOfContents: this.generateTableOfContents(chapters),
    };
  }

  private generateTableOfContents(chapters: any[]): any[] {
    return chapters.map((chapter, index) => ({
      title: chapter.title,
      page: index + 1,
      posts: chapter.posts.length,
    }));
  }

  async generateHTML(): Promise<string> {
    const posts = await this.fetchPosts();
    const structure = this.organizeIntoChapters(posts);

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${structure.metadata.title}</title>
        <style>
          body { font-family: serif; line-height: 1.6; margin: 40px; }
          .cover { text-align: center; page-break-after: always; }
          .chapter { page-break-before: always; }
          .post { margin-bottom: 2em; page-break-inside: avoid; }
          h1, h2, h3 { color: #333; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>${structure.metadata.title}</h1>
          ${structure.metadata.subtitle ? `<h2>${structure.metadata.subtitle}</h2>` : ''}
          <h3>by ${structure.metadata.author}</h3>
        </div>
    `;

    structure.chapters.forEach(chapter => {
      html += `
        <div class="chapter">
          <h1>${chapter.title}</h1>
      `;

      chapter.posts.forEach((post: any) => {
        html += `
          <div class="post">
            <h2>${post.title}</h2>
            <p><strong>Date:</strong> ${new Date(post.dateOfEvent).toLocaleDateString()}</p>
            <div>${post.content}</div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `
      </body>
      </html>
    `;

    return html;
  }
}