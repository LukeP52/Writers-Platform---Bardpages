import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  dateOfEvent: text("date_of_event").notNull(), // YYYY-MM-DD format
  yearOfEvent: integer("year_of_event").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: text("type", { enum: ["event_type", "era", "region"] }).notNull(),
  color: text("color").default("#3b82f6"), // hex color for UI
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#64748b"),
});

export const postCategories = sqliteTable("post_categories", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.categoryId] })
}));

export const postTags = sqliteTable("post_tags", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] })
}));

export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  alt: text("alt"),
  caption: text("caption"),
  size: integer("size").notNull(), // in bytes
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  isHero: integer("is_hero", { mode: "boolean" }).default(false), // main image for the post
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
// Manuscript management tables for the ring-binder metaphor
export const manuscripts = sqliteTable("manuscripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "in_progress", "completed"] }).default("draft").notNull(),
  wordCount: integer("word_count").default(0),
  targetWordCount: integer("target_word_count"),
  settings: text("settings"), // JSON for themes, formatting preferences, etc.
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  manuscriptId: integer("manuscript_id").notNull().references(() => manuscripts.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // for nested sections - self reference
  postId: integer("post_id").references(() => posts.id, { onDelete: "set null" }), // Link to historical post
  title: text("title").notNull(),
  content: text("content").default(""),
  synopsis: text("synopsis"), // for corkboard and outliner
  type: text("type", { enum: ["folder", "document", "note", "research", "character", "location", "scene", "historical_event"] }).default("document").notNull(),
  sortOrder: integer("sort_order").default(0),
  wordCount: integer("word_count").default(0),
  targetWordCount: integer("target_word_count"),
  includeInCompile: integer("include_in_compile", { mode: "boolean" }).default(true),
  notes: text("notes"), // side notes/annotations
  status: text("status").default("draft"), // custom status tracking
  label: text("label"), // color-coded label
  keywords: text("keywords"), // comma-separated keywords
  customIcon: text("custom_icon"), // custom icon identifier
  dateOfEvent: text("date_of_event"), // For historical events (from linked post)
  metadata: text("metadata"), // JSON for custom fields
  corkboardPosition: text("corkboard_position"), // JSON for corkboard layout {x, y}
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const footnotes = sqliteTable("footnotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  position: integer("position").notNull(), // character position in content
  style: text("style", { enum: ["numbered", "lettered", "symbol"] }).default("numbered").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Collections for organizing related documents
export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  manuscriptId: integer("manuscript_id").notNull().references(() => manuscripts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  isSmartCollection: integer("is_smart_collection", { mode: "boolean" }).default(false),
  smartFilters: text("smart_filters"), // JSON for filter criteria
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const collectionItems = sqliteTable("collection_items", {
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.collectionId, table.sectionId] })
}));

// Templates for reusable document structures
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  manuscriptId: integer("manuscript_id").references(() => manuscripts.id, { onDelete: "cascade" }), // null for global templates
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["character", "location", "scene", "document", "folder"] }).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON for template fields
  icon: text("icon"),
  isGlobal: integer("is_global", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Comments and annotations system
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  manuscriptId: integer("manuscript_id").notNull().references(() => manuscripts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  position: integer("position").notNull(), // character position in content
  length: integer("length").default(0), // length of highlighted text
  type: text("type", { enum: ["comment", "annotation", "revision", "highlight"] }).default("comment").notNull(),
  status: text("status", { enum: ["open", "resolved", "archived"] }).default("open").notNull(),
  color: text("color").default("#fbbf24"), // yellow default for highlights
  authorNote: text("author_note"), // additional notes from author
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Version snapshots for revision tracking
export const snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  manuscriptId: integer("manuscript_id").notNull().references(() => manuscripts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  version: integer("version").notNull(),
  description: text("description"), // snapshot description
  isAutomatic: integer("is_automatic", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Writing history and session tracking
export const writingSessions = sqliteTable("writing_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  manuscriptId: integer("manuscript_id").notNull().references(() => manuscripts.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").references(() => sections.id, { onDelete: "cascade" }),
  wordsWritten: integer("words_written").notNull(),
  charactersWritten: integer("characters_written").notNull(),
  timeSpent: integer("time_spent").notNull(), // in minutes
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at").notNull(),
  sessionGoal: integer("session_goal"), // word count goal for session
  goalAchieved: integer("goal_achieved", { mode: "boolean" }).default(false),
});

// Writing goals and targets
export const writingGoals = sqliteTable("writing_goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  manuscriptId: integer("manuscript_id").notNull().references(() => manuscripts.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").references(() => sections.id, { onDelete: "cascade" }), // null for manuscript-wide goals
  type: text("type", { enum: ["daily", "weekly", "monthly", "total", "session"] }).notNull(),
  targetWords: integer("target_words"),
  targetCharacters: integer("target_characters"),
  targetTime: integer("target_time"), // in minutes
  deadline: text("deadline"), // YYYY-MM-DD
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Progress tracking for goals
export const goalProgress = sqliteTable("goal_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: integer("goal_id").notNull().references(() => writingGoals.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  wordsWritten: integer("words_written").default(0),
  charactersWritten: integer("characters_written").default(0),
  timeSpent: integer("time_spent").default(0), // in minutes
  goalMet: integer("goal_met", { mode: "boolean" }).default(false),
});

// Research references for integration
export const researchReferences = sqliteTable("research_references", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  manuscriptId: integer("manuscript_id").notNull().references(() => manuscripts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"), // URL, book citation, etc.
  type: text("type", { enum: ["web", "book", "article", "interview", "document", "image"] }).notNull(),
  tags: text("tags"), // comma-separated for filtering
  isPinned: integer("is_pinned", { mode: "boolean" }).default(false), // quick access
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type Manuscript = typeof manuscripts.$inferSelect;
export type NewManuscript = typeof manuscripts.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Footnote = typeof footnotes.$inferSelect;
export type NewFootnote = typeof footnotes.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;
export type WritingSession = typeof writingSessions.$inferSelect;
export type NewWritingSession = typeof writingSessions.$inferInsert;
export type WritingGoal = typeof writingGoals.$inferSelect;
export type NewWritingGoal = typeof writingGoals.$inferInsert;
export type GoalProgress = typeof goalProgress.$inferSelect;
export type NewGoalProgress = typeof goalProgress.$inferInsert;
export type ResearchReference = typeof researchReferences.$inferSelect;
export type NewResearchReference = typeof researchReferences.$inferInsert;