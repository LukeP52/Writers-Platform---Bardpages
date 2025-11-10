"use client";

import { useState, useEffect } from "react";
import { generateSlug, getRandomColor } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  color: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    type: "event_type",
    color: "#3b82f6",
  });
  
  const [newTag, setNewTag] = useState({
    name: "",
    description: "",
    color: "#64748b",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newCategory,
          slug: generateSlug(newCategory.name),
        }),
      });

      if (response.ok) {
        const createdCategory = await response.json();
        setCategories([...categories, createdCategory]);
        setNewCategory({
          name: "",
          description: "",
          type: "event_type",
          color: getRandomColor(),
        });
        setShowNewCategory(false);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTag,
          slug: generateSlug(newTag.name),
        }),
      });

      if (response.ok) {
        const createdTag = await response.json();
        setTags([...tags, createdTag]);
        setNewTag({
          name: "",
          description: "",
          color: getRandomColor(),
        });
        setShowNewTag(false);
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryId));
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setTags(tags.filter(tag => tag.id !== tagId));
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Categories & Tags Management</h1>
          <p className="text-foreground-muted">Organize your content classification system</p>
        </div>

        {/* Categories Section */}
        <div className="bg-surface border border-border rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Categories ({categories.length})</h2>
              <button
                onClick={() => setShowNewCategory(true)}
                className="bg-accent hover:bg-accent-hover text-black px-4 py-2 rounded-lg transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {showNewCategory && (
              <form onSubmit={handleCreateCategory} className="mb-6 p-4 bg-pearl rounded-lg border border-border">
                <h3 className="text-lg font-medium text-foreground mb-4">Create New Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1">Name</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1">Type</label>
                    <select
                      value={newCategory.type}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    >
                      <option value="event_type">Event Type</option>
                      <option value="era">Historical Era</option>
                      <option value="region">Region</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground-muted mb-1">Description</label>
                    <input
                      type="text"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1">Color</label>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 bg-surface-elevated border border-border rounded-md"
                    />
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    type="submit"
                    className="bg-success hover:bg-success/80 text-black px-4 py-2 rounded transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="bg-surface-dark hover:bg-surface-darker text-black px-4 py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {Object.entries(categoriesByType).map(([type, typeCategories]) => (
              <div key={type} className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-3 capitalize">
                  {type.replace('_', ' ')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {typeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-pearl rounded-lg border border-border"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <span className="text-foreground font-medium">{category.name}</span>
                          {category.description && (
                            <p className="text-xs text-foreground-subtle">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-error hover:text-error/80 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-surface border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Tags ({tags.length})</h2>
              <button
                onClick={() => setShowNewTag(true)}
                className="bg-success hover:bg-success/80 text-black px-4 py-2 rounded-lg transition-colors"
              >
                Add Tag
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {showNewTag && (
              <form onSubmit={handleCreateTag} className="mb-6 p-4 bg-pearl rounded-lg border border-border">
                <h3 className="text-lg font-medium text-foreground mb-4">Create New Tag</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1">Name</label>
                    <input
                      type="text"
                      value={newTag.name}
                      onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1">Color</label>
                    <input
                      type="color"
                      value={newTag.color}
                      onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 bg-surface-elevated border border-border rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground-muted mb-1">Description</label>
                    <input
                      type="text"
                      value={newTag.description}
                      onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-md text-foreground"
                    />
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    type="submit"
                    className="bg-success hover:bg-success/80 text-black px-4 py-2 rounded transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTag(false)}
                    className="bg-surface-dark hover:bg-surface-darker text-black px-4 py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 bg-pearl rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-foreground text-sm">{tag.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-error hover:text-error/80 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}