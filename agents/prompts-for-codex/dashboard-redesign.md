# CODEX TASK — Dashboard Redesign
**ID:** DASH-001  
**Priority:** HIGH  
**From:** Claude  
**Status:** READY FOR PICKUP

---

## What you're building

A complete visual redesign of the JackPal dashboard. This is a Nigerian student audio learning app — think Speechify + NotebookLM built for Lagos uni students. The backend is already working. You are **only touching frontend files**.

**Working directory:**
```
C:\Users\HomePC\Downloads\word-audio-chatbt-podcast-making-learning-seamless-in-nigeria\JackPal
```

---

## Design brief

**Aesthetic:** Dark studio editorial. Ink-black base, sharp borders, surgical blue accent, teal for podcast/live states. Typography carries everything. No gradient backgrounds, no glassmorphism, no blob shapes. Every element earns its place.

**Inspired by:** Cluely UI × Speechify reader × NotebookLM oracle panel — but uniquely JackPal. Should look like it was designed for this specific product, not swappable with any other app.

**Font pairing:**
- `--font-syne` (Syne 800) — UI labels, nav, buttons, numbers
- `--font-display` (Fraunces) — reader body text, hero moments

Both fonts are already loaded in `layout.tsx`. The CSS vars exist.

---

## Step 0 — Install dependencies

```bash
npm install framer-motion
```

---

## Step 1 — Read the existing dashboard

Read the full `src/app/dashboard/page.tsx` (it's ~1400 lines). You must understand every state variable and handler function before touching anything. The logic stays. Only the JSX return is rewritten.

Also read `src/lib/api.ts` for the full API surface.

---

## Step 2 — Create `src/lib/motion.ts`

```ts
export const ease = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  in: [0.64, 0, 0.78, 0] as [number, number, number, number],
  spring: { type: 'spring' as const, stiffness: 400, damping: 30 },
  springBouncy: { type: 'spring' as const, stiffness: 300, damping: 20 },
  springStiff: { type: 'spring' as const, stiffness: 600, damping: 40 },
};

export const dur = {
  instant: 0.12,
  quick: 0.22,
  smooth: 0.35,
  expressive: 0.55,
};
```

---

## Step 3 — Create `src/components/ui/MotionPrimitives.tsx`

```tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ease, dur } from '@/lib/motion';
import React from 'react';

export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: dur.smooth, ease: ease.out, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  direction = 'right',
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  className?: string;
}) {
  const x = direction === 'right' ? 16 : -16;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x }}
      transition={ease.spring}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SpringScale({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={ease.spring}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

---

## Step 4 — Rewrite `src/app/dashboard/page.tsx`

**CRITICAL RULE:** Keep ALL existing state declarations, refs, useEffects, and handler functions exactly as they are. Only replace the `return (...)` JSX block.

Add ONE new state variable at the top of existing state:
```ts
const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
```

Add these imports at the top:
```ts
import { motion, AnimatePresence } from 'framer-motion';
import { ease, dur } from '@/lib/motion';
import { FadeUp, SlideIn, SpringScale } from '@/components/ui/MotionPrimitives';
```

### New JSX shell

```tsx
return (
  <div className="studio flex h-screen overflow-hidden" style={{ background: 'var(--ink)', color: 'var(--text-1)' }}>
    <audio ref={audioRef} />

    {/* ── LEFT RAIL ── */}
    <LeftRail />

    {/* ── CENTER ZONE ── */}
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Library */}
        {activeTab === 'home' && !currentDocId && !podcastPlayingDocId && (
          <LibraryView key="library" />
        )}
        {/* Sync reader */}
        {currentDocId && !podcastPlayingDocId && (
          <SyncReader key="reader" />
        )}
        {/* Podcast theater */}
        {(podcastPlayingDocId || podcastGenerating) && (
          <PodcastTheater key="podcast" />
        )}
      </AnimatePresence>
    </main>

    {/* ── RIGHT PANEL ── */}
    <RightPanel />

    {/* ── PLAYER BAR ── */}
    <PlayerBar />
  </div>
);
```

Define each sub-component as a local const inside the `Dashboard` function (they have closure access to all state and handlers).

---

## Left Rail spec

```tsx
const LeftRail = () => (
  <nav
    className="w-14 flex-shrink-0 flex flex-col items-center py-5 gap-1 z-40"
    style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
  >
    {/* Logo */}
    <div className="mb-5">
      <Image src="/images/logo.svg" alt="JackPal" width={26} height={26} priority />
    </div>

    {/* Nav icons */}
    {[
      { id: 'home', Icon: Library, label: 'Library' },
      { id: 'upload', Icon: Plus, label: 'Upload' },
    ].map(({ id, Icon, label }) => (
      <button
        key={id}
        title={label}
        onClick={() => setActiveTab(id)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
        style={{
          color: activeTab === id ? 'var(--text-1)' : 'var(--text-3)',
          background: activeTab === id ? 'var(--surface-2)' : 'transparent',
        }}
      >
        {activeTab === id && (
          <motion.div
            layoutId="nav-pill"
            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
            style={{ background: 'var(--blue)' }}
          />
        )}
        <Icon size={18} strokeWidth={1.75} />
      </button>
    ))}

    {/* Bottom */}
    <div className="mt-auto flex flex-col items-center gap-2">
      <button
        title="Sign out"
        onClick={logout}
        className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
        style={{ color: 'var(--text-3)' }}
      >
        <LogOut size={16} strokeWidth={1.75} />
      </button>
    </div>
  </nav>
);
```

---

## Library View spec

```tsx
const LibraryView = () => (
  <motion.div
    key="library"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: dur.smooth, ease: ease.out }}
    className="flex-1 flex flex-col overflow-hidden"
  >
    {/* Upload strip */}
    <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <label
        className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
        style={{ border: '1px dashed var(--border)' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)';
          (e.currentTarget as HTMLElement).style.background = 'var(--blue-dim)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {uploading ? (
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--blue)' }} />
        ) : (
          <Plus size={14} strokeWidth={1.75} style={{ color: 'var(--text-3)' }} />
        )}
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          {uploading ? 'Uploading...' : 'Add material — PDF, DOCX, TXT'}
        </span>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          ref={fileInputRef}
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </label>
      {uploadError && (
        <p className="mt-2 text-[11px]" style={{ color: '#f87171' }}>{uploadError}</p>
      )}
    </div>

    {/* Section header */}
    <div className="px-5 pt-5 pb-3 flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
        {documents.length} {documents.length === 1 ? 'document' : 'documents'}
      </span>
    </div>

    {/* Document list */}
    <div className="flex-1 overflow-y-auto studio-scroll">
      {docsLoading ? (
        // Skeleton
        [0, 1, 2, 3].map(i => (
          <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: '1px solid var(--border-dim)' }}>
            <div className="h-3 rounded w-48 mb-2" style={{ background: 'var(--surface-2)' }} />
            <div className="h-2 rounded w-28" style={{ background: 'var(--surface-2)' }} />
          </div>
        ))
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <FileText size={32} strokeWidth={1} style={{ color: 'var(--text-3)' }} />
          <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>No documents yet. Upload one above.</p>
        </div>
      ) : (
        documents.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: dur.smooth, ease: ease.out, delay: index * 0.04 }}
            className="group flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
            style={{ borderBottom: '1px solid var(--border-dim)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            onClick={() => {
              setSelectedDocId(doc.id);
              // Load chapters for right panel
              if (chaptersDocId !== doc.id) {
                setChaptersDocId(doc.id);
                setChaptersLoading(true);
                getDocumentChapters(doc.id)
                  .then(res => setChapters(res.chapters || []))
                  .catch(() => {})
                  .finally(() => setChaptersLoading(false));
              }
            }}
          >
            {/* File glyph */}
            <div
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg"
              style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
            >
              <FileText size={15} strokeWidth={1.5} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                {doc.filename}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                {doc.word_count?.toLocaleString()} words
              </div>
            </div>

            {/* Actions — on hover */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={e => { e.stopPropagation(); handleListen(doc); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:brightness-110"
                style={{ background: 'var(--blue)' }}
              >
                Listen
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={e => { e.stopPropagation(); handlePodcast(doc); }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                style={{ border: '1px solid var(--teal)', color: 'var(--teal)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--teal-dim)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                Podcast
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={e => {
                  e.stopPropagation();
                  if (confirm('Delete this document?')) {
                    deleteDocument(doc.id).then(fetchDocuments);
                  }
                }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
              >
                <Trash2 size={13} strokeWidth={1.75} />
              </motion.button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  </motion.div>
);
```

---

## Sync Reader spec (Listen mode)

Shows when `currentDocId` is set and `!podcastPlayingDocId`.

```tsx
const SyncReader = () => (
  <motion.div
    key="reader"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: dur.smooth, ease: ease.out }}
    className="flex-1 flex flex-col overflow-hidden"
  >
    {/* Header bar */}
    <div
      className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <button
        onClick={() => setCurrentDocId(null)}
        className="p-1 rounded-lg transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
      >
        <ChevronRight size={16} strokeWidth={1.75} className="rotate-180" />
      </button>
      <span className="text-[12px] font-bold uppercase tracking-widest truncate" style={{ color: 'var(--text-2)' }}>
        {currentTitle}
      </span>
    </div>

    {/* Document body — warm dark background */}
    <div className="flex-1 overflow-y-auto studio-scroll px-8 py-10" style={{ background: '#15130F' }}>
      <div className="max-w-[68ch] mx-auto space-y-5">
        {visibleTextChunks.length === 0 && (
          <div className="text-[13px]" style={{ color: 'var(--text-3)' }}>Loading document...</div>
        )}
        {visibleTextChunks.map(({ chunk, index }) => (
          <div
            key={index}
            onClick={() => {
              // Seek to chunk — find the seek handler in existing code
              // Common names: handleChunkClick, seekToChunk, handleTranscriptClick
              // Use whatever exists in the current file
            }}
            className="rounded-lg px-4 py-2 cursor-pointer transition-all duration-200"
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: '16px',
              lineHeight: '1.85',
              ...(index === activeChunk
                ? {
                    background: 'var(--blue-dim)',
                    borderLeft: '2px solid var(--blue)',
                    color: '#F5F1EA',
                  }
                : index < activeChunk
                ? { color: '#5A5875', opacity: 0.7 }
                : { color: '#F5F1EA' }),
            }}
          >
            {chunk}
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);
```

**Note:** For the `onClick` on each chunk, look in the existing file for the handler that seeks audio to a specific chunk index. It may be called `handleChunkClick`, `seekToChunk`, or similar. Use whatever name exists. If you can't find it, add `// TODO: wire seek` and move on.

---

## Podcast Theater spec

Shows when `podcastGenerating || podcastPlayingDocId`.

```tsx
const PodcastTheater = () => (
  <motion.div
    key="theater"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: dur.smooth, ease: ease.out }}
    className="flex-1 flex flex-col items-center overflow-hidden"
  >
    {/* Loading panel */}
    {podcastGenerating && !podcastPlayingDocId && (
      <div className="w-full max-w-lg mx-auto mt-10 px-4">
        <FadeUp>
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-6"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            {/* Waveform bars */}
            <div className="flex items-end gap-1 h-12">
              {[0.4, 0.7, 1, 0.8, 0.5, 1, 0.6, 0.9, 0.4, 0.75, 1, 0.55].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full animate-wave"
                  style={{
                    height: `${h * 100}%`,
                    animationDelay: `${i * 0.08}s`,
                    background: 'var(--teal)',
                  }}
                />
              ))}
            </div>

            {/* Text */}
            <div className="text-center">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1"
                style={{ color: 'var(--teal)' }}
              >
                JackPal Studio
              </div>
              <div className="text-[15px] font-semibold" style={{ color: 'var(--text-1)' }}>
                {podcastLoadingMsg || 'Preparing episode...'}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                Ezinne & Abeo · Nigerian voices · plays automatically
              </div>
            </div>

            {/* Host avatars */}
            <div className="flex items-center gap-5">
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold"
                style={{ background: 'var(--teal)', color: 'var(--ink)' }}
              >
                E
              </motion.div>
              <div className="flex gap-0.5 items-end h-5">
                {[1, 2, 3, 2, 1].map((h, i) => (
                  <div
                    key={i}
                    className="w-0.5 rounded-full animate-wave"
                    style={{
                      height: `${40 + h * 12}%`,
                      animationDelay: `${i * 0.12}s`,
                      background: 'rgba(0,201,167,0.4)',
                    }}
                  />
                ))}
              </div>
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut', delay: 0.4 }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                style={{ background: 'var(--blue)' }}
              >
                A
              </motion.div>
            </div>
          </div>
        </FadeUp>
      </div>
    )}

    {/* Transcript */}
    {podcastScript.length > 0 && (
      <div className="w-full max-w-xl mx-auto flex-1 overflow-y-auto studio-scroll px-4 py-6 space-y-1" ref={transcriptRef}>
        {visiblePodcastLines.map(({ line, index }) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.quick, ease: ease.out }}
            className="flex gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors"
            style={index === podcastChunkIndex
              ? { background: 'var(--teal-dim)', borderLeft: '2px solid var(--teal)' }
              : { borderLeft: '2px solid transparent' }
            }
            onMouseEnter={e => {
              if (index !== podcastChunkIndex)
                (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
            }}
            onMouseLeave={e => {
              if (index !== podcastChunkIndex)
                (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {/* Speaker avatar */}
            <div
              className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
              style={line.speaker === 'Ezinne'
                ? { background: 'var(--teal)', color: 'var(--ink)' }
                : { background: 'var(--blue)', color: 'white' }
              }
            >
              {line.speaker?.[0] ?? 'E'}
            </div>

            <div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--text-3)' }}
              >
                {line.speaker}
              </div>
              <div
                className="text-[13px] leading-relaxed"
                style={{ color: index === podcastChunkIndex ? 'var(--text-1)' : 'var(--text-2)' }}
              >
                {line.text}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
);
```

---

## Right Panel spec

```tsx
const RightPanel = () => (
  <AnimatePresence>
    {selectedDocId && (
      <motion.aside
        key="panel"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 304, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={ease.spring}
        className="flex-shrink-0 overflow-hidden"
        style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="w-76 h-full overflow-y-auto studio-scroll p-5 space-y-6">

          {/* Summary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-3)' }}
              >
                AI Study Summary
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSummarize(selectedDocId)}
                disabled={summaryLoadingId === selectedDocId}
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
              >
                {summaryLoadingId === selectedDocId
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Sparkles size={12} strokeWidth={1.75} />
                }
              </motion.button>
            </div>
            <AnimatePresence>
              {summaries[selectedDocId] && (
                <FadeUp>
                  <pre
                    className="text-[11px] leading-relaxed whitespace-pre-wrap rounded-xl p-3"
                    style={{
                      fontFamily: 'var(--font-syne), monospace',
                      background: 'var(--surface-2)',
                      color: 'var(--text-2)',
                    }}
                  >
                    {summaries[selectedDocId]}
                  </pre>
                </FadeUp>
              )}
            </AnimatePresence>
          </div>

          {/* Chapters */}
          {chapters.length > 0 && (
            <div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--text-3)' }}
              >
                Chapters
              </div>
              <div className="space-y-0.5">
                {chapters.map((ch, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors"
                    style={{ color: 'var(--text-2)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <span
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[11px] truncate">{ch.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Q&A */}
          <div>
            <div
              className="flex items-center gap-1.5 mb-3"
              style={{ color: 'var(--text-3)' }}
            >
              <Sparkles size={10} strokeWidth={1.75} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Ask JackPal</span>
            </div>
            <form
              onSubmit={e => handleAsk(selectedDocId, e)}
              className="flex gap-2"
            >
              <input
                value={qaQuestion[selectedDocId] ?? ''}
                onChange={e => setQaQuestion(p => ({ ...p, [selectedDocId]: e.target.value }))}
                placeholder="Ask anything about this doc..."
                className="flex-1 rounded-xl px-3 py-2 text-[11px] outline-none transition-colors"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={qaLoading === selectedDocId || !(qaQuestion[selectedDocId] ?? '').trim()}
                className="px-3 py-2 rounded-xl text-white text-[10px] font-bold transition-all"
                style={{ background: 'var(--blue)' }}
              >
                {qaLoading === selectedDocId
                  ? <Loader2 size={12} className="animate-spin" />
                  : <ArrowRight size={12} strokeWidth={2} />
                }
              </motion.button>
            </form>
            <AnimatePresence>
              {qaAnswer[selectedDocId] && (
                <FadeUp className="mt-3">
                  <div
                    className="rounded-xl p-3 text-[11px] leading-relaxed"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                  >
                    {qaAnswer[selectedDocId]}
                  </div>
                </FadeUp>
              )}
            </AnimatePresence>
          </div>

        </div>
      </motion.aside>
    )}
  </AnimatePresence>
);
```

---

## Player Bar spec

```tsx
const PlayerBar = () => {
  if (!currentDocId && !podcastPlayingDocId && !isAudioLoading) return null;

  const isPodcast = !!podcastPlayingDocId;
  const chunkTotal = isPodcast ? podcastScript.length : textChunks.length;
  const chunkCurrent = isPodcast ? podcastChunkIndex : activeChunk;

  return (
    <div
      className="fixed bottom-0 z-50 flex items-center gap-4 px-5"
      style={{
        left: 56, // rail width
        right: 0,
        height: 64,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Track info */}
      <div className="flex items-center gap-3 w-48 min-w-0 flex-shrink-0">
        <div
          className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={isPodcast
            ? { background: 'var(--teal)', color: 'var(--ink)' }
            : { background: 'var(--blue)', color: 'white' }
          }
        >
          {isPodcast ? (currentSpeaker?.[0] ?? 'E') : <AudioLines size={13} strokeWidth={1.75} />}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
            {currentTitle}
          </div>
          {isPodcast && currentSpeaker && (
            <div className="text-[9px]" style={{ color: 'var(--text-3)' }}>{currentSpeaker}</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
            }
          }}
          style={{ color: 'var(--text-3)' }}
        >
          <SkipBack size={16} strokeWidth={1.75} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            if (audioRef.current?.paused) audioRef.current.play();
            else audioRef.current?.pause();
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: isPodcast ? 'var(--teal)' : 'var(--blue)', color: isPodcast ? 'var(--ink)' : 'white' }}
        >
          <AnimatePresence mode="wait">
            {isAudioLoading ? (
              <motion.span key="spin" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Loader2 size={15} className="animate-spin" />
              </motion.span>
            ) : audioRef.current && !audioRef.current.paused ? (
              <motion.span key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Pause size={15} strokeWidth={2} />
              </motion.span>
            ) : (
              <motion.span key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Play size={15} strokeWidth={2} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
            }
          }}
          style={{ color: 'var(--text-3)' }}
        >
          <SkipForward size={16} strokeWidth={1.75} />
        </motion.button>
      </div>

      {/* Chunk dots */}
      <div className="flex items-center gap-1 flex-1 overflow-x-hidden">
        {Array.from({ length: Math.min(40, chunkTotal || 0) }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-full transition-all duration-200"
            style={{
              width: i === chunkCurrent ? 10 : 6,
              height: i === chunkCurrent ? 10 : 6,
              background: i < chunkCurrent ? 'var(--blue)' : i === chunkCurrent ? (isPodcast ? 'var(--teal)' : 'var(--blue)') : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Speed */}
      <button
        onClick={() => {
          const opts = [0.9, 1, 1.25, 1.5, 1.75];
          const next = opts[(opts.indexOf(playbackRate) + 1) % opts.length];
          setPlaybackRate(next);
          if (audioRef.current) audioRef.current.playbackRate = next;
        }}
        className="text-[10px] font-bold w-8 text-center transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
      >
        {playbackRate}×
      </button>

      {/* Download */}
      {currentDocId && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => downloadAudioArchive(currentDocId)}
          style={{ color: 'var(--text-3)' }}
        >
          <Download size={15} strokeWidth={1.75} />
        </motion.button>
      )}
    </div>
  );
};
```

---

## Required imports at top of dashboard

Make sure these are present at the top of `src/app/dashboard/page.tsx` (in addition to all existing imports):

```ts
import { motion, AnimatePresence } from 'framer-motion';
import { FadeUp, SlideIn, SpringScale } from '@/components/ui/MotionPrimitives';
```

---

## Step 5 — Build check

```bash
cd "C:\Users\HomePC\Downloads\word-audio-chatbt-podcast-making-learning-seamless-in-nigeria\JackPal"
npx tsc --noEmit 2>&1 | head -40
```

Fix all TypeScript errors before marking done.

---

## Things to look up in the existing file (don't guess)

- The chunk seek handler function name (could be `handleChunkClick`, `seekToChunk`, `handleTranscriptChunkClick`, etc.) — search for it and wire it into the reader
- `fetchDocuments` — the function that refreshes the document list
- `handleUpload` — the upload handler (check its signature — it may take a `File` or an event)
- `logout` — already imported from `api.ts`
- `deleteDocument` — already imported

---

## Do NOT touch

- `backend/` — any file
- `src/lib/api.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx` (the landing page)
- Any auth pages (`login`, `signup`, `forgot-password`, `reset-password`)

---

## When done

1. Write to `agents/codex/log.md` what you built and any backend needs
2. Update `agents/shared/handoff-queue.md` — set DASH-001 to `DONE`
