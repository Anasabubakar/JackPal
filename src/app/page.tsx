export default function Home() {
  return (
    <div className="flex h-screen w-full antialiased overflow-hidden bg-slate-50 dark:bg-[#0a0e1a]">
      {/* Collapsed Sidebar */}
      <aside className="w-20 flex-shrink-0 flex flex-col items-center bg-white dark:bg-[#0f1419] border-r border-slate-200/50 dark:border-slate-800/50 py-6 gap-8 transition-all duration-300">
        <div className="flex flex-col items-center gap-2 px-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-white text-2xl font-bold">graphic_eq</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-2 w-full px-3">
          <button className="group relative w-full aspect-square rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary transition-all hover:scale-105">
            <span className="material-symbols-outlined text-2xl">home</span>
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Home
            </div>
          </button>

          <button className="group relative w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:scale-105">
            <span className="material-symbols-outlined text-2xl">library_books</span>
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              My Library
            </div>
          </button>

          <button className="group relative w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:scale-105">
            <span className="material-symbols-outlined text-2xl">school</span>
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Courses
            </div>
          </button>

          <button className="group relative w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:scale-105">
            <span className="material-symbols-outlined text-2xl">queue_music</span>
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Playlists
            </div>
          </button>

          <div className="w-8 border-t border-slate-200 dark:border-slate-800 my-2"></div>

          <button className="group relative w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:scale-105">
            <span className="material-symbols-outlined text-2xl">settings</span>
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Settings
            </div>
          </button>
        </nav>

        <button className="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-105">
          <span className="material-symbols-outlined text-2xl">logout</span>
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Log Out
          </div>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Gradient Header Background */}
        <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-br from-blue-50 via-slate-50 to-white dark:from-[#0f1827] dark:via-[#0a0e1a] dark:to-[#0a0e1a] -z-0"></div>

        {/* Top Bar */}
        <header className="relative z-10 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Search materials, courses..."
                className="w-80 pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 rounded-xl hover:bg-white dark:hover:bg-[#1a1f2e] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Alex Morgan</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Free Plan</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-white font-bold text-sm shadow-lg">
                AM
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-8 pb-36">
          {/* Hero Section */}
          <section className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                  Welcome back, Alex
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Ready to continue your learning journey?
                </p>
              </div>

              <div className="flex items-center gap-6 bg-white dark:bg-[#1a1f2e] px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200 dark:text-slate-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="text-primary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="75, 100"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xs font-bold text-primary">75%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                      Usage Today
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">45</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">/ 60 min</span>
                    </div>
                  </div>
                </div>
                <button className="p-3 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105">
                  <span className="material-symbols-outlined text-xl">workspace_premium</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+12%</span>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">24</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Completed</div>
              </div>

              <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">pending</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Active</span>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">3</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">In Progress</div>
              </div>

              <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">schedule</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">This week</span>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">18h</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Study Time</div>
              </div>

              <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">trending_up</span>
                  </div>
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">+8%</span>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">92%</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Completion</div>
              </div>
            </div>
          </section>

          {/* Upload Section */}
          <section className="mb-8">
            <div className="group relative overflow-hidden bg-gradient-to-br from-primary/5 via-blue-50/50 to-transparent dark:from-primary/10 dark:via-blue-900/10 dark:to-transparent rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-all cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex items-center justify-between p-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-white text-4xl">cloud_upload</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Transform Your Documents
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-base max-w-xl">
                      Drop PDF, DOCX, or TXT files here to instantly convert them into engaging audio lessons powered by AI
                    </p>
                  </div>
                </div>
                <button className="px-8 py-4 bg-white dark:bg-[#1a1f2e] hover:bg-primary hover:text-white border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl">add</span>
                  <span>Choose Files</span>
                </button>
              </div>
            </div>
          </section>

          {/* Recent Materials */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Recent Materials</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pick up where you left off</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-2">
                <span>View All</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Card 1 - Ready */}
              <div className="group bg-white dark:bg-[#1a1f2e] rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Ready
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    Intro to Microeconomics
                  </h4>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">folder</span>
                      Economics
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      45m
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">description</span>
                      15 MB
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30">
                      <span className="material-symbols-outlined text-xl">play_arrow</span>
                      Play Now
                    </button>
                    <button className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all">
                      <span className="material-symbols-outlined text-xl">more_horiz</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2 - Processing */}
              <div className="group bg-white dark:bg-[#1a1f2e] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">description</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                      Processing
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    History Notes Ch4
                  </h4>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">folder</span>
                      History
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">description</span>
                      2.4 MB
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Converting to audio...</span>
                      <span className="text-xs font-bold text-primary">65%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-300" style={{width: '65%'}}></div>
                    </div>
                  </div>

                  <button className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                    <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                    Converting
                  </button>
                </div>
              </div>

              {/* Card 3 - Queued */}
              <div className="group bg-white dark:bg-[#1a1f2e] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">slideshow</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Queued
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    Biology Lecture Slides
                  </h4>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">folder</span>
                      Biology
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">description</span>
                      12 MB
                    </span>
                  </div>

                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-sm">info</span>
                      <span>2 items ahead in queue</span>
                    </div>
                  </div>

                  <button className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                    <span className="material-symbols-outlined text-xl">hourglass_empty</span>
                    Waiting
                  </button>
                </div>
              </div>

              {/* Card 4 - Completed */}
              <div className="group bg-white dark:bg-[#1a1f2e] rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white shadow-lg shadow-slate-500/20 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">article</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      Done
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    Research Methods 101
                  </h4>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">folder</span>
                      Sociology
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      1h 20m
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">description</span>
                      8 MB
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex-1 bg-white dark:bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-xl">replay</span>
                      Play Again
                    </button>
                    <button className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all">
                      <span className="material-symbols-outlined text-xl">more_horiz</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Enhanced Player Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0f1419]/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-2xl z-50">
          <div className="px-8 py-4">
            <div className="flex items-center gap-8 max-w-[1600px] mx-auto">
              {/* Track Info */}
              <div className="flex items-center gap-4 w-80">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-primary shadow-lg flex-shrink-0 bg-cover bg-center" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC2XmbAvOjOrOW2zhVqPs_iVcqD94PLMaeLs_zDfeaePLVmz-f_e_5j2zNMLVZcIPnXfnov41A0221MMfvfuDbMIN6wjX-6rKbne3bWc5xNf4Ll5ZHT3Q-AUK1HdueoCB59Y5eeQ4rEu1VROim3P43WFqonYT3GoxwCYxjZ_AC_S9pOjgFyquhFae1LkJhI-_ggqx25XERSFfM7CORs2VpJwzgfxM6h1eK-UuAwyH2JyFUoYc-VwZzhiRiooLg25Q1PQN2oS3g6ikI')"}}></div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Cognitive Psychology - Chapter 3
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Psychology 201 • Prof. Jensen
                  </p>
                </div>
                <button className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">favorite</span>
                </button>
              </div>

              {/* Player Controls */}
              <div className="flex-1 flex flex-col items-center gap-3 max-w-3xl mx-auto">
                <div className="flex items-center gap-8">
                  <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">shuffle</span>
                  </button>
                  <button className="text-slate-900 dark:text-white hover:text-primary transition-all hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">skip_previous</span>
                  </button>
                  <button className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 transition-all hover:scale-110">
                    <span className="material-symbols-outlined text-3xl fill-current">pause</span>
                  </button>
                  <button className="text-slate-900 dark:text-white hover:text-primary transition-all hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">skip_next</span>
                  </button>
                  <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">repeat</span>
                  </button>
                </div>

                <div className="w-full flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="w-12 text-right">12:45</span>
                  <div className="relative flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer group">
                    <div className="absolute h-full bg-gradient-to-r from-primary to-blue-600 rounded-full w-[35%] transition-all"></div>
                    <div className="absolute h-4 w-4 bg-white border-3 border-primary rounded-full top-1/2 -translate-y-1/2 left-[35%] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="w-12">45:20</span>
                </div>
              </div>

              {/* Volume & Controls */}
              <div className="flex items-center gap-4 w-80 justify-end">
                <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all">
                  1.5x
                </button>
                <div className="flex items-center gap-3 group">
                  <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">volume_up</span>
                  </button>
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer overflow-hidden">
                    <div className="h-full bg-slate-500 dark:bg-slate-400 group-hover:bg-primary w-[80%] rounded-full transition-colors"></div>
                  </div>
                </div>
                <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">queue_music</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
