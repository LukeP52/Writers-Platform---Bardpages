"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

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

interface PostImage {
  id: number;
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
  images: PostImage[];
}

export default function PostView() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      
      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText);
        throw new Error("Post not found");
      }

      const postData = await response.json();
      console.log("Fetched post data:", postData);
      
      // For dashboard users, show all posts. For public, only published.
      // Check if we're in dashboard context by looking at referrer or add a query param
      const isDashboard = window.location.search.includes('preview=true') || 
                         document.referrer.includes('/dashboard');
      
      if (!isDashboard && postData.status !== "published") {
        console.log("Post is not published and not in dashboard preview");
        throw new Error("Post not found");
      }
      
      setPost(postData);
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-foreground">Loading...</div>
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
            <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-foreground-muted mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-accent text-black rounded-lg hover:bg-accent-hover transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const heroImage = post.images.find(img => img.isHero) || post.images[0];
  const categoriesByType = post.categories.reduce((acc, category) => {
    if (!acc[category.type]) acc[category.type] = [];
    acc[category.type].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {heroImage && (
        <div className="relative h-96 bg-surface-elevated">
          <img
            src={heroImage.url}
            alt={heroImage.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-white mb-2">{post.title}</h1>
              <p className="text-white/90 text-lg">{post.excerpt}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-8">
        {/* Header (if no hero image) */}
        {!heroImage && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
            <p className="text-xl text-foreground-muted">{post.excerpt}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-6 border-b border-border">
          <div className="text-foreground-muted">
            <span className="font-medium">Event Date:</span> {formatDate(post.dateOfEvent)}
          </div>
          <div className="text-foreground-muted">
            <span className="font-medium">Year:</span> {post.yearOfEvent}
          </div>
          <div className="text-foreground-muted">
            <span className="font-medium">Published:</span> {formatDate(post.createdAt)}
          </div>
        </div>

        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Categories</h3>
            <div className="space-y-3">
              {Object.entries(categoriesByType).map(([type, typeCategories]) => (
                <div key={type}>
                  <h4 className="text-sm font-medium text-foreground-muted mb-2 capitalize">
                    {type.replace('_', ' ')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {typeCategories.map((category) => (
                      <span
                        key={category.id}
                        className="px-3 py-1 rounded-full text-sm text-black"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full text-sm text-black"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div 
            className="text-foreground leading-relaxed"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {post.content}
          </div>
        </div>

        {/* Additional Images */}
        {post.images.filter(img => !img.isHero).length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-foreground mb-6">Additional Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.images.filter(img => !img.isHero).map((image) => (
                <div key={image.id} className="space-y-2">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full rounded-lg shadow-md"
                  />
                  {image.caption && (
                    <p className="text-sm text-foreground-muted italic">{image.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 pt-6 border-t border-border">
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-accent text-black rounded-lg hover:bg-accent-hover transition-colors"
          >
            ← Back to Timeline
          </Link>
        </div>
      </div>
    </div>
  );
}