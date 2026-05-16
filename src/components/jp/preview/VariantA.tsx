'use client';

import React, { useEffect, useRef } from 'react';
import {
  usePreview,
  PREVIEW_TOKENIZED,
  PREVIEW_DOC,
  PARAGRAPH_TITLES,
  type Token,
} from './PreviewState';
import { JP_SUBJECTS } from '@/store/jpStore';
import { JpWaveBar, JpVoiceAvatar, JpSubjectChip } from '../atoms';
import type { JpTheme } from '@/store/jpStore';

interface VariantAProps {
  theme: JpTheme;
  accent: string;
}

const SOURCE_TYPES = [
  { id: 'pdf',     icon: '📄', label: 'Photosynthesis.pdf', sub: '24 pages · 2.4 MB' },
  { id: 'youtube', icon: '▶',  label: 'Crash Course Biology',  sub: 'YouTube · 12:34' },
  { id: 'web',     icon: '◑',  label: 'Khan Academy article',  sub: 'Web article' },
  { id: 'notes',   icon: '✎',  label: 'Lecture notes',         sub: 'Pasted text' },
];

const subj = JP_SUBJECTS['Biology'];
const progress = 0.63;

export default function VariantA({ theme: t, accent }: VariantAProps) {
  const { tIndex, playing, speed, setPlaying, setSpeed } = usePreview();
  const currentPara = PREVIEW_TOKENIZED[tIndex]?.paragraph ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: t.bg,
        overflow: 'hidden',
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* Left sidebar */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          background: t.sidebar,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Back button */}
        <div style={{ padding: '16px 16px 8px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: t.muted,
              fontSize: 13,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ← Library
          </button>
        </div>

        {/* Source card */}
        <div style={{ padding: '0 12px 12px' }}>
          <div
            style={{
              fontSize: 9,
              color: t.faded,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.1em',
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            SOURCE
          </div>
          {SOURCE_TYPES.map(src => (
            <PreviewSourceCard key={src.id} src={src} t={t} accent={accent} active={src.id === 'pdf'} />
          ))}
        </div>

        {/* Outline */}
        <div
          style={{
            fontSize: 9,
            color: t.faded,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em',
            padding: '0 16px 8px',
          }}
        >
          OUTLINE
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }} className="jp-scroll">
          {PARAGRAPH_TITLES.map((title, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: currentPara === i ? `${accent}18` : 'transparent',
                border: `1px solid ${currentPara === i ? accent + '44' : 'transparent'}`,
                marginBottom: 4,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: currentPara === i ? 700 : 400,
                  color: currentPara === i ? accent : t.muted,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {title}
              </div>
            </div>
          ))}
        </div>

        {/* AI Tools */}
        <div style={{ padding: 12, borderTop: `1px solid ${t.border}` }}>
          <div
            style={{
              fontSize: 9,
              color: t.faded,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}
          >
            AI TOOLS
          </div>
          {['Summarize', 'Generate quiz', 'Ask'].map(tool => (
            <button
              key={tool}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: t.muted,
                fontSize: 12,
                cursor: 'pointer',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: accent }}>✦</span> {tool}
            </button>
          ))}
        </div>
      </div>

      {/* Main reading column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div
          style={{
            height: 52,
            borderBottom: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <JpSubjectChip subject="Biology" theme={t} />
          <div
            style={{
              flex: 1,
              fontSize: 12,
              color: t.muted,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {PREVIEW_DOC.course}
          </div>
          <button
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: `${accent}18`,
              border: `1px solid ${accent}33`,
              color: accent,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            p. 12
          </button>
          <button
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Aa
          </button>
        </div>

        {/* Reading area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 40px 120px' }} className="jp-scroll">
          <ReaderBody tokens={PREVIEW_TOKENIZED} tIndex={tIndex} t={t} accent={accent} />
        </div>
      </div>

      {/* Bottom player bar */}
      <PreviewPlayerBar
        t={t}
        accent={accent}
        playing={playing}
        speed={speed}
        progress={progress}
        onTogglePlay={() => setPlaying(!playing)}
        onSpeed={setSpeed}
      />
    </div>
  );
}

// ── Source card ───────────────────────────────────────────────────────────────

function PreviewSourceCard({
  src,
  t,
  accent,
  active,
}: {
  src: { id: string; icon: string; label: string; sub: string };
  t: JpTheme;
  accent: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 10,
        background: active ? `${accent}18` : 'transparent',
        border: `1px solid ${active ? accent + '44' : 'transparent'}`,
        cursor: 'pointer',
        marginBottom: 3,
      }}
    >
      <span style={{ fontSize: 16 }}>{src.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: active ? 700 : 400,
            color: active ? t.ink : t.muted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {src.label}
        </div>
        <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace" }}>
          {src.sub}
        </div>
      </div>
    </div>
  );
}

// ── ReaderBody ────────────────────────────────────────────────────────────────

function ReaderBody({
  tokens,
  tIndex,
  t,
  accent,
}: {
  tokens: Token[];
  tIndex: number;
  t: JpTheme;
  accent: string;
}) {
  const currentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [tIndex]);

  const byPara: Token[][] = [];
  tokens.forEach(tok => {
    if (!byPara[tok.paragraph]) byPara[tok.paragraph] = [];
    byPara[tok.paragraph].push(tok);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {byPara.map((paraToks, pIdx) => {
        const isCurrent = paraToks.some(tk => tk.index === tIndex);
        return (
          <div
            key={pIdx}
            style={{
              borderLeft: `3px solid ${isCurrent ? accent : 'transparent'}`,
              paddingLeft: 20,
              transition: 'border-color 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: accent,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              {PARAGRAPH_TITLES[pIdx]}
            </div>
            <p
              style={{
                fontSize: 21,
                fontFamily: "'Fraunces', Georgia, serif",
                lineHeight: 1.75,
                color: t.ink,
                margin: 0,
              }}
            >
              {paraToks.map(tok => {
                const isCur = tok.index === tIndex;
                const isRead = tok.index < tIndex;
                return (
                  <span
                    key={tok.index}
                    ref={isCur ? currentRef : undefined}
                    style={{
                      background: isCur ? accent : 'transparent',
                      color: isCur ? '#fff' : isRead ? t.muted : t.ink,
                      borderRadius: 4,
                      padding: isCur ? '2px 4px' : '2px 0',
                      transition: 'all 0.2s ease',
                      textDecoration: isCur ? 'underline' : 'none',
                      textDecorationColor: isCur ? `${accent}88` : 'transparent',
                    }}
                  >
                    {tok.word}{' '}
                  </span>
                );
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── PreviewPlayerBar ──────────────────────────────────────────────────────────

export function PreviewPlayerBar({
  t,
  accent,
  playing,
  speed,
  progress,
  onTogglePlay,
  onSpeed,
}: {
  t: JpTheme;
  accent: string;
  playing: boolean;
  speed: number;
  progress: number;
  onTogglePlay: () => void;
  onSpeed: (s: number) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 260,
        right: 0,
        height: 72,
        background: t.sidebar,
        borderTop: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
      }}
    >
      <JpVoiceAvatar voiceId={PREVIEW_DOC.voice} size={32} ring />
      <div style={{ flex: 1 }}>
        <JpWaveBar progress={progress} accent={accent} height={36} animated={playing} theme={t} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          style={{
            fontSize: 11,
            color: t.muted,
            background: t.inset,
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: '4px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
          }}
          onClick={() => onSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}
        >
          {speed}×
        </button>
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            border: 'none',
            color: '#fff',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onTogglePlay}
        >
          {playing ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}
