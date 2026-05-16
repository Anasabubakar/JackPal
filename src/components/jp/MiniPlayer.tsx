'use client';

import React from 'react';
import {
  useJp,
  JP_SUBJECTS,
  JP_VOICES,
  fmtTime,
  fmtDuration,
  type JpTheme,
} from '@/store/jpStore';
import { JpVoiceAvatar } from './atoms';

interface MiniPlayerProps {
  t: JpTheme;
  accent: string;
  radius: number;
}

export function MiniPlayer({ t, accent, radius }: MiniPlayerProps) {
  const { docs, currentDocId, isPlaying, togglePlay, seek, setRoute, showToast } = useJp();
  const doc = docs.find(d => d.id === currentDocId) || docs[0];

  if (!doc) return null;

  const subj = JP_SUBJECTS[doc.subject] || JP_SUBJECTS['Biology'];
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div
      style={{
        height: 76,
        background: t.sidebar,
        borderTop: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Progress strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 2,
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
          transition: 'width 1s linear',
        }}
      />

      {/* Left: thumbnail + info */}
      <div
        onClick={() => setRoute({ desktop: 'player' })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 20px',
          flex: 1,
          minWidth: 0,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${subj.ink}55, ${subj.ink}22)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {subj.glyph}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: t.ink,
              fontFamily: "'Syne', sans-serif",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doc.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: t.muted,
              fontFamily: "'JetBrains Mono', monospace",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {JP_VOICES.find(v => v.id === doc.voice)?.name} · {doc.course}
          </div>
        </div>
      </div>

      {/* Center controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => seek(-15)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: t.muted,
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          «
        </button>
        <button
          onClick={togglePlay}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            border: 'none',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${accent}55`,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={() => seek(15)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: t.muted,
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          »
        </button>
        <span
          style={{
            fontSize: 11,
            color: t.muted,
            fontFamily: "'JetBrains Mono', monospace",
            minWidth: 80,
            textAlign: 'center',
          }}
        >
          {fmtTime(doc.progressSec)} / {fmtDuration(doc.durationSec)}
        </span>
      </div>

      {/* Right controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
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
        >
          1.0×
        </button>
        <JpVoiceAvatar voiceId={doc.voice} size={28} />
        <button
          style={{
            width: 32,
            height: 32,
            background: 'transparent',
            border: 'none',
            color: t.muted,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          ♪
        </button>
        <button
          onClick={() => showToast('DRM: File export is disabled on this plan.', 'warn')}
          style={{
            width: 32,
            height: 32,
            background: 'transparent',
            border: 'none',
            color: t.muted,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          ↓
        </button>
      </div>
    </div>
  );
}
