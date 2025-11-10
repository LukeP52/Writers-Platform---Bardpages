"use client";

import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import TinyMCEEditor, { EDITOR_CONFIGS } from "./TinyMCEEditor";

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

interface BookEditorProps {
  sections: Section[];
  bookTitle: string;
  bookAuthor: string;
  onSave: (content: string) => Promise<void>;
  onExport: (content: string) => void;
  pageSize?: string;
  onPageSizeChange?: (pageSize: string) => void;
}

export default function BookEditor({ 
  sections, 
  bookTitle, 
  bookAuthor, 
  onSave, 
  onExport,
  pageSize = "a4",
  onPageSizeChange
}: BookEditorProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

  // Initialize content from sections
  useEffect(() => {
    const initialContent = generateInitialContent();
    setContent(initialContent);
  }, [sections, bookTitle, bookAuthor]);

  // Count words when content changes
  useEffect(() => {
    if (content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);
    }
  }, [content]);

  const generateInitialContent = () => {
    let bookContent = `
      <!-- Cover Page -->
      <div class="page-break">
        <div style="text-align: center; margin-top: 100px; margin-bottom: 100px;">
          <h1 style="font-size: 2.5em; margin-bottom: 20px;">${bookTitle}</h1>
          ${bookAuthor ? `<p style="font-size: 1.2em; margin-top: 50px;">by ${bookAuthor}</p>` : ''}
        </div>
      </div>
      
      <!-- Table of Contents -->
      <div class="pagebreak">
        <h2 style="text-align: center; margin-bottom: 30px;">Table of Contents</h2>
        <div style="margin: 20px 0;">
    `;
    
    sections.forEach((section, index) => {
      bookContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dotted #ccc; padding-bottom: 5px;">
          <span>${section.title}</span>
          <span>${index + 3}</span>
        </div>
      `;
    });
    
    bookContent += `
        </div>
      </div>
    `;
    
    // Add content sections
    sections.forEach((section) => {
      const sectionContent = section.post?.content || section.content || section.synopsis || '<p>Enter content here...</p>';
      const sectionDate = section.dateOfEvent || section.post?.dateOfEvent;
      
      bookContent += `
        <div class="pagebreak">
          <h1 style="margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">${section.title}</h1>
          ${sectionDate ? `<p style="font-style: italic; color: #666; margin-bottom: 20px;">${new Date(sectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
          <div style="line-height: 1.6; text-align: justify;">
            ${sectionContent}
          </div>
        </div>
      `;
    });
    
    return bookContent;
  };

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(content);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      onExport(content);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Book Editor</h1>
            <p className="text-sm text-gray-600">{bookTitle}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{pageSize.toUpperCase()}</span>
            </div>
            
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode("editor")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "editor" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📝 Editor
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "preview" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                👁️ Preview
              </button>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? 'Exporting...' : '📄 Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Professional book editor with TinyMCE
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Page Size:</label>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="a4">A4</option>
                <option value="us-letter">US Letter</option>
                <option value="a5">A5</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "editor" ? (
          <div className="h-full p-6">
            <div className="max-w-5xl mx-auto h-full">
              <TinyMCEEditor
                value={content}
                onEditorChange={handleContentChange}
                placeholder="Start writing your book..."
                className="h-full"
                {...EDITOR_CONFIGS.book}
                height="100%"
              />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg" style={{ 
                minHeight: pageSize === 'a4' ? '297mm' : pageSize === 'us-letter' ? '11in' : '210mm',
                width: pageSize === 'a4' ? '210mm' : pageSize === 'us-letter' ? '8.5in' : '148mm',
                margin: '0 auto',
                padding: '1in',
                boxSizing: 'border-box'
              }}>
                <div 
                  className="prose prose-lg max-w-none"
                  style={{
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.6',
                    textAlign: 'justify'
                  }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for page breaks and print styling */}
      <style jsx global>{`
        @media print {
          .pagebreak {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
        
        .pagebreak {
          margin-top: 2em;
          padding-top: 2em;
          border-top: 2px dashed #ccc;
          position: relative;
        }
        
        .pagebreak:before {
          content: "Page Break";
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 0 10px;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}