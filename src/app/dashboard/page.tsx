import Link from "next/link";
import { db, posts, categories, tags } from "@/lib/db";
import { eq, sql, desc } from "drizzle-orm";

async function getDashboardStats() {
  const [postsCount, categoriesCount, tagsCount] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      published: sql<number>`sum(case when status = 'published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when status = 'draft' then 1 else 0 end)`,
    }).from(posts),
    db.select({ count: sql<number>`count(*)` }).from(categories),
    db.select({ count: sql<number>`count(*)` }).from(tags),
  ]);

  const recentPosts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.updatedAt))
    .limit(5);

  return {
    stats: postsCount[0],
    categoriesCount: categoriesCount[0].count,
    tagsCount: tagsCount[0].count,
    recentPosts,
  };
}

export default async function Dashboard() {
  const { stats, categoriesCount, tagsCount, recentPosts } = await getDashboardStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface-muted">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-foreground-muted mt-2 text-lg">Manage your historical content and track your progress</p>
            </div>
            <Link 
              href="/" 
              className="text-foreground-muted hover:text-foreground transition-colors flex items-center space-x-2 text-sm bg-surface hover:bg-surface-elevated border border-border px-4 py-2 rounded-lg"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface border border-border rounded-2xl p-6 hover:border-border-hover transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide">Total Posts</h3>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">📄</span>
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border rounded-2xl p-6 hover:border-border-hover transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide">Published</h3>
                <p className="text-3xl font-bold text-success mt-2">{stats.published}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border rounded-2xl p-6 hover:border-border-hover transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide">Drafts</h3>
                <p className="text-3xl font-bold text-warning mt-2">{stats.draft}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">✏️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border rounded-2xl p-6 hover:border-border-hover transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide">Categories</h3>
                <p className="text-3xl font-bold text-accent mt-2">{categoriesCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🏷️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Link 
            href="/dashboard/posts/new" 
            className="group bg-surface border border-border rounded-2xl p-8 text-center transition-all duration-200 hover:border-accent hover:shadow-lg"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Create New Post</h3>
            <p className="text-foreground-muted">Write a new historical entry</p>
          </Link>
          
          <Link 
            href="/dashboard/posts" 
            className="group bg-surface border border-border rounded-2xl p-8 text-center transition-all duration-200 hover:border-success hover:shadow-lg"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Historical Posts</h3>
            <p className="text-foreground-muted">Create historical entries for manuscript compilation</p>
          </Link>

          <Link 
            href="/dashboard/manuscripts" 
            className="group bg-surface border border-border rounded-2xl p-8 text-center transition-all duration-200 hover:border-warning hover:shadow-lg"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">✍️</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Manuscripts</h3>
            <p className="text-foreground-muted">Organize posts into structured documents for publishing</p>
          </Link>
          
          <Link 
            href="/dashboard/categories" 
            className="group bg-surface border border-border rounded-2xl p-8 text-center transition-all duration-200 hover:border-accent hover:shadow-lg"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">🏷️</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Categories & Tags</h3>
            <p className="text-foreground-muted">Organize your content system</p>
          </Link>
        </div>

        {/* Book Compiler Highlight */}
        <div className="mb-12">
          <Link 
            href="/dashboard/book" 
            className="block bg-surface border border-border rounded-3xl p-10 text-center transition-all duration-200 hover:border-accent hover:shadow-lg group"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">Book Compiler</h3>
            <p className="text-xl text-foreground-muted mb-6 max-w-2xl mx-auto">Generate professional PDF books from your historical content</p>
            <div className="flex items-center justify-center space-x-8 text-foreground-subtle">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                <span>Multiple Templates</span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                <span>Print Ready</span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                <span>Professional Layout</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Workflow Guide */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-semibold text-foreground">Content Workflow</h2>
            <p className="text-foreground-muted mt-1">From historical research to published books</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-black font-bold">1</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Create Posts</h3>
                <p className="text-sm text-foreground-muted">Write historical entries with dates, categories, and rich content</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-black font-bold">2</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Add to Manuscripts</h3>
                <p className="text-sm text-foreground-muted">Organize posts into structured manuscripts using the + Manuscript button</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-black font-bold">3</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Compile Books</h3>
                <p className="text-sm text-foreground-muted">Generate professional PDFs from your organized manuscript content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-semibold text-foreground">Recent Posts</h2>
          </div>
          <div className="p-6">
            {recentPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No posts yet</h3>
                <p className="text-foreground-muted mb-6">Start documenting history!</p>
                <Link 
                  href="/dashboard/posts/new" 
                  className="inline-block bg-accent hover:bg-accent-hover text-black px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg"
                >
                  Create your first post
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-5 bg-pearl rounded-xl hover:bg-surface-elevated border border-border hover:border-border-hover transition-all">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{post.title}</h3>
                      <p className="text-foreground-muted mt-1">{post.dateOfEvent}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        post.status === 'published' 
                          ? 'bg-success-light text-success border border-success/20' 
                          : 'bg-warning-light text-warning border border-warning/20'
                      }`}>
                        {post.status}
                      </span>
                      <Link 
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="text-accent hover:text-accent-hover font-medium transition-colors"
                      >
                        Edit
                      </Link>
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