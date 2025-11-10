"use client";

import { useState, useEffect } from "react";
import { BookCompilationOptions } from "@/types";

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
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

export default function BookCompiler() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [result, setResult] = useState<CompilationResult | null>(null);

  const [options, setOptions] = useState<BookCompilationOptions>({
    title: "Today in History",
    subtitle: "A Collection of Historical Events",
    author: "Your Name",
    includeStatus: "published",
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
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
    setLoading(true);
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);
      
      const categoriesData = await categoriesRes.json();
      const tagsData = await tagsRes.json();
      
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
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

  const handleCategoryToggle = (categoryId: number) => {
    const categoryIdStr = categoryId.toString();
    setOptions(prev => ({
      ...prev,
      includeCategories: prev.includeCategories.includes(categoryIdStr)
        ? prev.includeCategories.filter(id => id !== categoryIdStr)
        : [...prev.includeCategories, categoryIdStr]
    }));
  };

  const handleTagToggle = (tagId: number) => {
    const tagIdStr = tagId.toString();
    setOptions(prev => ({
      ...prev,
      includeTags: prev.includeTags.includes(tagIdStr)
        ? prev.includeTags.filter(id => id !== tagIdStr)
        : [...prev.includeTags, tagIdStr]
    }));
  };

  const categoriesByType = categories.reduce((acc, category) => {
    if (!acc[category.type]) acc[category.type] = [];
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book Compiler</h1>
          <p className="text-foreground-muted">Generate professional PDF books from your historical content</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">Book Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="md:col-span-2">
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

            {/* Content Filters */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">Content Selection</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Include Posts
                  </label>
                  <select
                    value={options.includeStatus}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeStatus: e.target.value as "all" | "published" | "draft" 
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                  >
                    <option value="published">Published Only</option>
                    <option value="draft">Drafts Only</option>
                    <option value="all">All Posts</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Organization
                  </label>
                  <select
                    value={options.sortBy}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      sortBy: e.target.value as "date" | "chronological" | "category" 
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                  >
                    <option value="chronological">By Historical Era</option>
                    <option value="date">By Calendar Date</option>
                    <option value="category">By Event Type</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Year From (Optional)
                  </label>
                  <input
                    type="number"
                    value={options.yearFrom || ""}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      yearFrom: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    placeholder="e.g., 1800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">
                    Year To (Optional)
                  </label>
                  <input
                    type="number"
                    value={options.yearTo || ""}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      yearTo: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    placeholder="e.g., 1900"
                  />
                </div>
              </div>

              {/* Category Filters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Filter by Categories (Optional - leave all unchecked to include all)
                </label>
                {Object.entries(categoriesByType).map(([type, typeCategories]) => (
                  <div key={type} className="mb-4">
                    <h4 className="text-md font-medium text-foreground mb-2 capitalize">
                      {type.replace('_', ' ')}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {typeCategories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={options.includeCategories.includes(category.id.toString())}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="rounded"
                          />
                          <span
                            className="px-2 py-1 rounded text-sm text-black"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tag Filters */}
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Filter by Tags (Optional)
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={options.includeTags.includes(tag.id.toString())}
                        onChange={() => handleTagToggle(tag.id)}
                        className="rounded"
                      />
                      <span
                        className="px-2 py-1 rounded text-xs text-black"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
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
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* Compile Button */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">Generate Book</h2>
              
              <button
                onClick={handleCompile}
                disabled={compiling || !options.title || !options.author}
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
                This may take a few moments depending on the number of posts and images.
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
                        <div><strong>Posts:</strong> {result.metadata.totalPosts}</div>
                        <div><strong>Chapters:</strong> {result.metadata.chapters}</div>
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

            {/* Help */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-3">Tips</h3>
              <ul className="text-sm text-foreground-muted space-y-2">
                <li>• Use filters to create themed books (e.g., "Medieval Europe" or "Scientific Discoveries")</li>
                <li>• The "Coffee Table" template works best with images</li>
                <li>• Academic template is ideal for scholarly work</li>
                <li>• A5 and 6"×9" sizes are perfect for print publishing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}