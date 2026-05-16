'use client';

import { useState, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Upload, Search, LogOut, BookOpen, Headphones, Layers, ChevronRight, Trash2, Loader2, X } from 'lucide-react';
import type { Document } from '@/lib/api';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         '#060C22',
  sidebar:    '#0A1130',
  card:       '#0D1635',
  cardAlt:    '#111D40',
  blue:       '#1B6EF3',
  amber:      '#F5A623',
  green:      '#10B981',
  purple:     '#9333EA',
  ink:        '#FFFFFF',
  muted:      '#8B9BB4',
  border:     'rgba(255,255,255,0.08)',
  borderHov:  'rgba(255,255,255,0.14)',
};

// ── Subject palette ──────────────────────────────────────────────────────────
const SUBJECTS: Record<string, { ink: string; tint: string; glyph: string }> = {
  Biology:    { ink: '#0F5132', tint: '#D6F0DC', glyph: '🌿' },
  Economics:  { ink: '#1B3A8A', tint: '#DCE6FB', glyph: '₦' },
  Law:        { ink: '#7C2D12', tint: '#FBE3D2', glyph: '§' },
  Chemistry:  { ink: '#581C87', tint: '#ECDDF8', glyph: '⚗' },
  Literature: { ink: '#9F1239', tint: '#FCDDE4', glyph: '✎' },
  Math:       { ink: '#0E4F66', tint: '#D2EDF7', glyph: '∑' },
  General:    { ink: '#1B6EF3', tint: '#DCE6FB', glyph: '◉' },
};
const SUBJECT_KEYS = Object.keys(SUBJECTS);

function subjectForDoc(doc: Document, subjectsMap: Record<string, string>, index: number) {
  const label = subjectsMap[doc.id];
  if (label && SUBJECTS[label]) return { label, ...SUBJECTS[label] };
  const key = SUBJECT_KEYS[index % SUBJECT_KEYS.length];
  return { label: key, ...SUBJECTS[key] };
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function fmtDuration(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ── Wave progress SVG ────────────────────────────────────────────────────────
const WAVE_PATH = "M2 20 C8 20 10 13 16 20 S26 27 32 20 S42 13 48 20 S58 27 64 20 S74 13 80 20 S90 27 96 20 S106 13 112 20 S122 27 128 20 S138 13 144 20 S154 27 160 20 S170 13 176 20 S186 27 192 20 S202 13 208 20 S218 27 224 20 L518 20";

function WaveProgressBar({ progress = 0, accent = T.blue, height = 36 }: { progress?: number; accent?: string; height?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg viewBox="0 0 520 40" preserveAspectRatio="none"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d={WAVE_PATH} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, width: `${progress}%`, overflow: 'hidden',
                    maskImage: 'linear-gradient(to right, #000 92%, transparent)' }}>
        <svg viewBox="0 0 520 40" preserveAspectRatio="none"
             style={{ width: `${100 / Math.max(progress, 0.001) * 100}%`, height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id={`wave-grad-${accent.replace('#','')}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
          </defs>
          <path d={WAVE_PATH} fill="none"
                stroke={`url(#wave-grad-${accent.replace('#','')})`}
                strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: `${progress}%`,
        width: 10, height: 10, borderRadius: '50%',
        background: accent, boxShadow: `0 0 0 4px ${accent}22, 0 2px 8px ${accent}66`,
        transform: 'translate(-50%, -50%)',
      }} />
    </div>
  );
}

function MiniWaveBars({ accent = T.blue, playing = true, count = 24 }: { accent?: string; playing?: boolean; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 22 }}>
      {Array.from({ length: count }).map((_, i) => {
        const h = 30 + Math.abs(Math.sin(i * 0.7) * 60) + (i % 3) * 6;
        return (
          <span key={i} style={{
            width: 3, borderRadius: 3, background: accent,
            height: `${Math.min(100, h)}%`,
            opacity: 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + 1)),
            animation: playing ? `jp-bar-pulse 1.3s ${(i * 0.06).toFixed(2)}s ease-in-out infinite` : 'none',
          }} />
        );
      })}
    </div>
  );
}

function SubjectChip({ subject, ink, tint }: { subject: string; ink: string; tint: string }) {
  const s = SUBJECTS[subject] ?? SUBJECTS.General;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      background: s.ink + '44',
      color: s.tint,
      fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: 0.3,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 11 }}>{s.glyph}</span>{subject.toUpperCase()}
    </span>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function LibSidebar({ onUploadClick, onSwitchToWorkspace, onLogout, activeView, onSetView }: {
  onUploadClick: () => void;
  onSwitchToWorkspace: () => void;
  onLogout: () => void;
  activeView: 'library' | 'player';
  onSetView: (v: 'library' | 'player') => void;
}) {
  const navItems = [
    { id: 'library' as const, label: 'Library', icon: BookOpen },
    { id: 'player' as const, label: 'Now Playing', icon: Headphones },
  ];

  return (
    <aside style={{
      width: 236, flexShrink: 0,
      background: T.sidebar,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      gap: 8,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingLeft: 4 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${T.blue}, #5B4FE9)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 16, color: '#fff',
        }}>J</div>
        <span style={{
          fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 17,
          color: T.ink, letterSpacing: '-0.02em',
        }}>JackPals</span>
      </div>

      {/* Upload CTA */}
      <button
        onClick={onUploadClick}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          height: 40, borderRadius: 12, border: 'none',
          background: T.blue, color: '#fff',
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
          cursor: 'pointer', marginBottom: 8,
          boxShadow: `0 4px 16px ${T.blue}44`,
        }}
      >
        <Upload size={15} />
        Upload document
      </button>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSetView(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, border: 'none',
              background: activeView === id ? `${T.blue}22` : 'transparent',
              color: activeView === id ? T.blue : T.muted,
              fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
        <button
          onClick={onSwitchToWorkspace}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, border: 'none',
            background: 'transparent', color: T.muted,
            fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13,
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}
        >
          <Layers size={15} />
          Workspace
        </button>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 10, border: 'none',
            background: 'transparent', color: T.muted,
            fontFamily: "'Syne', sans-serif", fontSize: 12,
            cursor: 'pointer', width: '100%',
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ── Top bar ──────────────────────────────────────────────────────────────────
function LibTopBar({ user, searchQuery, onSearchChange, onUploadClick }: {
  user: { username?: string; email?: string } | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUploadClick: () => void;
}) {
  const name = user?.username ?? user?.email?.split('@')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{
      height: 64, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 16,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 20, fontWeight: 600,
          color: T.ink, letterSpacing: '-0.02em',
        }}>
          {greeting}, {name}
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${T.border}`,
        borderRadius: 12, padding: '8px 14px', width: 220,
      }}>
        <Search size={14} color={T.muted} />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search library..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: T.ink, fontFamily: "'Syne', sans-serif", fontSize: 13,
            flex: 1, width: '100%',
          }}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}>
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Document card ────────────────────────────────────────────────────────────
function DocCard({ doc, subject, isActive, isPlaying, playerProgress, onPlay, onDelete, index }: {
  doc: Document;
  subject: { label: string; ink: string; tint: string; glyph: string };
  isActive: boolean;
  isPlaying: boolean;
  playerProgress: number;
  onPlay: () => void;
  onDelete: () => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const readyChunks = doc.ready_chunks ?? 0;
  const totalChunks = doc.total_chunks ?? 0;
  const progress = isActive ? playerProgress : (readyChunks > 0 && totalChunks > 0 ? (readyChunks / totalChunks) * 100 : 0);
  const isReady = doc.status === 'ready' || doc.status === 'audio_ready' || readyChunks > 0;
  const isGenerating = doc.status === 'generating' || doc.status === 'streaming';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isReady ? onPlay : undefined}
      style={{
        background: isActive ? `${T.blue}18` : hovered ? T.cardAlt : T.card,
        border: `1.5px solid ${isActive ? T.blue + '66' : hovered ? T.borderHov : T.border}`,
        borderRadius: 18, padding: '16px',
        cursor: isReady ? 'pointer' : 'default',
        transition: 'all 0.18s',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 88, borderRadius: 12, overflow: 'hidden',
        background: subject.ink + '33',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        border: `1px solid ${subject.ink}44`,
      }}>
        <span style={{ fontSize: 36, opacity: 0.7 }}>{subject.glyph}</span>
        {isActive && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
            <MiniWaveBars accent={subject.tint} playing={isPlaying} count={16} />
          </div>
        )}
        {isGenerating && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(6,12,34,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.amber,
            letterSpacing: 1,
          }}>
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            GENERATING
          </div>
        )}
        {/* Delete button on hover */}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); if (confirm('Delete this document?')) onDelete(); }}
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 24, height: 24, borderRadius: 8,
              background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Meta */}
      <div style={{ flex: 1 }}>
        <SubjectChip subject={subject.label} ink={subject.ink} tint={subject.tint} />
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 14, fontWeight: 600,
          color: T.ink, letterSpacing: '-0.01em',
          marginTop: 6, lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        } as React.CSSProperties}>
          {doc.filename.replace(/\.(pdf|docx?|txt)$/i, '')}
        </div>
        {doc.word_count > 0 && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, marginTop: 4 }}>
            {Math.round(doc.word_count / 150)} min read
          </div>
        )}
      </div>

      {/* Progress strip */}
      {isActive && (
        <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${playerProgress}%`, background: T.blue, borderRadius: 999, transition: 'width 0.3s' }} />
        </div>
      )}
    </div>
  );
}

// ── Continue Hero card ────────────────────────────────────────────────────────
function HeroCard({ doc, subject, isPlaying, playerProgress, currentTime, duration, onPlay, onTogglePlay, onSkipBy, formatTime }: {
  doc: Document;
  subject: { label: string; ink: string; tint: string; glyph: string };
  isPlaying: boolean;
  playerProgress: number;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onTogglePlay: () => void;
  onSkipBy: (delta: number) => void;
  formatTime: (v: number) => string;
}) {
  return (
    <div style={{
      background: T.cardAlt,
      border: `1.5px solid ${T.blue}44`,
      borderRadius: 20, padding: '20px 24px',
      display: 'flex', gap: 20, alignItems: 'center',
      marginBottom: 28,
      boxShadow: `0 0 0 1px ${T.blue}22, 0 8px 32px rgba(0,0,0,0.4)`,
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 100, height: 100, flexShrink: 0,
        borderRadius: 14, background: subject.ink + '33',
        border: `1px solid ${subject.ink}55`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 32, opacity: 0.8 }}>{subject.glyph}</span>
        <MiniWaveBars accent={subject.tint} playing={isPlaying} count={12} />
      </div>

      {/* Info + controls */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.blue, letterSpacing: 1.2, marginBottom: 4 }}>
          CONTINUE LISTENING
        </div>
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 600,
          color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {doc.filename.replace(/\.(pdf|docx?|txt)$/i, '')}
        </div>
        <div style={{ marginTop: 14 }}>
          <WaveProgressBar progress={playerProgress} accent={T.blue} height={32} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: 0.5,
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        {/* Transport */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button onClick={() => onSkipBy(-10)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}>
            <SkipBack size={16} />
          </button>
          <button
            onClick={onTogglePlay}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: T.blue, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${T.blue}55`,
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button onClick={() => onSkipBy(10)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}>
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Library view ─────────────────────────────────────────────────────────────
function LibLibrary({ documents, filteredDocuments, docsLoading, subjects, searchQuery, currentDocId, isPlaying, playerProgress, currentTime, duration, isAudioLoading, onPlayDoc, onUploadClick, onDeleteDoc, onTogglePlay, onSkipBy, formatTime }: {
  documents: Document[];
  filteredDocuments: Document[];
  docsLoading: boolean;
  subjects: Record<string, string>;
  searchQuery: string;
  currentDocId: string | null;
  isPlaying: boolean;
  playerProgress: number;
  currentTime: number;
  duration: number;
  isAudioLoading: boolean;
  onPlayDoc: (docId: string) => void;
  onUploadClick: () => void;
  onDeleteDoc: (docId: string) => void;
  onTogglePlay: () => void;
  onSkipBy: (delta: number) => void;
  formatTime: (v: number) => string;
}) {
  const [filter, setFilter] = useState<'all' | 'ready' | 'processing' | 'unstarted'>('all');

  const currentDoc = currentDocId ? filteredDocuments.find(d => d.id === currentDocId) ?? documents.find(d => d.id === currentDocId) : null;
  const currentDocIndex = currentDoc ? documents.indexOf(currentDoc) : 0;
  const currentSubject = currentDoc ? subjectForDoc(currentDoc, subjects, currentDocIndex) : null;

  const displayDocs = useMemo(() => {
    return filteredDocuments.filter(doc => {
      if (filter === 'all') return true;
      if (filter === 'ready') return doc.status === 'ready' || doc.status === 'audio_ready' || (doc.ready_chunks ?? 0) > 0;
      if (filter === 'processing') return doc.status === 'generating' || doc.status === 'streaming';
      if (filter === 'unstarted') return doc.status === 'error' && (doc.ready_chunks ?? 0) === 0;
      return true;
    });
  }, [filteredDocuments, filter]);

  const filters: { id: typeof filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'ready', label: 'Ready' },
    { id: 'processing', label: 'Generating' },
    { id: 'unstarted', label: 'Not started' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }} className="jp-scroll">
      {/* Hero card for currently playing */}
      {currentDoc && currentSubject && (
        <HeroCard
          doc={currentDoc}
          subject={currentSubject}
          isPlaying={isPlaying}
          playerProgress={playerProgress}
          currentTime={currentTime}
          duration={duration}
          onPlay={() => onPlayDoc(currentDoc.id)}
          onTogglePlay={onTogglePlay}
          onSkipBy={onSkipBy}
          formatTime={formatTime}
        />
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '5px 14px', borderRadius: 999,
              border: `1px solid ${filter === f.id ? T.blue : T.border}`,
              background: filter === f.id ? `${T.blue}22` : 'transparent',
              color: filter === f.id ? T.blue : T.muted,
              fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted }}>
          {displayDocs.length} doc{displayDocs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {docsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 180, borderRadius: 18, background: T.card, animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : displayDocs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
            {searchQuery ? 'No documents found' : 'Your library is empty'}
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: T.muted, marginBottom: 20 }}>
            {searchQuery ? 'Try a different search term' : 'Upload a PDF or document to get started'}
          </div>
          {!searchQuery && (
            <button
              onClick={onUploadClick}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: T.blue, color: '#fff',
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Upload your first document
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {displayDocs.map((doc, i) => {
            const subject = subjectForDoc(doc, subjects, documents.indexOf(doc));
            return (
              <DocCard
                key={doc.id}
                doc={doc}
                subject={subject}
                isActive={doc.id === currentDocId}
                isPlaying={isPlaying}
                playerProgress={playerProgress}
                onPlay={() => onPlayDoc(doc.id)}
                onDelete={() => onDeleteDoc(doc.id)}
                index={i}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Player view ──────────────────────────────────────────────────────────────
function LibPlayer({ doc, subject, isPlaying, playerProgress, currentTime, duration, isAudioLoading, onTogglePlay, onSkipBy, formatTime, onBack }: {
  doc: Document | null;
  subject: { label: string; ink: string; tint: string; glyph: string } | null;
  isPlaying: boolean;
  playerProgress: number;
  currentTime: number;
  duration: number;
  isAudioLoading: boolean;
  onTogglePlay: () => void;
  onSkipBy: (delta: number) => void;
  formatTime: (v: number) => string;
  onBack: () => void;
}) {
  if (!doc || !subject) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Headphones size={40} color={T.muted} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: "'Syne', sans-serif", color: T.muted, fontSize: 14 }}>Nothing playing</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 28px', overflowY: 'auto' }} className="jp-scroll">
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start', background: 'none', border: 'none',
          color: T.muted, cursor: 'pointer', fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32,
        }}
      >
        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
        Back to library
      </button>

      {/* Cover art */}
      <div style={{
        width: 200, height: 200, borderRadius: 24,
        background: subject.ink + '33',
        border: `1px solid ${subject.ink}66`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        marginBottom: 28,
        boxShadow: `0 20px 60px ${subject.ink}44`,
      }}>
        <span style={{ fontSize: 72 }}>{subject.glyph}</span>
        <MiniWaveBars accent={subject.tint} playing={isPlaying} count={20} />
      </div>

      {/* Title + subject */}
      <SubjectChip subject={subject.label} ink={subject.ink} tint={subject.tint} />
      <div style={{
        fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 600,
        color: T.ink, letterSpacing: '-0.02em', textAlign: 'center',
        marginTop: 10, marginBottom: 4, maxWidth: 360, lineHeight: 1.3,
      }}>
        {doc.filename.replace(/\.(pdf|docx?|txt)$/i, '')}
      </div>
      {doc.word_count > 0 && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted }}>
          {Math.round(doc.word_count / 150)} min read
        </div>
      )}

      {/* Wave progress */}
      <div style={{ width: '100%', maxWidth: 400, marginTop: 32 }}>
        <WaveProgressBar progress={playerProgress} accent={T.blue} height={40} />
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted,
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 24 }}>
        <button onClick={() => onSkipBy(-10)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}>
          <SkipBack size={22} />
        </button>
        <button
          onClick={onTogglePlay}
          style={{
            width: 60, height: 60, borderRadius: '50%', border: 'none',
            background: T.blue, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 28px ${T.blue}55`,
          }}
        >
          {isAudioLoading
            ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            : isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 2 }} />
          }
        </button>
        <button onClick={() => onSkipBy(10)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}>
          <SkipForward size={22} />
        </button>
      </div>
    </div>
  );
}

// ── Mini player ──────────────────────────────────────────────────────────────
function LibMiniPlayer({ doc, subject, isPlaying, playerProgress, currentTime, duration, isAudioLoading, onTogglePlay, onSkipBy, formatTime, onGoToPlayer }: {
  doc: Document | null;
  subject: { label: string; ink: string; tint: string; glyph: string } | null;
  isPlaying: boolean;
  playerProgress: number;
  currentTime: number;
  duration: number;
  isAudioLoading: boolean;
  onTogglePlay: () => void;
  onSkipBy: (delta: number) => void;
  formatTime: (v: number) => string;
  onGoToPlayer: () => void;
}) {
  if (!doc || !subject) return null;

  return (
    <div style={{
      height: 72, flexShrink: 0,
      background: T.cardAlt,
      borderTop: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 14,
      position: 'relative',
    }}>
      {/* Progress strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'rgba(255,255,255,0.05)',
      }}>
        <div style={{ height: '100%', width: `${playerProgress}%`, background: T.blue, transition: 'width 0.3s' }} />
      </div>

      {/* Thumbnail */}
      <div
        onClick={onGoToPlayer}
        style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: subject.ink + '33',
          border: `1px solid ${subject.ink}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 20 }}>{subject.glyph}</span>
      </div>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onGoToPlayer}>
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif", fontSize: 13, fontWeight: 600,
          color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {doc.filename.replace(/\.(pdf|docx?|txt)$/i, '')}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, marginTop: 2 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => onSkipBy(-10)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}>
          <SkipBack size={16} />
        </button>
        <button
          onClick={onTogglePlay}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: T.blue, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isAudioLoading
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />
          }
        </button>
        <button onClick={() => onSkipBy(10)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}>
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Root component ───────────────────────────────────────────────────────────
export interface LibraryDashboardProps {
  user: { username?: string; email?: string } | null;
  documents: Document[];
  filteredDocuments: Document[];
  docsLoading: boolean;
  subjects: Record<string, string>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentDocId: string | null;
  isPlaying: boolean;
  playerProgress: number;
  currentTime: number;
  duration: number;
  isAudioLoading: boolean;
  onPlayDoc: (docId: string) => void;
  onUploadClick: () => void;
  onDeleteDoc: (docId: string) => void;
  onLogout: () => void;
  onSwitchToWorkspace: () => void;
  onTogglePlay: () => void;
  onSkipBy: (delta: number) => void;
  formatTime: (v: number) => string;
}

export function LibraryDashboard({
  user,
  documents,
  filteredDocuments,
  docsLoading,
  subjects,
  searchQuery,
  onSearchChange,
  currentDocId,
  isPlaying,
  playerProgress,
  currentTime,
  duration,
  isAudioLoading,
  onPlayDoc,
  onUploadClick,
  onDeleteDoc,
  onLogout,
  onSwitchToWorkspace,
  onTogglePlay,
  onSkipBy,
  formatTime,
}: LibraryDashboardProps) {
  const [view, setView] = useState<'library' | 'player'>('library');

  const currentDoc = currentDocId ? documents.find(d => d.id === currentDocId) ?? null : null;
  const currentDocIndex = currentDoc ? documents.indexOf(currentDoc) : 0;
  const currentSubject = currentDoc ? subjectForDoc(currentDoc, subjects, currentDocIndex) : null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      background: T.bg, color: T.ink,
      fontFamily: "'Syne', sans-serif",
    }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <LibSidebar
          onUploadClick={onUploadClick}
          onSwitchToWorkspace={onSwitchToWorkspace}
          onLogout={onLogout}
          activeView={view}
          onSetView={setView}
        />

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <LibTopBar
            user={user}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onUploadClick={onUploadClick}
          />

          {view === 'library' ? (
            <LibLibrary
              documents={documents}
              filteredDocuments={filteredDocuments}
              docsLoading={docsLoading}
              subjects={subjects}
              searchQuery={searchQuery}
              currentDocId={currentDocId}
              isPlaying={isPlaying}
              playerProgress={playerProgress}
              currentTime={currentTime}
              duration={duration}
              isAudioLoading={isAudioLoading}
              onPlayDoc={onPlayDoc}
              onUploadClick={onUploadClick}
              onDeleteDoc={onDeleteDoc}
              onTogglePlay={onTogglePlay}
              onSkipBy={onSkipBy}
              formatTime={formatTime}
            />
          ) : (
            <LibPlayer
              doc={currentDoc}
              subject={currentSubject}
              isPlaying={isPlaying}
              playerProgress={playerProgress}
              currentTime={currentTime}
              duration={duration}
              isAudioLoading={isAudioLoading}
              onTogglePlay={onTogglePlay}
              onSkipBy={onSkipBy}
              formatTime={formatTime}
              onBack={() => setView('library')}
            />
          )}

          {/* Mini player */}
          <LibMiniPlayer
            doc={currentDoc}
            subject={currentSubject}
            isPlaying={isPlaying}
            playerProgress={playerProgress}
            currentTime={currentTime}
            duration={duration}
            isAudioLoading={isAudioLoading}
            onTogglePlay={onTogglePlay}
            onSkipBy={onSkipBy}
            formatTime={formatTime}
            onGoToPlayer={() => setView('player')}
          />
        </div>
      </div>
    </div>
  );
}
