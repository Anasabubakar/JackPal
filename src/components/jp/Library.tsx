'use client';

import React, { useState } from 'react';
import {
  useJp,
  JP_SUBJECTS,
  JP_VOICES,
  fmtTime,
  fmtDuration,
  type JpDoc,
  type JpTheme,
} from '@/store/jpStore';
import { JpWaveBar, JpVoiceAvatar, JpSubjectChip } from './atoms';

interface LibraryProps {
  t: JpTheme;
  accent: string;
  radius: number;
}

type FilterKind = 'All' | 'In progress' | 'Finished' | 'Not started';
const FILTERS: FilterKind[] = ['All', 'In progress', 'Finished', 'Not started'];

export function Library({ t, accent, radius }: LibraryProps) {
  const { docs, currentDocId, isPlaying, loading } = useJp();
  const [filter, setFilter] = useState<FilterKind>('All');

  const currentDoc = docs.find(d => d.id === currentDocId) || docs[0];

  const filtered = docs.filter(d => {
    if (filter === 'All') return true;
    if (filter === 'In progress') return d.progressSec > 0 && d.progressSec < d.durationSec;
    if (filter === 'Finished') return d.progressSec >= d.durationSec;
    if (filter === 'Not started') return d.progressSec === 0;
    return true;
  });

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
      className="jp-scroll"
    >
      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: t.muted, fontSize: 13 }}>Loading your library…</div>
      )}

      {/* Empty state */}
      {!loading && docs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: t.card, border: `1px solid ${t.border}`, borderRadius: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.ink, fontFamily: "'Fraunces', Georgia, serif", marginBottom: 8 }}>Your library is empty</div>
          <div style={{ fontSize: 14, color: t.muted, marginBottom: 24 }}>Upload a PDF to get started — we'll convert it to audio in seconds.</div>
        </div>
      )}

      {/* Continue hero */}
      {!loading && currentDoc && (
        <ContinueHero doc={currentDoc} t={t} accent={accent} radius={radius} isPlaying={isPlaying} />
      )}

      {/* Library header + grid */}
      {!loading && docs.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.ink, fontFamily: "'Fraunces', Georgia, serif" }}>
              Your library
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 100,
                    border: `1px solid ${filter === f ? accent : t.border}`,
                    background: filter === f ? `${accent}18` : 'transparent',
                    color: filter === f ? accent : t.muted,
                    fontSize: 12,
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: filter === f ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Card grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filtered.map(doc => (
              <DesktopDocCard key={doc.id} doc={doc} t={t} accent={accent} radius={radius} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── ContinueHero ───────────────────────────────────────────────────────────────

function ContinueHero({
  doc,
  t,
  accent,
  radius,
  isPlaying,
}: {
  doc: JpDoc;
  t: JpTheme;
  accent: string;
  radius: number;
  isPlaying: boolean;
}) {
  const { playDoc, togglePlay } = useJp();
  const subj = JP_SUBJECTS[doc.subject] || JP_SUBJECTS['Biology'];
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: radius,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        minHeight: 220,
        position: 'relative',
      }}
    >
      {/* Decorative ribbon */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${subj.ink}, ${accent})`,
        }}
      />

      {/* Left: Meta */}
      <div
        style={{
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              fontSize: 9,
              color: accent,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              letterSpacing: '0.12em',
              background: `${accent}18`,
              padding: '3px 10px',
              borderRadius: 100,
              border: `1px solid ${accent}33`,
            }}
          >
            CONTINUE LISTENING
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              color: t.muted,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            {doc.course}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: t.ink,
              fontFamily: "'Fraunces', Georgia, serif",
              lineHeight: 1.2,
            }}
          >
            {doc.title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <JpVoiceAvatar voiceId={doc.voice} size={24} />
          <span style={{ fontSize: 12, color: t.muted, fontFamily: "'Syne', sans-serif" }}>
            {JP_VOICES.find(v => v.id === doc.voice)?.name}
          </span>
          <span style={{ fontSize: 12, color: t.faded }}>·</span>
          <span
            style={{
              fontSize: 12,
              color: t.muted,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {fmtTime(doc.progressSec)} / {fmtDuration(doc.durationSec)}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={() => (isPlaying ? togglePlay() : playDoc(doc.id, 'desktop'))}
            style={{
              height: 40,
              padding: '0 20px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isPlaying ? '⏸' : '▶'} {isPlaying ? 'Pause' : 'Resume'}
          </button>
          <button
            style={{
              height: 40,
              padding: '0 16px',
              borderRadius: 10,
              background: 'transparent',
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              cursor: 'pointer',
            }}
          >
            + Playlist
          </button>
          <button
            style={{
              height: 40,
              width: 40,
              borderRadius: 10,
              background: 'transparent',
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Right: Visual */}
      <div
        style={{
          background: `linear-gradient(135deg, ${subj.ink}44, ${subj.ink}22)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Large glyph */}
        <div
          style={{
            fontSize: 80,
            opacity: 0.15,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            userSelect: 'none',
          }}
        >
          {subj.glyph}
        </div>
        <JpSubjectChip subject={doc.subject} theme={t} />
        <JpWaveBar progress={progress} accent={accent} height={48} animated={isPlaying} theme={t} />
        <div
          style={{
            fontSize: 11,
            color: t.muted,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {Math.round(progress * 100)}% complete · {fmtDuration(doc.durationSec - doc.progressSec)} left
        </div>
      </div>
    </div>
  );
}

// ── DesktopDocCard ─────────────────────────────────────────────────────────────

function DesktopDocCard({
  doc,
  t,
  accent,
  radius,
}: {
  doc: JpDoc;
  t: JpTheme;
  accent: string;
  radius: number;
}) {
  const { playDoc } = useJp();
  const [hovered, setHovered] = useState(false);
  const subj = JP_SUBJECTS[doc.subject] || JP_SUBJECTS['Biology'];
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.card,
        border: `1px solid ${hovered ? t.borderHi : t.border}`,
        borderRadius: radius * 0.8,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 32px ${t.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'}`
          : 'none',
      }}
    >
      {/* Subject thumbnail */}
      <div
        style={{
          height: 90,
          background: `linear-gradient(135deg, ${subj.ink}55, ${subj.ink}22)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: 44, opacity: 0.35 }}>{subj.glyph}</div>
        {/* Play button on hover */}
        {hovered && (
          <button
            onClick={() => playDoc(doc.id, 'desktop')}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: accent,
              border: 'none',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${accent}66`,
              animation: 'jp-fade-in 0.15s ease',
            }}
          >
            ▶
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <JpSubjectChip subject={doc.subject} theme={t} />
        <div
          style={{
            fontSize: 9,
            color: t.muted,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.06em',
          }}
        >
          {doc.course}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: t.ink,
            fontFamily: "'Fraunces', Georgia, serif",
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {doc.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <JpVoiceAvatar voiceId={doc.voice} size={20} />
          <JpWaveBar progress={progress} accent={accent} height={20} theme={t} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: t.muted,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {fmtDuration(doc.durationSec)}
          </span>
          <span
            style={{
              fontSize: 10,
              color: t.faded,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {doc.updated}
          </span>
        </div>
      </div>
    </div>
  );
}
