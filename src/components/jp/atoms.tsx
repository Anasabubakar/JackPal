'use client';

import React from 'react';
import { JP_VOICES, JP_SUBJECTS, type JpTheme } from '@/store/jpStore';

// ── JpWaveBar ─────────────────────────────────────────────────────────────────

interface JpWaveBarProps {
  progress: number; // 0–1
  accent: string;
  height?: number;
  animated?: boolean;
  theme: JpTheme;
}

const WAVE_PATH =
  'M2 20 C8 20 10 13 16 20 S26 27 32 20 S42 13 48 20 S58 27 64 20 S74 13 80 20 S90 27 96 20 S106 13 112 20 S122 27 128 20 S138 13 144 20 S154 27 160 20 S170 13 176 20 S186 27 192 20 S202 13 208 20 S218 27 224 20 L518 20';
const WAVE_WIDTH = 520;

export function JpWaveBar({ progress, accent, height = 40, animated, theme }: JpWaveBarProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const fillX = safeProgress * WAVE_WIDTH;
  const gradId = `wave-grad-${accent.replace('#', '')}`;
  const clipId = `wave-clip-${accent.replace('#', '')}`;
  const thumbId = `wave-thumb-${accent.replace('#', '')}`;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${WAVE_WIDTH} 40`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent} stopOpacity="1" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.6" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={fillX} height="40" />
          </clipPath>
          <clipPath id={`${clipId}-rest`}>
            <rect x={fillX} y="0" width={WAVE_WIDTH - fillX} height="40" />
          </clipPath>
        </defs>
        {/* Track (unplayed) */}
        <path
          d={WAVE_PATH}
          fill="none"
          stroke={theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
          strokeWidth="2.5"
          strokeLinecap="round"
          clipPath={`url(#${clipId}-rest)`}
        />
        {/* Played portion */}
        <path
          d={WAVE_PATH}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
        />
        {/* Thumb dot */}
        {safeProgress > 0 && safeProgress < 1 && (
          <circle
            id={thumbId}
            cx={fillX}
            cy="20"
            r="5"
            fill={accent}
            style={
              animated
                ? { animation: 'jp-thumb-pulse 1.5s ease-in-out infinite' }
                : undefined
            }
          />
        )}
      </svg>
    </div>
  );
}

// ── JpBarsWave ────────────────────────────────────────────────────────────────

interface JpBarsWaveProps {
  accent: string;
  playing?: boolean;
  theme: JpTheme;
  count?: number;
}

export function JpBarsWave({ accent, playing = false, count = 5 }: JpBarsWaveProps) {
  const bars = Array.from({ length: count }, (_, i) => i);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        height: 24,
      }}
    >
      {bars.map(i => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: accent,
            height: playing ? '100%' : '40%',
            transformOrigin: 'bottom',
            animation: playing
              ? `jp-bar-pulse ${0.5 + i * 0.12}s ease-in-out infinite alternate`
              : 'none',
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// ── JpVoiceAvatar ─────────────────────────────────────────────────────────────

interface JpVoiceAvatarProps {
  voiceId: string;
  size?: number;
  ring?: boolean;
}

export function JpVoiceAvatar({ voiceId, size = 32, ring = false }: JpVoiceAvatarProps) {
  const voice = JP_VOICES.find(v => v.id === voiceId) || JP_VOICES[0];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${voice.color}ee, ${voice.color}88)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        fontFamily: "'Syne', sans-serif",
        boxShadow: ring ? `0 0 0 2px ${voice.color}55` : 'none',
      }}
    >
      {voice.name[0]}
    </div>
  );
}

// ── JpSubjectChip ─────────────────────────────────────────────────────────────

interface JpSubjectChipProps {
  subject: string;
  theme: JpTheme;
}

export function JpSubjectChip({ subject, theme }: JpSubjectChipProps) {
  const subj = JP_SUBJECTS[subject] || { ink: '#0F5132', tint: '#D6F0DC', glyph: '●' };
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 100,
        background: theme.isDark ? `${subj.ink}33` : subj.tint,
        border: `1px solid ${theme.isDark ? `${subj.ink}66` : `${subj.ink}33`}`,
        fontSize: 11,
        fontWeight: 600,
        color: theme.isDark ? subj.tint : subj.ink,
        fontFamily: "'Syne', sans-serif",
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 10 }}>{subj.glyph}</span>
      {subject}
    </div>
  );
}
