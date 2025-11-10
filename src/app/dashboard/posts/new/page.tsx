"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function NewPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  
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
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
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
      console.error("Failed to fetch categories and tags:", error);
    }
  };

  const handleSubmit = async (status: "draft" | "published") => {
    setLoading(true);

    try {
      // First, create the post with the specified status
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const newPost = await response.json();

      // Then, if there are images, associate them with the post
      if (images.length > 0) {
        const imagePromises = images.map(async (image, index) => {
          // If the image doesn't have an ID, it means it was uploaded before the post was created
          // We need to create a database record for it
          if (!image.id) {
            return fetch("/api/images", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                postId: newPost.id,
                filename: image.filename,
                originalName: image.originalName,
                alt: image.alt,
                caption: image.caption,
                size: image.size,
                mimeType: image.mimeType,
                width: image.width,
                height: image.height,
                isHero: image.isHero,
                sortOrder: index,
              }),
            });
          }
        });

        await Promise.all(imagePromises.filter(Boolean));
      }

      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Historical Entry</h1>
          <p className="text-foreground-muted">Write about a significant historical event</p>
          <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-foreground-muted">
              💡 <strong>Tip:</strong> After creating your post, you can add it to a manuscript for book compilation. 
              <Link href="/dashboard/manuscripts" className="text-accent hover:underline ml-1">
                Manage manuscripts →
              </Link>
            </p>
          </div>
        </div>

        <div className="space-y-8">
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

          {/* Actions */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/dashboard/posts")}
                className="px-6 py-2 border border-border text-foreground-muted rounded-md hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleSubmit("draft")}
                  disabled={loading || !formData.title || !formData.content || !formData.dateOfEvent || !formData.excerpt}
                  className="px-6 py-2 border border-border text-foreground rounded-md hover:bg-surface-elevated disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : "Save for Later"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("published")}
                  disabled={loading || !formData.title || !formData.content || !formData.dateOfEvent || !formData.excerpt}
                  className="px-6 py-2 bg-accent text-black rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {loading ? "Publishing..." : "Publish Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}