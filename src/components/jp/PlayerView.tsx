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
import { JpWaveBar, JpVoiceAvatar, JpSubjectChip } from './atoms';

interface PlayerViewProps {
  t: JpTheme;
  accent: string;
  radius: number;
}

const SECTIONS = [
  { title: 'Introduction to Photosynthesis', duration: '4:20' },
  { title: 'Light-dependent Reactions', duration: '7:45' },
  { title: 'The Calvin Cycle', duration: '8:10' },
  { title: 'Carbon Fixation & The Carbon Cycle', duration: '6:55' },
  { title: 'Ecological Implications', duration: '5:30' },
];

export function PlayerView({ t, accent, radius }: PlayerViewProps) {
  const { docs, currentDocId, isPlaying, togglePlay, seek, showToast } = useJp();
  const doc = docs.find(d => d.id === currentDocId) || docs[0];

  if (!doc) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted, fontFamily: "'Syne', sans-serif", fontSize: 14 }}>
        No document loaded — upload a PDF to get started.
      </div>
    );
  }

  const subj = JP_SUBJECTS[doc.subject] || JP_SUBJECTS['Biology'];
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  // Determine current section
  const sectionIdx = Math.min(
    Math.floor(progress * SECTIONS.length),
    SECTIONS.length - 1,
  );

  return (
    <div className="jp-player-layout">
      <div
        className="jp-player-hero jp-scroll"
        style={{
          background: `linear-gradient(160deg, ${subj.ink}55 0%, ${t.bg} 70%)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          borderRight: `1px solid ${t.border}`,
        }}
      >
        <JpSubjectChip subject={doc.subject} theme={t} />

        <div
          style={{
            fontSize: 11,
            color: t.muted,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.06em',
          }}
        >
          {doc.course}
        </div>

        <div
          className="jp-player-title"
          style={{
            fontSize: 44,
            fontWeight: 900,
            color: t.ink,
            fontFamily: "'Fraunces', Georgia, serif",
            lineHeight: 1.15,
          }}
        >
          {doc.title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <JpVoiceAvatar voiceId={doc.voice} size={36} ring />
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: t.ink,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {JP_VOICES.find(v => v.id === doc.voice)?.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: t.muted,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {JP_VOICES.find(v => v.id === doc.voice)?.tone}
            </div>
          </div>
        </div>

        {/* Wave scrubber */}
        <div>
          <JpWaveBar progress={progress} accent={accent} height={56} animated={isPlaying} theme={t} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: t.muted,
            }}
          >
            <span>{fmtTime(doc.progressSec)}</span>
            <span>{fmtDuration(doc.durationSec)}</span>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <button
            style={{
              fontSize: 12,
              color: t.muted,
              background: t.inset,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: '6px 12px',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}
          >
            1.0×
          </button>
          <button
            onClick={() => seek(-15)}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.ink,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            «
          </button>
          <button
            onClick={togglePlay}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              border: 'none',
              color: '#fff',
              fontSize: 26,
              cursor: 'pointer',
              boxShadow: `0 8px 24px ${accent}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => seek(15)}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.ink,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            »
          </button>
          <button
            onClick={() => showToast('DRM: File export is disabled on this plan.', 'warn')}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            ↓
          </button>
        </div>

        {/* AI study tools */}
        <div
          style={{
            background: t.card2,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: t.muted,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}
          >
            AI STUDY TOOLS
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Summarize', 'Generate quiz', 'Export notes'].map(tool => (
              <button
                key={tool}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: `${accent}18`,
                  border: `1px solid ${accent}33`,
                  color: accent,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Syne', sans-serif",
                  cursor: 'pointer',
                }}
              >
                ✦ {tool}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section list */}
      <div
        className="jp-player-sidebar-panel jp-scroll"
        style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: t.muted,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}
        >
          SECTIONS · {SECTIONS.length} CHAPTERS
        </div>
        {SECTIONS.map((s, i) => {
          const isDone = i < sectionIdx;
          const isCurrentSection = i === sectionIdx;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: isCurrentSection ? `${accent}18` : 'transparent',
                border: `1px solid ${isCurrentSection ? accent + '44' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isDone
                    ? '#10B981'
                    : isCurrentSection
                    ? accent
                    : t.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: isDone || isCurrentSection ? '#fff' : t.faded,
                  flexShrink: 0,
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isCurrentSection ? 700 : 400,
                    color: isCurrentSection ? t.ink : isDone ? t.muted : t.ink2,
                    fontFamily: "'Syne', sans-serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: t.faded,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 2,
                  }}
                >
                  {s.duration}
                </div>
              </div>
              {isCurrentSection && (
                <div
                  style={{
                    fontSize: 9,
                    color: accent,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.06em',
                  }}
                >
                  NOW
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
