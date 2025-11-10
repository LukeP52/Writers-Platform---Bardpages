"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BookCompilationOptions } from "@/types";
import { formatDate } from "@/lib/utils";
import EnhancedBookEditor from "@/components/EnhancedBookEditor";
import { exportBookToPDF } from "@/lib/pdf-export";

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

interface Manuscript {
  id: number;
  title: string;
  description: string | null;
  status: string;
}

interface CompilationResult {
  success: boolean;
  downloadUrl?: string;
  metadata?: {
    title: string;
    author: string;
    totalPosts: number;
    chapters: number;
    filename: string;
    fileSize: number;
    options: {
      template: string;
      pageSize: string;
      fontSize: string;
      includeImages: boolean;
    };
  };
  error?: string;
}

interface PreviewPage {
  title: string;
  content: string;
  dateOfEvent?: string;
  pageNumber: number;
}

export default function ManuscriptCompiler() {
  const router = useRouter();
  const params = useParams();
  const manuscriptId = params.id as string;

  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [previewPages, setPreviewPages] = useState<PreviewPage[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false);

  const [options, setOptions] = useState<BookCompilationOptions & { manuscriptId: number }>({
    manuscriptId: parseInt(manuscriptId),
    title: "",
    subtitle: "",
    author: "Your Name",
    includeStatus: "all",
    sortBy: "chronological",
    includeImages: true,
    includeCategories: [],
    includeTags: [],
    template: "standard",
    pageSize: "a4",
    fontSize: "medium",
    includeTableOfContents: true,
    includeCoverPage: true,
    includeIndex: false,
  });

  useEffect(() => {
    fetchData();
  }, [manuscriptId]);

  useEffect(() => {
    if (sections.length > 0 && options.template) {
      generatePreview();
    }
  }, [sections, options.template, options.pageSize, options.fontSize]);

  const getPageDimensions = (pageSize: string) => {
    switch (pageSize) {
      case "a4":
        return { width: "210mm", height: "297mm", widthPx: 794, heightPx: 1123 };
      case "us-letter":
        return { width: "8.5in", height: "11in", widthPx: 816, heightPx: 1056 };
      case "a5":
        return { width: "148mm", height: "210mm", widthPx: 559, heightPx: 794 };
      case "6x9":
        return { width: "6in", height: "9in", widthPx: 576, heightPx: 864 };
      default:
        return { width: "210mm", height: "297mm", widthPx: 794, heightPx: 1123 };
    }
  };

  const getFontSizeValue = (fontSize: string) => {
    switch (fontSize) {
      case "small": return "14px";
      case "medium": return "16px";
      case "large": return "18px";
      default: return "16px";
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [manuscriptRes, sectionsRes] = await Promise.all([
        fetch(`/api/manuscripts/${manuscriptId}`),
        fetch(`/api/manuscripts/${manuscriptId}/sections`),
      ]);

      if (!manuscriptRes.ok || !sectionsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const manuscriptData = await manuscriptRes.json();
      const sectionsData = await sectionsRes.json();

      setManuscript(manuscriptData);
      setSections(sectionsData.sort((a: Section, b: Section) => a.sortOrder - b.sortOrder));

      // Set default title from manuscript
      setOptions(prev => ({
        ...prev,
        title: manuscriptData.title || "Untitled Book",
        subtitle: manuscriptData.description || "",
      }));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Failed to load manuscript data. Please try again.");
      router.push("/dashboard/manuscripts");
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    const pages: PreviewPage[] = [];
    
    // Add cover page if enabled
    if (options.includeCoverPage) {
      pages.push({
        title: "Cover Page",
        content: `
          <div style="text-align: center; padding: 100px 20px;">
            <h1 style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: bold;">${options.title}</h1>
            ${options.subtitle ? `<h2 style="font-size: 1.5rem; margin-bottom: 2rem; color: #666;">${options.subtitle}</h2>` : ''}
            <p style="font-size: 1.2rem; margin-top: 3rem;">by ${options.author}</p>
          </div>
        `,
        pageNumber: 1,
      });
    }

    // Add table of contents if enabled
    if (options.includeTableOfContents) {
      const tocContent = sections
        .map((section, index) => `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dotted #ccc;">
            <span>${section.title}</span>
            <span>${pages.length + index + 2}</span>
          </div>
        `)
        .join('');

      pages.push({
        title: "Table of Contents",
        content: `
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 2rem; margin-bottom: 2rem; text-align: center;">Table of Contents</h2>
            ${tocContent}
          </div>
        `,
        pageNumber: pages.length + 1,
      });
    }

    // Add content pages - include ALL sections
    sections.forEach((section, index) => {
      const pageNumber = pages.length + 1;
      const content = section.post?.content || section.content;
      
      pages.push({
        title: section.title,
        content: `
          <div style="padding: 40px 20px; max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem;">
              ${section.title}
            </h1>
            ${section.dateOfEvent ? `
              <p style="font-style: italic; color: #666; margin-bottom: 1.5rem;">
                ${formatDate(section.dateOfEvent)}
              </p>
            ` : ''}
            <div style="font-size: 1.1rem; line-height: 1.6; text-align: justify;">
              ${content ? content.replace(/\n/g, '</p><p>').replace(/^<\/p>/, '').replace(/<p>$/, '') : '<p>No content available</p>'}
            </div>
          </div>
        `,
        dateOfEvent: section.dateOfEvent || undefined,
        pageNumber,
      });
    });

    setPreviewPages(pages);
  };

  const handleCompile = async () => {
    setCompiling(true);
    setResult(null);

    try {
      const response = await fetch("/api/book/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Compilation failed:", error);
      setResult({
        success: false,
        error: "Failed to compile book. Please try again.",
      });
    } finally {
      setCompiling(false);
    }
  };

  const handleSaveBook = async (content: string): Promise<void> => {
    try {
      const response = await fetch("/api/save-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manuscriptId: parseInt(manuscriptId),
          title: options.title,
          content: content,
          wordCount: content.split(/\s+/).filter(word => word.length > 0).length
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save book");
      }

      const data = await response.json();
      console.log("Book saved successfully:", data);
      // You could show a success toast here
    } catch (error) {
      console.error("Save failed:", error);
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleExportBook = async (content: string): Promise<void> => {
    try {
      await exportBookToPDF(
        options.title,
        options.author,
        content,
        {
          pageSize: options.pageSize as 'a4' | 'letter' | 'a5',
          fontSize: options.fontSize === 'small' ? 10 : options.fontSize === 'large' ? 14 : 12
        }
      );
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading manuscript...</div>
      </div>
    );
  }

  if (!manuscript) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground mb-4">Manuscript not found</div>
          <Link href="/dashboard/manuscripts" className="text-accent hover:underline">
            ← Back to Manuscripts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/dashboard/manuscripts/${manuscript.id}`} className="text-foreground-muted hover:text-foreground">
                ← Back to Storyboard
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Book Compiler</h1>
                <p className="text-sm text-foreground-muted">{manuscript.title} • {sections.length} sections</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-surface-elevated border border-border text-foreground rounded-lg hover:bg-surface-muted transition-colors"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
              {showPreview && (
                <button
                  onClick={() => setFullScreenPreview(true)}
                  className="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent-hover transition-colors"
                >
                  🔍 Full Screen Preview
                </button>
              )}
              
              <button
                onClick={() => setShowEnhancedEditor(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✏️ Enhanced Editor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className={`grid gap-8 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">Book Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={options.title}
                    onChange={(e) => setOptions(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Author *
                  </label>
                  <input
                    type="text"
                    value={options.author}
                    onChange={(e) => setOptions(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={options.subtitle}
                    onChange={(e) => setOptions(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    placeholder="A descriptive subtitle for your book"
                  />
                </div>
              </div>
            </div>

            {/* Formatting Options */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">Book Formatting</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Template
                  </label>
                  <select
                    value={options.template}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      template: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                  >
                    <option value="standard">Standard</option>
                    <option value="academic">Academic</option>
                    <option value="coffee-table">Coffee Table</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Page Size
                  </label>
                  <select
                    value={options.pageSize}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      pageSize: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                  >
                    <option value="a4">A4</option>
                    <option value="us-letter">US Letter</option>
                    <option value="a5">A5</option>
                    <option value="6x9">6" × 9"</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Font Size
                  </label>
                  <select
                    value={options.fontSize}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      fontSize: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeImages}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeImages: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-foreground-muted">Include Images</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeCoverPage}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeCoverPage: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-foreground-muted">Include Cover Page</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeTableOfContents}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeTableOfContents: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-foreground-muted">Include Table of Contents</span>
                </label>
              </div>
            </div>

            {/* Compile Button */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">Generate Book</h2>
              
              <button
                onClick={handleCompile}
                disabled={compiling || !options.title || !options.author || sections.length === 0}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {compiling ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Compiling Book...
                  </span>
                ) : (
                  "Compile to PDF"
                )}
              </button>
              
              <p className="text-xs text-foreground-subtle mt-2">
                Book will include {sections.length} sections in storyboard order.
              </p>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
                {result.success ? (
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3">
                      ✓ Book Generated Successfully!
                    </h3>
                    
                    {result.metadata && (
                      <div className="space-y-2 text-sm text-foreground-muted mb-4">
                        <div><strong>Title:</strong> {result.metadata.title}</div>
                        <div><strong>Sections:</strong> {result.metadata.totalPosts}</div>
                        <div><strong>File Size:</strong> {Math.round(result.metadata.fileSize / 1024)} KB</div>
                        <div><strong>Format:</strong> {result.metadata.options.pageSize.toUpperCase()} PDF</div>
                      </div>
                    )}
                    
                    <a
                      href={result.downloadUrl}
                      download
                      className="inline-block w-full bg-success hover:bg-success/80 text-black px-4 py-2 rounded text-center transition-colors"
                    >
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-3">
                      ✗ Compilation Failed
                    </h3>
                    <p className="text-foreground-muted text-sm">
                      {result.error || "An unknown error occurred."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Live Preview</h2>
                
                {previewPages.length === 0 ? (
                  <div className="text-center py-8 text-foreground-muted">
                    <p>No sections with content to preview</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {previewPages.slice(0, 3).map((page, index) => (
                      <div key={index} className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-surface-elevated p-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-foreground">{page.title}</h3>
                            <span className="text-sm text-foreground-muted">Page {page.pageNumber}</span>
                          </div>
                        </div>
                        <div 
                          className="bg-white p-6 text-black"
                          style={{ 
                            minHeight: '300px',
                            fontSize: getFontSizeValue(options.fontSize)
                          }}
                          dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                      </div>
                    ))}
                    
                    {previewPages.length > 3 && (
                      <div className="text-center py-4 text-foreground-muted">
                        <p>... and {previewPages.length - 3} more pages</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      {fullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 overflow-auto">
          <div className="min-h-screen p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 text-white">
              <h2 className="text-2xl font-semibold">Full Preview - {options.title}</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm opacity-75">
                  {previewPages.length} pages • {options.pageSize.toUpperCase()} • {options.fontSize} font
                </span>
                <button
                  onClick={() => setFullScreenPreview(false)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Pages Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {previewPages.map((page, index) => {
                const dimensions = getPageDimensions(options.pageSize);
                const scale = Math.min(400 / dimensions.widthPx, 600 / dimensions.heightPx);
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="bg-white shadow-2xl relative mb-4" style={{
                      width: `${dimensions.widthPx * scale}px`,
                      height: `${dimensions.heightPx * scale}px`,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center'
                    }}>
                      {/* Page content */}
                      <div 
                        className="absolute inset-0 overflow-hidden text-black"
                        style={{ 
                          fontSize: `${parseInt(getFontSizeValue(options.fontSize)) * scale}px`,
                          lineHeight: 1.6
                        }}
                        dangerouslySetInnerHTML={{ __html: page.content }}
                      />
                      
                      {/* Page number */}
                      <div className="absolute bottom-4 right-4 text-gray-500 text-xs">
                        {page.pageNumber}
                      </div>
                    </div>
                    
                    {/* Page title */}
                    <div className="text-white text-center">
                      <p className="font-medium">{page.title}</p>
                      <p className="text-sm opacity-75">Page {page.pageNumber}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Book Editor Modal */}
      {showEnhancedEditor && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            {/* Enhanced Editor Header */}
            <div className="bg-gray-800 text-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Enhanced Book Editor</h2>
                  <p className="text-sm text-gray-300">{options.title} by {options.author}</p>
                </div>
                <button
                  onClick={() => setShowEnhancedEditor(false)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  ✕ Close Editor
                </button>
              </div>
            </div>
            
            {/* Enhanced Editor Content */}
            <div className="flex-1">
              <EnhancedBookEditor
                sections={sections}
                bookTitle={options.title}
                bookAuthor={options.author}
                onSave={handleSaveBook}
                onExport={handleExportBook}
                pageSize={options.pageSize}
                onPageSizeChange={(newPageSize) => 
                  setOptions(prev => ({ ...prev, pageSize: newPageSize as any }))
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}