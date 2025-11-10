"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewManuscriptPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetWordCount, setTargetWordCount] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/manuscripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          targetWordCount: targetWordCount ? parseInt(targetWordCount) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create manuscript");

      const data = await response.json();
      router.push(`/dashboard/manuscripts/${data.id}`);
    } catch (error) {
      console.error("Error creating manuscript:", error);
      alert("Failed to create manuscript. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/manuscripts" className="text-foreground-muted hover:text-foreground">
            ← Writing Projects
          </Link>
          <h1 className="text-xl font-semibold text-foreground">New Manuscript</h1>
        </div>
      </nav>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-surface border border-border rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Create New Writing Project</h2>
            <p className="text-foreground-muted">
              Start a new manuscript with the ring-binder organization system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter manuscript title..."
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                placeholder="Brief description of your project..."
              />
            </div>

            <div>
              <label htmlFor="targetWordCount" className="block text-sm font-medium text-foreground mb-2">
                Target Word Count
              </label>
              <input
                type="number"
                id="targetWordCount"
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="e.g., 80000"
                min="1"
              />
              <p className="text-xs text-foreground-muted mt-1">
                Optional. Set a word count goal to track progress.
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={!title.trim() || creating}
                className="flex-1 bg-accent hover:bg-accent-hover disabled:bg-muted disabled:cursor-not-allowed text-black py-3 rounded-lg font-medium transition-colors"
              >
                {creating ? "Creating..." : "Create Manuscript"}
              </button>
              <Link
                href="/dashboard/manuscripts"
                className="px-6 py-3 bg-surface border border-border hover:border-border-hover text-foreground rounded-lg font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}