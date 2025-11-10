import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:p-8 bg-surface border-b border-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">📜</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Today in History</h1>
        </div>
        <Link 
          href="/dashboard" 
          className="bg-accent hover:bg-accent-hover text-black px-5 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
        >
          Dashboard
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
            Chronicle History,
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Books
            </span>
          </h1>
          <p className="text-xl lg:text-2xl text-foreground-muted mb-10 max-w-3xl mx-auto leading-relaxed">
            Your comprehensive platform for documenting historical events, managing content, and creating professional books from your research.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link 
              href="/dashboard" 
              className="bg-accent hover:bg-accent-hover text-black px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started
            </Link>
            <Link 
              href="/dashboard/book" 
              className="bg-surface border border-border hover:border-border-hover text-foreground px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:bg-surface-elevated shadow-sm hover:shadow"
            >
              Book Compiler
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-foreground-muted text-xl">From research to publication</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 bg-surface border border-border rounded-2xl hover:border-border-hover transition-all duration-200 hover:shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Content Management</h3>
              <p className="text-foreground-muted leading-relaxed">Organize historical events with categories, tags, and rich metadata for easy discovery.</p>
            </div>

            <div className="group p-8 bg-surface border border-border rounded-2xl hover:border-border-hover transition-all duration-200 hover:shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Image Management</h3>
              <p className="text-foreground-muted leading-relaxed">Upload and organize historical images with captions and metadata for visual storytelling.</p>
            </div>

            <div className="group p-8 bg-surface border border-border rounded-2xl hover:border-border-hover transition-all duration-200 hover:shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Book Generation</h3>
              <p className="text-foreground-muted leading-relaxed">Compile your content into professional PDF books ready for publishing or sharing.</p>
            </div>

            <div className="group p-8 bg-surface border border-border rounded-2xl hover:border-border-hover transition-all duration-200 hover:shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏷️</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Organization</h3>
              <p className="text-foreground-muted leading-relaxed">Filter by era, event type, region, and custom tags for efficient content management.</p>
            </div>

            <div className="group p-8 bg-surface border border-border rounded-2xl hover:border-border-hover transition-all duration-200 hover:shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Professional Templates</h3>
              <p className="text-foreground-muted leading-relaxed">Multiple book styles including academic, coffee table, and minimal designs.</p>
            </div>

            <div className="group p-8 bg-surface border border-border rounded-2xl hover:border-border-hover transition-all duration-200 hover:shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Advanced Search</h3>
              <p className="text-foreground-muted leading-relaxed">Find events by date, keywords, categories, and historical periods with powerful filtering.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 px-6 lg:px-8 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-pearl border border-border rounded-3xl p-12 lg:p-16 shadow-lg">
            <h2 className="text-4xl font-bold text-foreground mb-6">Ready to Start?</h2>
            <p className="text-foreground-muted text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Begin documenting history and creating professional books from your research.
            </p>
            <Link 
              href="/dashboard" 
              className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              Launch Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}