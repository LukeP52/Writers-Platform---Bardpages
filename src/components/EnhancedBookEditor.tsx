"use client";

import dynamic from 'next/dynamic';

// Dynamic import for BookEditor to avoid SSR issues
const BookEditor = dynamic(() => import('./BookEditor'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading TinyMCE editor...</div>
});

interface Section {
  id: number;
  manuscriptId: number;
  postId: number | null;
  title: string;
  content: string;
  synopsis: string;
  type: string;
  sortOrder: number;
  dateOfEvent: string | null;
  createdAt: string;
  post?: {
    id: number;
    title: string;
    content: string;
    excerpt: string;
    dateOfEvent: string;
    yearOfEvent: number;
    status: "draft" | "published";
    createdAt: string;
  };
}

interface EnhancedBookEditorProps {
  sections: Section[];
  bookTitle: string;
  bookAuthor: string;
  onSave: (content: string) => Promise<void>;
  onExport: (content: string) => void;
  pageSize?: string;
  onPageSizeChange?: (pageSize: string) => void;
}

export default function EnhancedBookEditor({ 
  sections, 
  bookTitle, 
  bookAuthor, 
  onSave, 
  onExport,
  pageSize = "a4",
  onPageSizeChange
}: EnhancedBookEditorProps) {
  return (
    <BookEditor
      sections={sections}
      bookTitle={bookTitle}
      bookAuthor={bookAuthor}
      onSave={onSave}
      onExport={onExport}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
    />
  );
}