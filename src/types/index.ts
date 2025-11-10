import { Post, Category, Tag } from "@/lib/db";

export interface PostWithRelations extends Post {
  categories: Category[];
  tags: Tag[];
}

export interface FilterOptions {
  eventTypes: string[];
  eras: string[];
  regions: string[];
  tags: string[];
  status: "all" | "draft" | "published";
  yearFrom?: number;
  yearTo?: number;
  search?: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  excerpt: string;
  dateOfEvent: string; // YYYY-MM-DD
  categoryIds: number[];
  tagIds: number[];
  status: "draft" | "published";
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: number;
}

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
  totalTags: number;
  postsThisMonth: number;
}

export interface CategoryCount extends Category {
  _count: number;
}

export interface TagCount extends Tag {
  _count: number;
}

export interface BookCompilationOptions {
  title: string;
  subtitle?: string;
  author: string;
  includeStatus: "all" | "published" | "draft";
  sortBy: "date" | "chronological" | "category";
  includeImages: boolean;
  includeCategories: string[];
  includeTags: string[];
  yearFrom?: number;
  yearTo?: number;
  template: "standard" | "academic" | "coffee-table" | "minimal";
  pageSize: "a4" | "us-letter" | "a5" | "6x9";
  fontSize: "small" | "medium" | "large";
  includeTableOfContents: boolean;
  includeCoverPage: boolean;
  includeIndex: boolean;
}

export interface BookChapter {
  title: string;
  posts: PostWithRelations[];
  startPage?: number;
}

export interface BookStructure {
  metadata: {
    title: string;
    subtitle?: string;
    author: string;
    generatedAt: string;
    totalPosts: number;
    totalPages?: number;
  };
  chapters: BookChapter[];
  tableOfContents: {
    title: string;
    page: number;
    level: number;
  }[];
}

export interface CompilationProgress {
  stage: "preparing" | "fetching" | "organizing" | "generating" | "complete" | "error";
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
}