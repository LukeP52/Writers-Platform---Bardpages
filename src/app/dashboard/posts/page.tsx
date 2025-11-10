"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, truncateText } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  dateOfEvent: string;
  yearOfEvent: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

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

export default function PostsManagement() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingPost, setPublishingPost] = useState<number | null>(null);
  const [manuscripts, setManuscripts] = useState<{id: number, title: string}[]>([]);
  const [showManuscriptSelector, setShowManuscriptSelector] = useState<number | null>(null);
  const [addingToManuscript, setAddingToManuscript] = useState<number | null>(null);
  
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    yearFrom: "",
    yearTo: "",
  });

  useEffect(() => {
    fetchData();
    fetchManuscripts();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);
      
      const postsData = await postsRes.json();
      const categoriesData = await categoriesRes.json();
      const tagsData = await tagsRes.json();
      
      setPosts(postsData);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append("search", filters.search);
      if (filters.status !== "all") params.append("status", filters.status);
      
      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();
      
      // Apply year filtering on client side for now
      let filteredPosts = data;
      
      if (filters.yearFrom) {
        filteredPosts = filteredPosts.filter((post: Post) => 
          post.yearOfEvent >= parseInt(filters.yearFrom)
        );
      }
      
      if (filters.yearTo) {
        filteredPosts = filteredPosts.filter((post: Post) => 
          post.yearOfEvent <= parseInt(filters.yearTo)
        );
      }
      
      setPosts(filteredPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handlePublish = async (postId: number) => {
    setPublishingPost(postId);
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "published" }),
      });
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId ? { ...post, status: "published" as const } : post
        ));
      }
    } catch (error) {
      console.error("Failed to publish post:", error);
    } finally {
      setPublishingPost(null);
    }
  };

  const handlePostClick = (postId: number) => {
    router.push(`/dashboard/posts/${postId}/edit`);
  };

  const fetchManuscripts = async () => {
    try {
      const response = await fetch("/api/manuscripts");
      if (response.ok) {
        const data = await response.json();
        setManuscripts(data);
      }
    } catch (error) {
      console.error("Failed to fetch manuscripts:", error);
    }
  };

  const handleAddToManuscript = async (postId: number, manuscriptId: number) => {
    setAddingToManuscript(postId);
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const response = await fetch(`/api/manuscripts/${manuscriptId}/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          synopsis: post.excerpt,
          type: "historical_event",
          postId: postId,
          dateOfEvent: post.dateOfEvent,
          keywords: "historical event",
          customIcon: "📜",
        }),
      });
      
      if (response.ok) {
        setShowManuscriptSelector(null);
        alert("Post added to manuscript successfully!");
      } else {
        throw new Error("Failed to add to manuscript");
      }
    } catch (error) {
      console.error("Failed to add post to manuscript:", error);
      alert("Failed to add post to manuscript. Please try again.");
    } finally {
      setAddingToManuscript(null);
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Manage Posts</h1>
            <p className="text-foreground-muted">Organize and edit your historical content</p>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="bg-accent hover:bg-accent-hover text-black px-6 py-2 rounded-lg transition-colors"
          >
            Create New Post
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search posts..."
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Year From
              </label>
              <input
                type="number"
                value={filters.yearFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                placeholder="e.g., 1800"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1">
                Year To
              </label>
              <input
                type="number"
                value={filters.yearTo}
                onChange={(e) => setFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                placeholder="e.g., 1900"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-surface border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Posts ({posts.length})
            </h2>
          </div>
          
          <div className="p-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground-muted mb-4">No posts found matching your criteria.</p>
                <Link
                  href="/dashboard/posts/new"
                  className="text-accent hover:underline"
                >
                  Create your first post
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 bg-pearl rounded-lg hover:bg-surface-elevated transition-colors border border-border cursor-pointer"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {post.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.status === 'published' 
                            ? 'bg-green-600 text-black' 
                            : 'bg-yellow-600 text-black'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-foreground-muted text-sm mb-2">
                        {truncateText(post.excerpt, 150)}
                      </p>
                      <div className="flex items-center text-xs text-foreground-subtle space-x-4">
                        <span>Event: {formatDate(post.dateOfEvent)}</span>
                        <span>Year: {post.yearOfEvent}</span>
                        <span>Updated: {formatDate(post.updatedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setShowManuscriptSelector(showManuscriptSelector === post.id ? null : post.id)}
                          className="px-3 py-1 bg-purple-200 hover:bg-purple-300 text-purple-900 text-sm rounded transition-colors"
                        >
                          + Manuscript
                        </button>
                        
                        {showManuscriptSelector === post.id && (
                          <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-10 min-w-48">
                            <div className="p-2">
                              <div className="text-xs text-foreground-muted mb-2 font-medium">Add to Manuscript:</div>
                              {manuscripts.length === 0 ? (
                                <div className="text-xs text-foreground-muted p-2">
                                  <Link href="/dashboard/manuscripts/new" className="text-accent hover:underline">
                                    Create your first manuscript
                                  </Link>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {manuscripts.map((manuscript) => (
                                    <button
                                      key={manuscript.id}
                                      onClick={() => handleAddToManuscript(post.id, manuscript.id)}
                                      disabled={addingToManuscript === post.id}
                                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-surface-elevated rounded transition-colors disabled:opacity-50"
                                    >
                                      {addingToManuscript === post.id ? 'Adding...' : manuscript.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {post.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(post.id)}
                          disabled={publishingPost === post.id}
                          className="px-3 py-1 bg-success hover:bg-success/80 text-black text-sm rounded transition-colors disabled:opacity-50"
                        >
                          {publishingPost === post.id ? 'Publishing...' : 'Publish'}
                        </button>
                      )}
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="px-3 py-1 bg-accent hover:bg-accent-hover text-black text-sm rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/posts/${post.id}?preview=true`}
                        className="px-3 py-1 bg-blue-200 hover:bg-blue-300 text-blue-900 text-sm rounded transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1 bg-error hover:bg-error/80 text-black text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}