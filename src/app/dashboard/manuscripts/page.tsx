import Link from "next/link";
import { db, manuscripts } from "@/lib/db";
import { desc } from "drizzle-orm";

export default async function ManuscriptsPage() {
  const allManuscripts = await db.select().from(manuscripts).orderBy(desc(manuscripts.updatedAt));

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-foreground-muted hover:text-foreground">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-foreground">Writing Projects</h1>
          </div>
          <Link
            href="/dashboard/manuscripts/new"
            className="bg-accent hover:bg-accent-hover text-black px-4 py-2 rounded-lg transition-colors"
          >
            New Manuscript
          </Link>
        </div>
      </nav>

      <div className="p-6">
        {allManuscripts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No manuscripts yet</h2>
            <p className="text-foreground-muted mb-6">
              Create your first manuscript to start writing with the ring-binder approach
            </p>
            <Link
              href="/dashboard/manuscripts/new"
              className="bg-accent hover:bg-accent-hover text-black px-6 py-3 rounded-lg transition-colors"
            >
              Create Manuscript
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allManuscripts.map((manuscript) => (
              <Link
                key={manuscript.id}
                href={`/dashboard/manuscripts/${manuscript.id}`}
                className="block bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                      {manuscript.title}
                    </h3>
                    {manuscript.description && (
                      <p className="text-foreground-muted text-sm mt-1 line-clamp-2">
                        {manuscript.description}
                      </p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    manuscript.status === 'completed' ? 'bg-success/10 text-success' :
                    manuscript.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-foreground-muted'
                  }`}>
                    {manuscript.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-foreground-muted">
                  <div className="flex items-center space-x-4">
                    <span>{manuscript.wordCount || 0} words</span>
                    {manuscript.targetWordCount && (
                      <span>
                        ({Math.round(((manuscript.wordCount || 0) / manuscript.targetWordCount) * 100)}% of goal)
                      </span>
                    )}
                  </div>
                  <span>{new Date(manuscript.updatedAt).toLocaleDateString()}</span>
                </div>

                {manuscript.targetWordCount && (
                  <div className="mt-3">
                    <div className="bg-muted rounded-full h-2">
                      <div
                        className="bg-accent rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${Math.min(((manuscript.wordCount || 0) / manuscript.targetWordCount) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}