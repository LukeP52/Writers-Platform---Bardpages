"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { generateSlug, getYearFromDate } from "@/lib/utils";
import ImageUpload from "@/components/ImageUpload";
// import TinyMCEEditor, { EDITOR_CONFIGS } from "@/components/TinyMCEEditor";

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

interface UploadedImage {
  id?: number;
  filename: string;
  originalName: string;
  alt: string;
  caption: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  isHero: boolean;
  url: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  dateOfEvent: string;
  yearOfEvent: number;
  slug: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  tags: Tag[];
  images: UploadedImage[];
}

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  // Check for returnTo parameter
  const [returnTo, setReturnTo] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnToParam = urlParams.get('returnTo');
    if (returnToParam) {
      setReturnTo(returnToParam);
    }
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    dateOfEvent: "",
    categoryIds: [] as number[],
    tagIds: [] as number[],
    status: "draft" as "draft" | "published",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setInitialLoading(true);
    try {
      const [postRes, categoriesRes, tagsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);

      if (!postRes.ok) {
        throw new Error("Post not found");
      }

      const postData = await postRes.json();
      const categoriesData = await categoriesRes.json();
      const tagsData = await tagsRes.json();

      setPost(postData);
      setCategories(categoriesData);
      setTags(tagsData);
      setImages(postData.images || []);

      // Pre-populate the form
      setFormData({
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        dateOfEvent: postData.dateOfEvent,
        categoryIds: postData.categories.map((cat: Category) => cat.id),
        tagIds: postData.tags.map((tag: Tag) => tag.id),
        status: postData.status,
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Failed to load post data. Please try again.");
      router.push("/dashboard/posts");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          images: images,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const handleTagChange = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const categoriesByType = categories.reduce((acc, category) => {
    if (!acc[category.type]) acc[category.type] = [];
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-foreground">Loading post...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-foreground">Post not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          {returnTo && (
            <div className="mb-4">
              <button
                onClick={() => router.push(returnTo)}
                className="flex items-center text-accent hover:text-accent-hover transition-colors"
              >
                ← Back to Manuscript
              </button>
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Historical Entry</h1>
          <p className="text-foreground-muted">Update your historical event details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground-muted mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter the title of your historical entry..."
                  required
                />
              </div>

              <div>
                <label htmlFor="dateOfEvent" className="block text-sm font-medium text-foreground-muted mb-1">
                  Date of Event
                </label>
                <input
                  type="date"
                  id="dateOfEvent"
                  value={formData.dateOfEvent}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfEvent: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-foreground-muted mb-1">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Brief summary of the historical event..."
                  required
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-foreground-muted mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={12}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Write your detailed historical entry here..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Categories</h2>
            
            {Object.entries(categoriesByType).map(([type, typeCategories]) => (
              <div key={type} className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-2 capitalize">
                  {type.replace('_', ' ')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {typeCategories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
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

          {/* Tags */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Tags</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.tagIds.includes(tag.id)}
                    onChange={() => handleTagChange(tag.id)}
                    className="rounded"
                  />
                  <span
                    className="px-2 py-1 rounded text-sm text-black"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Images</h2>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={10}
            />
          </div>

          {/* Status and Submit */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground-muted mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as "draft" | "published" 
                  }))}
                  className="px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/posts")}
                  className="px-6 py-2 border border-border text-foreground-muted rounded-md hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-accent text-black rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {loading ? "Updating..." : "Update Post"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}