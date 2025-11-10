"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  dateOfEvent: string;
  yearOfEvent: number;
  status: "draft" | "published";
  createdAt: string;
}

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
  post?: Post;
}

interface Manuscript {
  id: number;
  title: string;
  description: string | null;
  status: string;
}

interface SimplifiedManuscriptEditorProps {
  manuscript: Manuscript;
}

export default function SimplifiedManuscriptEditor({ manuscript }: SimplifiedManuscriptEditorProps) {
  const [view, setView] = useState<"storyboard">("storyboard");
  const [sections, setSections] = useState<Section[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const router = useRouter();
  const [showPostSelector, setShowPostSelector] = useState(false);
  const [addingPost, setAddingPost] = useState<number | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<{id: number, name: string, type: string, color: string}[]>([]);
  const [tags, setTags] = useState<{id: number, name: string, color: string}[]>([]);
  const [addingAll, setAddingAll] = useState(false);
  
  // Post filtering
  const [postFilters, setPostFilters] = useState({
    search: "",
    status: "all",
    yearFrom: "",
    yearTo: "",
    month: "",
    day: "",
    categoryIds: [] as number[],
    tagIds: [] as number[],
  });

  useEffect(() => {
    fetchData();
  }, [manuscript.id]);

  const fetchData = async () => {
    try {
      const [sectionsRes, postsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch(`/api/manuscripts/${manuscript.id}/sections`),
        fetch("/api/posts"),
        fetch("/api/categories"),
        fetch("/api/tags")
      ]);

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPostToManuscript = async (post: Post) => {
    setAddingPost(post.id);
    
    try {
      console.log("Adding post to manuscript:", post.id, "to manuscript:", manuscript.id);
      
      const response = await fetch(`/api/manuscripts/${manuscript.id}/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          synopsis: post.excerpt,
          type: "document",
          postId: post.id,
          dateOfEvent: post.dateOfEvent,
          sortOrder: sections.length,
          customIcon: "📜",
          keywords: "historical event",
        }),
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const newSection = await response.json();
        console.log("New section created:", newSection);
        setSections([...sections, { ...newSection, post }]);
      } else {
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
        throw new Error(`Failed to add post: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error("Failed to add post to manuscript:", error);
      alert("Failed to add post to manuscript. Please try again.");
    } finally {
      setAddingPost(null);
    }
  };

  const removeSection = async (sectionId: number) => {
    if (!confirm("Remove this section from the manuscript?")) return;

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSections(sections.filter(s => s.id !== sectionId));
        if (selectedSection?.id === sectionId) {
          setSelectedSection(null);
        }
      }
    } catch (error) {
      console.error("Failed to remove section:", error);
    }
  };

  const reorderSections = async (dragIndex: number, hoverIndex: number) => {
    const draggedSection = sections[dragIndex];
    const newSections = [...sections];
    newSections.splice(dragIndex, 1);
    newSections.splice(hoverIndex, 0, draggedSection);
    
    // Update sort orders
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      sortOrder: index
    }));
    
    setSections(updatedSections);

    // Update in backend
    try {
      await Promise.all(
        updatedSections.map(section =>
          fetch(`/api/sections/${section.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: section.sortOrder }),
          })
        )
      );
    } catch (error) {
      console.error("Failed to update section order:", error);
    }
  };

  const filteredPosts = posts.filter(post => {
    // Search filter
    if (postFilters.search && !post.title.toLowerCase().includes(postFilters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (postFilters.status !== "all" && post.status !== postFilters.status) {
      return false;
    }
    
    // Year range filter
    if (postFilters.yearFrom && post.yearOfEvent < parseInt(postFilters.yearFrom)) {
      return false;
    }
    if (postFilters.yearTo && post.yearOfEvent > parseInt(postFilters.yearTo)) {
      return false;
    }
    
    // Month filter
    if (postFilters.month) {
      const postDate = new Date(post.dateOfEvent);
      const postMonth = postDate.getMonth() + 1; // getMonth() returns 0-11
      if (postMonth !== parseInt(postFilters.month)) {
        return false;
      }
    }
    
    // Day filter
    if (postFilters.day) {
      const postDate = new Date(post.dateOfEvent);
      const postDay = postDate.getDate();
      if (postDay !== parseInt(postFilters.day)) {
        return false;
      }
    }
    
    // Category filter (need to fetch post categories - simplified for now)
    if (postFilters.categoryIds.length > 0) {
      // This would require fetching post-category relationships
      // For now, we'll implement a simplified version
    }
    
    // Tag filter (need to fetch post tags - simplified for now)
    if (postFilters.tagIds.length > 0) {
      // This would require fetching post-tag relationships
      // For now, we'll implement a simplified version
    }
    
    return true;
  });

  // Multi-select functions
  const togglePostSelection = (postId: number) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const selectAllPosts = () => {
    const allPostIds = new Set(filteredPosts.map(p => p.id));
    setSelectedPosts(allPostIds);
  };

  const clearSelection = () => {
    setSelectedPosts(new Set());
  };

  const addSelectedPosts = async () => {
    setAddingAll(true);
    const selectedPostsList = filteredPosts.filter(p => selectedPosts.has(p.id));
    
    try {
      for (const post of selectedPostsList) {
        await addPostToManuscript(post);
      }
      setSelectedPosts(new Set());
    } catch (error) {
      console.error("Failed to add selected posts:", error);
    } finally {
      setAddingAll(false);
    }
  };

  const addAllFilteredPosts = async () => {
    setAddingAll(true);
    
    try {
      for (const post of filteredPosts) {
        await addPostToManuscript(post);
      }
    } catch (error) {
      console.error("Failed to add all posts:", error);
    } finally {
      setAddingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading manuscript...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/manuscripts" className="text-foreground-muted hover:text-foreground">
              ← Back to Manuscripts
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{manuscript.title}</h1>
              <p className="text-sm text-foreground-muted">{sections.length} sections</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Add Posts Button */}
            <button
              onClick={() => setShowPostSelector(!showPostSelector)}
              className="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent-hover transition-colors"
            >
              + Add Posts
            </button>

            {/* Compile Book Button */}
            {sections.length > 0 && (
              <Link
                href={`/dashboard/manuscripts/${manuscript.id}/compile`}
                className="px-4 py-2 bg-success text-black rounded-lg hover:bg-success/80 transition-colors"
              >
                📖 Compile Book
              </Link>
            )}

            {/* View Label */}
            <div className="flex items-center space-x-2">
              <span className="text-lg">🎬</span>
              <span className="font-medium text-foreground">Storyboard</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Post Selector Sidebar */}
        {showPostSelector && (
          <div className="w-80 bg-surface border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Available Posts</h3>
                <div className="text-sm text-foreground-muted">
                  {selectedPosts.size > 0 && `${selectedPosts.size} selected`}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={selectAllPosts}
                  className="px-3 py-1 bg-surface-elevated text-foreground text-sm rounded hover:bg-surface-muted transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 bg-surface-elevated text-foreground text-sm rounded hover:bg-surface-muted transition-colors"
                >
                  Clear
                </button>
                {selectedPosts.size > 0 && (
                  <button
                    onClick={addSelectedPosts}
                    disabled={addingAll}
                    className="px-3 py-1 bg-accent text-black text-sm rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
                  >
                    {addingAll ? 'Adding...' : `Add Selected (${selectedPosts.size})`}
                  </button>
                )}
                <button
                  onClick={addAllFilteredPosts}
                  disabled={addingAll || filteredPosts.length === 0}
                  className="px-3 py-1 bg-success text-black text-sm rounded hover:bg-success/80 disabled:opacity-50 transition-colors"
                >
                  {addingAll ? 'Adding...' : 'Add All'}
                </button>
              </div>
              
              {/* Post Filters */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={postFilters.search}
                  onChange={(e) => setPostFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="From year"
                    value={postFilters.yearFrom}
                    onChange={(e) => setPostFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                    className="px-2 py-1 bg-background border border-border rounded text-foreground text-sm"
                  />
                  <input
                    type="number"
                    placeholder="To year"
                    value={postFilters.yearTo}
                    onChange={(e) => setPostFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                    className="px-2 py-1 bg-background border border-border rounded text-foreground text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={postFilters.month}
                    onChange={(e) => setPostFilters(prev => ({ ...prev, month: e.target.value }))}
                    className="px-2 py-1 bg-background border border-border rounded text-foreground text-sm"
                  >
                    <option value="">All Months</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Day (1-31)"
                    min="1"
                    max="31"
                    value={postFilters.day}
                    onChange={(e) => setPostFilters(prev => ({ ...prev, day: e.target.value }))}
                    className="px-2 py-1 bg-background border border-border rounded text-foreground text-sm"
                  />
                </div>

                <select
                  value={postFilters.status}
                  onChange={(e) => setPostFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>

                {/* Categories Filter */}
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1">Categories</label>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={postFilters.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPostFilters(prev => ({
                                ...prev,
                                categoryIds: [...prev.categoryIds, category.id]
                              }));
                            } else {
                              setPostFilters(prev => ({
                                ...prev,
                                categoryIds: prev.categoryIds.filter(id => id !== category.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span 
                          className="px-2 py-0.5 rounded text-xs text-black"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1">Tags</label>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={postFilters.tagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPostFilters(prev => ({
                                ...prev,
                                tagIds: [...prev.tagIds, tag.id]
                              }));
                            } else {
                              setPostFilters(prev => ({
                                ...prev,
                                tagIds: prev.tagIds.filter(id => id !== tag.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span 
                          className="px-2 py-0.5 rounded text-xs text-black"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredPosts.length === 0 ? (
                <div className="text-center text-foreground-muted py-8">
                  <p>No available posts</p>
                  <Link href="/dashboard/posts/new" className="text-accent hover:underline text-sm">
                    Create new post →
                  </Link>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const isSelected = selectedPosts.has(post.id);
                  const isAdding = addingPost === post.id;
                  
                  return (
                    <div
                      key={post.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors relative ${
                        isSelected 
                          ? 'bg-accent/10 border-accent' 
                          : 'bg-background border-border hover:border-accent'
                      } ${isAdding ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => togglePostSelection(post.id)}
                    >
                      {isAdding && (
                        <div className="absolute inset-0 flex items-center justify-center bg-accent/10 rounded-lg">
                          <span className="text-xs font-medium text-accent">Adding...</span>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          {/* Selection Checkbox */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected 
                                ? 'bg-accent border-accent text-black' 
                                : 'border-border bg-background'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                </svg>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm truncate">{post.title}</h4>
                            <p className="text-xs text-foreground-muted mt-1">{formatDate(post.dateOfEvent)}</p>
                            <p className="text-xs text-foreground-subtle mt-1 line-clamp-2">{post.excerpt}</p>
                          </div>
                        </div>
                        
                        <button
                          className="ml-2 px-2 py-1 bg-accent text-black text-xs rounded hover:bg-accent-hover transition-colors flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            addPostToManuscript(post);
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Main Content Area - Storyboard View */}
        <div className={`flex-1 overflow-hidden ${showPostSelector ? '' : 'w-full'}`}>
          <div className="h-full bg-amber-100 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {sections.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Empty Storyboard</h3>
                  <p className="text-gray-500">Add posts to see them as story cards</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sections
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((section, index) => (
                      <div
                        key={section.id}
                        className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 cursor-pointer hover:shadow-xl transition-shadow transform hover:scale-105"
                        onClick={() => {
                          if (section.postId) {
                            router.push(`/dashboard/posts/${section.postId}/edit?returnTo=/dashboard/manuscripts/${manuscript.id}`);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-1 bg-accent text-black text-xs rounded font-medium">
                            {index + 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSection(section.id);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {section.title}
                        </h4>
                        
                        {section.dateOfEvent && (
                          <p className="text-xs text-gray-500 mb-2">
                            📅 {formatDate(section.dateOfEvent)}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 line-clamp-4">
                          {section.synopsis}
                        </p>
                      </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}