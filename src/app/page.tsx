export default function Home() {
  return (
    <div className="flex h-screen w-full font-display antialiased overflow-hidden">
      {/* Side Navigation Bar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white dark:bg-[#111722] border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-primary text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl">graphic_eq</span>
              AudioLearn
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium pl-1">
              Student Dashboard
            </p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col px-4 gap-2 overflow-y-auto">
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary dark:text-white dark:bg-[#232f48] group transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="text-sm font-medium">Home</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f2a3e] hover:text-primary dark:hover:text-white transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-[24px]">
              library_books
            </span>
            <span className="text-sm font-medium">My Library</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f2a3e] hover:text-primary dark:hover:text-white transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-[24px]">school</span>
            <span className="text-sm font-medium">Courses</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f2a3e] hover:text-primary dark:hover:text-white transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-[24px]">
              queue_music
            </span>
            <span className="text-sm font-medium">Playlists</span>
          </a>
          <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
          <a
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f2a3e] hover:text-primary dark:hover:text-white transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-[24px]">
              settings
            </span>
            <span className="text-sm font-medium">Settings</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <a
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-[24px]">logout</span>
            <span className="text-sm font-medium">Log Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* Top Header & Usage Widget */}
        <header className="flex-shrink-0 px-8 py-6 pb-2">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back, Alex
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Let's continue where you left off. You have 3 documents pending.
              </p>
            </div>
            {/* Usage Stats Widget */}
            <div className="flex items-center gap-4 bg-white dark:bg-[#1f2a3e] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-w-[280px]">
              <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Circular Progress Placeholder */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-600"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></path>
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="75, 100"
                    strokeWidth="4"
                  ></path>
                </svg>
                <span className="absolute text-[10px] font-bold text-primary">
                  75%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Free Tier Usage
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    45
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    / 60 Mins
                  </span>
                </div>
              </div>
              <button className="ml-auto p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-primary transition-colors">
                <span className="material-symbols-outlined text-sm font-bold">
                  bolt
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-32">
          {" "}
          {/* Added pb-32 for sticky player space */}
          {/* Upload Zone */}
          <section className="mt-6 mb-10">
            <div className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 dark:border-[#324467] rounded-2xl bg-slate-50 dark:bg-[#1a2436]/50 hover:bg-blue-50 dark:hover:bg-[#1a2436] hover:border-primary transition-all cursor-pointer">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
              <div className="flex flex-col items-center gap-4 z-10 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-primary/20 flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl">
                    cloud_upload
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Upload Document
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                    Drag and drop your PDF, DOCX, or TXT files here to instantly
                    convert them into audio notes.
                  </p>
                </div>
                <button className="mt-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    folder_open
                  </span>
                  Browse Files
                </button>
              </div>
            </div>
          </section>
          {/* Recent Materials */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  schedule
                </span>
                Recent Materials
              </h3>
              <a
                className="text-sm font-medium text-primary hover:text-blue-400 transition-colors"
                href="#"
              >
                View All
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Card 1: Ready to Play */}
              <div className="bg-white dark:bg-[#1f2a3e] rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined">
                      picture_as_pdf
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    Ready
                  </div>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                  Intro to Microeconomics
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  Economics • 15 MB • 45m audio
                </p>
                <div className="flex items-center gap-3">
                  <button className="flex-1 bg-primary hover:bg-blue-600 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      play_arrow
                    </span>
                    Play Now
                  </button>
                  <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      more_vert
                    </span>
                  </button>
                </div>
              </div>
              {/* Card 2: Converting */}
              <div className="bg-white dark:bg-[#1f2a3e] rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined">
                      description
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <span className="animate-spin material-symbols-outlined text-[10px]">
                      progress_activity
                    </span>
                    Processing
                  </div>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                  History_Notes_Ch4.docx
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  History • 2.4 MB • Estimating...
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full w-2/3 animate-pulse"></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                  Converting... 65%
                </p>
              </div>
              {/* Card 3: Queued */}
              <div className="bg-white dark:bg-[#1f2a3e] rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <span className="material-symbols-outlined">slideshow</span>
                  </div>
                  <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    Queued
                  </div>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                  Biology_Lecture_Slides.pptx
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  Biology • 12 MB
                </p>
                <div className="flex items-center gap-3 opacity-60 pointer-events-none">
                  <button className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      hourglass_empty
                    </span>
                    Waiting
                  </button>
                  <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      more_vert
                    </span>
                  </button>
                </div>
              </div>
              {/* Card 4: Recent History */}
              <div className="bg-white dark:bg-[#1f2a3e] rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <span className="material-symbols-outlined">article</span>
                  </div>
                  <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    Completed
                  </div>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                  Research Methods 101
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  Sociology • 8 MB • 1h 20m audio
                </p>
                <div className="flex items-center gap-3">
                  <button className="flex-1 bg-white dark:bg-transparent border border-primary text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      play_circle
                    </span>
                    Play Again
                  </button>
                  <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      more_vert
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Player Bar */}
        <div className="absolute bottom-0 w-full bg-white dark:bg-[#1a2436] border-t border-slate-200 dark:border-slate-700 p-3 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
          <div className="flex items-center justify-between gap-6 max-w-[1400px] mx-auto">
            {/* Track Info */}
            <div className="flex items-center gap-4 w-1/4">
              <div
                className="w-12 h-12 rounded bg-slate-200 dark:bg-slate-700 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC2XmbAvOjOrOW2zhVqPs_iVcqD94PLMaeLs_zDfeaePLVmz-f_e_5j2zNMLVZcIPnXfnov41A0221MMfvfuDbMIN6wjX-6rKbne3bWc5xNf4Ll5ZHT3Q-AUK1HdueoCB59Y5eeQ4rEu1VROim3P43WFqonYT3GoxwCYxjZ_AC_S9pOjgFyquhFae1LkJhI-_ggqx25XERSFfM7CORs2VpJwzgfxM6h1eK-UuAwyH2JyFUoYc-VwZzhiRiooLg25Q1PQN2oS3g6ikI')",
                }}
              ></div>
              <div className="flex flex-col overflow-hidden">
                <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  Chapter 3: Cognitive Psychology
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Psychology 201 • Prof. Jensen
                </p>
              </div>
              <button className="text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  favorite
                </span>
              </button>
            </div>
            {/* Player Controls & Progress */}
            <div className="flex flex-col items-center flex-1 max-w-2xl gap-1">
              <div className="flex items-center gap-6">
                <button
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  title="Shuffle"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    shuffle
                  </span>
                </button>
                <button
                  className="text-slate-900 dark:text-white hover:text-primary transition-colors"
                  title="Previous"
                >
                  <span className="material-symbols-outlined text-[28px] fill-current">
                    skip_previous
                  </span>
                </button>
                <button
                  className="w-10 h-10 rounded-full bg-primary hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all scale-105"
                  title="Play/Pause"
                >
                  <span className="material-symbols-outlined text-[28px] fill-current">
                    pause
                  </span>
                </button>
                <button
                  className="text-slate-900 dark:text-white hover:text-primary transition-colors"
                  title="Next"
                >
                  <span className="material-symbols-outlined text-[28px] fill-current">
                    skip_next
                  </span>
                </button>
                <button
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  title="Repeat"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    repeat
                  </span>
                </button>
              </div>
              <div className="w-full flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>12:45</span>
                <div className="relative flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer group">
                  <div className="absolute h-full bg-primary rounded-full w-[35%] group-hover:bg-blue-400 transition-colors"></div>
                  <div className="absolute h-3 w-3 bg-white border-2 border-primary rounded-full top-1/2 -translate-y-1/2 left-[35%] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"></div>
                </div>
                <span>45:20</span>
              </div>
            </div>
            {/* Volume & Extra Controls */}
            <div className="flex items-center justify-end gap-3 w-1/4">
              <button className="text-slate-500 hover:text-primary transition-colors flex items-center gap-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-xs font-bold">
                <span>1.5x</span>
              </button>
              <div className="flex items-center gap-2 group">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[20px]">
                  volume_up
                </span>
                <div className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer overflow-hidden">
                  <div className="h-full bg-slate-500 dark:bg-slate-400 w-[80%] rounded-full group-hover:bg-primary transition-colors"></div>
                </div>
              </div>
              <button className="text-slate-500 hover:text-white transition-colors ml-2">
                <span className="material-symbols-outlined text-[20px]">
                  queue_music
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
