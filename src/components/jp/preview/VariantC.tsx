'use client';

import React from 'react';
import { usePreview, PREVIEW_TOKENIZED, PREVIEW_DOC, PARAGRAPH_TITLES, type Token } from './PreviewState';
import { JpWaveBar, JpVoiceAvatar } from '../atoms';
import { PreviewPlayerBar } from './VariantA';
import type { JpTheme } from '@/store/jpStore';

interface VariantCProps {
  theme: JpTheme;
  accent: string;
  source?: 'youtube' | 'pdf' | 'web' | 'notes';
}

const SOURCE_TABS = [
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'pdf',     label: 'PDF',     icon: '◧' },
  { id: 'web',     label: 'Web',     icon: '◑' },
  { id: 'notes',   label: 'Pasted',  icon: '✎' },
] as const;

const PROGRESS = 0.63;

export default function VariantC({ theme: t, accent, source: initialSource = 'pdf' }: VariantCProps) {
  const { tIndex, playing, speed, setPlaying, setSpeed } = usePreview();
  const [source, setSource] = React.useState(initialSource);
  const currentPara = PREVIEW_TOKENIZED[tIndex]?.paragraph ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: t.bg,
        overflow: 'hidden',
        fontFamily: "'Syne', sans-serif",
        position: 'relative',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 52,
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: t.muted,
            fontSize: 16,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ←
        </button>
        <div
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: t.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {PREVIEW_DOC.title}
        </div>
        {/* Source tab strip */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SOURCE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSource(tab.id as typeof source)}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                background: source === tab.id ? `${accent}18` : 'transparent',
                border: `1px solid ${source === tab.id ? accent + '44' : t.border}`,
                color: source === tab.id ? accent : t.muted,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: source === tab.id ? 700 : 400,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            borderRight: `1px solid ${t.border}`,
          }}
          className="jp-scroll"
        >
          <SourceViewer source={source} t={t} accent={accent} currentPara={currentPara} />
        </div>

        {/* Right panel: transcript */}
        <div
          style={{
            width: '45%',
            overflow: 'auto',
          }}
          className="jp-scroll"
        >
          <TranscriptColumn tokens={PREVIEW_TOKENIZED} tIndex={tIndex} t={t} accent={accent} />
        </div>
      </div>

      {/* Player bar */}
      <PreviewPlayerBar
        t={t}
        accent={accent}
        playing={playing}
        speed={speed}
        progress={PROGRESS}
        onTogglePlay={() => setPlaying(!playing)}
        onSpeed={setSpeed}
      />
    </div>
  );
}

// ── SourceViewer ──────────────────────────────────────────────────────────────

function SourceViewer({
  source,
  t,
  accent,
  currentPara,
}: {
  source: string;
  t: JpTheme;
  accent: string;
  currentPara: number;
}) {
  switch (source) {
    case 'youtube': return <YoutubeView t={t} accent={accent} />;
    case 'pdf':     return <PdfView t={t} accent={accent} currentPara={currentPara} />;
    case 'web':     return <WebView t={t} accent={accent} currentPara={currentPara} />;
    case 'notes':   return <NotesView t={t} accent={accent} currentPara={currentPara} />;
    default:        return <PdfView t={t} accent={accent} currentPara={currentPara} />;
  }
}

function YoutubeView({ t, accent }: { t: JpTheme; accent: string }) {
  const subj = { ink: '#0F5132', glyph: '🌿' };
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 16:9 frame */}
      <div
        style={{
          aspectRatio: '16/9',
          background: `linear-gradient(135deg, ${subj.ink}88, ${subj.ink}44)`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: 64, opacity: 0.2 }}>{subj.glyph}</div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#ff0000',
            color: '#fff',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            padding: '3px 8px',
            borderRadius: 4,
            fontWeight: 700,
          }}
        >
          LIVE TRANSCRIPT
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ height: '100%', width: '63%', background: '#ff0000' }} />
        </div>
      </div>
      {/* Chapters */}
      <div>
        <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>
          CHAPTERS
        </div>
        {['00:00 Introduction', '02:15 Light reactions', '06:30 Calvin cycle', '09:45 Carbon cycle', '11:20 Summary'].map((ch, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${t.border}`, fontSize: 12, color: i === 2 ? accent : t.muted, cursor: 'pointer' }}>
            {ch}
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfView({ t, accent, currentPara }: { t: JpTheme; accent: string; currentPara: number }) {
  const paragraphs = PREVIEW_TOKENIZED.reduce((acc: Token[][], tok) => {
    if (!acc[tok.paragraph]) acc[tok.paragraph] = [];
    acc[tok.paragraph].push(tok);
    return acc;
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          background: t.isDark ? '#fff' : '#fff',
          borderRadius: 8,
          padding: 28,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          maxWidth: 500,
        }}
      >
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              color: '#1a1a2e',
              lineHeight: 1.7,
              marginBottom: 16,
              background: currentPara === i ? `${accent}22` : 'transparent',
              borderRadius: 4,
              padding: currentPara === i ? '4px 6px' : '0',
              transition: 'all 0.3s ease',
            }}
          >
            {para.map(tok => tok.word).join(' ')}
          </p>
        ))}
      </div>
      {/* Page nav */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        {['< Prev', 'p. 12 / 24', 'Next >'].map(label => (
          <button
            key={label}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function WebView({ t, accent, currentPara }: { t: JpTheme; accent: string; currentPara: number }) {
  const paragraphs = PREVIEW_TOKENIZED.reduce((acc: Token[][], tok) => {
    if (!acc[tok.paragraph]) acc[tok.paragraph] = [];
    acc[tok.paragraph].push(tok);
    return acc;
  }, []);

  return (
    <div style={{ padding: 16 }}>
      {/* URL bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: t.inset,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 14 }}>🔒</span>
        <span style={{ fontSize: 12, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
          khanacademy.org/science/biology/photosynthesis
        </span>
      </div>
      <div>
        <h1 style={{ fontSize: 18, fontFamily: "'Fraunces', Georgia, serif", color: t.ink, marginBottom: 12 }}>
          Photosynthesis overview
        </h1>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 14,
              color: t.ink2,
              lineHeight: 1.7,
              marginBottom: 14,
              background: currentPara === i ? `${accent}22` : 'transparent',
              borderRadius: 4,
              padding: currentPara === i ? '4px 6px' : '0',
              transition: 'all 0.3s ease',
            }}
          >
            {para.map(tok => tok.word).join(' ')}
          </p>
        ))}
      </div>
    </div>
  );
}

function NotesView({ t, accent, currentPara }: { t: JpTheme; accent: string; currentPara: number }) {
  const paragraphs = PREVIEW_TOKENIZED.reduce((acc: Token[][], tok) => {
    if (!acc[tok.paragraph]) acc[tok.paragraph] = [];
    acc[tok.paragraph].push(tok);
    return acc;
  }, []);

  return (
    <div
      style={{
        padding: 0,
        background: t.isDark ? '#0d1117' : '#f6f8fa',
        minHeight: '100%',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {paragraphs.map((para, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            background: currentPara === i ? `${accent}18` : 'transparent',
            borderLeft: `3px solid ${currentPara === i ? accent : 'transparent'}`,
          }}
        >
          <div
            style={{
              padding: '2px 12px',
              color: t.faded,
              fontSize: 12,
              userSelect: 'none',
              minWidth: 50,
              textAlign: 'right',
              borderRight: `1px solid ${t.border}`,
            }}
          >
            {i + 1}
          </div>
          <div
            style={{
              padding: '2px 12px',
              fontSize: 13,
              color: t.ink2,
              lineHeight: 1.7,
            }}
          >
            {para.map(tok => tok.word).join(' ')}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TranscriptColumn ──────────────────────────────────────────────────────────

function TranscriptColumn({
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
  const byPara: Token[][] = [];
  tokens.forEach(tok => {
    if (!byPara[tok.paragraph]) byPara[tok.paragraph] = [];
    byPara[tok.paragraph].push(tok);
  });

  const timestamps = ['0:00', '1:47', '4:12'];

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          fontSize: 10,
          color: t.muted,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em',
          marginBottom: 16,
          padding: '8px 12px',
          background: t.inset,
          borderRadius: 8,
          border: `1px solid ${t.border}`,
        }}
      >
        TRANSCRIPT · ADAORA
      </div>
      {byPara.map((para, pIdx) => (
        <div key={pIdx} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              color: t.faded,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 6,
            }}
          >
            {timestamps[pIdx] || '–'}
          </div>
          <p
            style={{
              fontSize: 13,
              color: t.ink2,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {para.map(tok => {
              const isCur = tok.index === tIndex;
              const isRead = tok.index < tIndex;
              return (
                <span
                  key={tok.index}
                  style={{
                    background: isCur ? accent : 'transparent',
                    color: isCur ? '#fff' : isRead ? t.muted : t.ink2,
                    borderRadius: 3,
                    padding: isCur ? '1px 3px' : '0',
                  }}
                >
                  {tok.word}{' '}
                </span>
              );
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
