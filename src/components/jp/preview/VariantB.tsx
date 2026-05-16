'use client';

import React, { useMemo } from 'react';
import { usePreview, PREVIEW_TOKENIZED, PREVIEW_DOC, type Token } from './PreviewState';
import { JpWaveBar, JpVoiceAvatar } from '../atoms';
import type { JpTheme } from '@/store/jpStore';
import { JP_SUBJECTS } from '@/store/jpStore';

interface VariantBProps {
  theme: JpTheme;
  accent: string;
}

// Build lines: chunks of 7-14 words, respecting sentence endings
function buildLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [];
  let current: Token[] = [];

  tokens.forEach(tok => {
    current.push(tok);
    const word = tok.word;
    const isSentenceEnd = /[.!?]$/.test(word);
    const isLong = current.length >= 12;
    const isShort = current.length >= 7 && isSentenceEnd;

    if (isLong || isShort) {
      lines.push([...current]);
      current = [];
    }
  });
  if (current.length > 0) lines.push(current);
  return lines;
}

const LINES = buildLines(PREVIEW_TOKENIZED);
const subj = JP_SUBJECTS['Biology'];
const PROGRESS = 0.63;

export default function VariantB({ theme: t, accent }: VariantBProps) {
  const { tIndex, playing, speed, setPlaying, setSpeed } = usePreview();

  // Find current line
  const currentLineIdx = useMemo(() => {
    for (let i = 0; i < LINES.length; i++) {
      const line = LINES[i];
      if (line.some(tok => tok.index >= tIndex)) {
        return i;
      }
    }
    return LINES.length - 1;
  }, [tIndex]);

  const prevLine = LINES[currentLineIdx - 1] || null;
  const currentLine = LINES[currentLineIdx] || [];
  const nextLine = LINES[currentLineIdx + 1] || null;

  const bgColor = subj.ink;

  return (
    <div
      style={{
        height: '100%',
        background: `linear-gradient(160deg, ${bgColor}ee 0%, ${bgColor}99 50%, ${bgColor}cc 100%)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}33, transparent 70%)`,
          animation: 'jp-orb-drift-1 8s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '8%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffffff18, transparent 70%)`,
          animation: 'jp-orb-drift-2 10s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 24px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <button
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.8)',
            padding: '6px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <div
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {PREVIEW_DOC.title}
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 100,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          📄 PDF
        </div>
      </div>

      {/* Center lyrics display */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 40px',
          gap: 16,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Previous line */}
        {prevLine && (
          <div
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Fraunces', Georgia, serif",
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {prevLine.map(t => t.word).join(' ')}
          </div>
        )}

        {/* Current line */}
        <div
          style={{
            fontSize: 58,
            fontFamily: "'Fraunces', Georgia, serif",
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          <SpotlightWords tokens={currentLine} tIndex={tIndex} accent={accent} />
        </div>

        {/* Next line */}
        {nextLine && (
          <div
            style={{
              fontSize: 30,
              color: 'rgba(255,255,255,0.16)',
              fontFamily: "'Fraunces', Georgia, serif",
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {nextLine.map(t => t.word).join(' ')}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          padding: '0 24px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Voice info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
          <JpVoiceAvatar voiceId={PREVIEW_DOC.voice} size={36} ring />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
              Adaora
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
              {PREVIEW_DOC.course}
            </div>
          </div>
        </div>

        {/* Wave + play */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <JpWaveBar progress={PROGRESS} accent={accent} height={40} animated={playing} theme={{ isDark: true } as JpTheme} />
          </div>
          <button
            onClick={() => setPlaying(!playing)}
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: '#ffffff',
              border: 'none',
              color: bgColor,
              fontSize: 30,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {playing ? '⏸' : '▶'}
          </button>
        </div>

        {/* Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 80, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SpotlightWords ────────────────────────────────────────────────────────────

function SpotlightWords({
  tokens,
  tIndex,
  accent,
}: {
  tokens: Token[];
  tIndex: number;
  accent: string;
}) {
  return (
    <>
      {tokens.map(tok => {
        const isCur = tok.index === tIndex;
        const isRead = tok.index < tIndex;
        return (
          <span
            key={tok.index}
            style={{
              color: isCur
                ? accent
                : isRead
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(255,255,255,0.9)',
              transition: 'color 0.2s ease',
              fontWeight: isCur ? 800 : 700,
            }}
          >
            {tok.word}{' '}
          </span>
        );
      })}
    </>
  );
}
