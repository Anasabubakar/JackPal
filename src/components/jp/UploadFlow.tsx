'use client';

import React from 'react';
import { useJp, JP_VOICES, type JpTheme } from '@/store/jpStore';
import { JpVoiceAvatar } from './atoms';

interface UploadFlowProps {
  frame: 'desktop' | 'mobile';
  theme: JpTheme;
  accent: string;
}

const STEP_LABELS: Record<string, string> = {
  extracting: 'Parsing document',
  voice: 'Choose a voice',
  generating: 'Generating audio',
  ready: 'Ready!',
};

const STEP_NUMBERS: Record<string, string> = {
  extracting: 'STEP 1 OF 3',
  voice: 'STEP 2 OF 3',
  generating: 'STEP 3 OF 3',
  ready: 'DONE',
};

export function UploadFlow({ frame, theme: t, accent }: UploadFlowProps) {
  const { upload, pickVoice, closeUpload, openNewDoc } = useJp();
  if (!upload) return null;

  const isBlocking = upload.step === 'extracting' || upload.step === 'generating';
  const isMobile = frame === 'mobile';

  const content = (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: isMobile ? '24px 24px 0 0' : 20,
        padding: 32,
        width: isMobile ? '100%' : 480,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        animation: isMobile ? 'jp-slide-up 0.3s ease both' : 'jp-zoom-in 0.25s ease both',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: accent,
              fontWeight: 600,
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            {STEP_NUMBERS[upload.step]}
          </div>
          <div
            style={{
              fontSize: 18,
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 700,
              color: t.ink,
            }}
          >
            {STEP_LABELS[upload.step]}
          </div>
        </div>
        {!isBlocking && (
          <button
            onClick={closeUpload}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* File name */}
      <div
        style={{
          fontSize: 13,
          color: t.muted,
          fontFamily: "'JetBrains Mono', monospace",
          background: t.inset,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: '8px 14px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        📄 {upload.fileName}
      </div>

      {/* Step content */}
      {upload.step === 'extracting' && (
        <ExtractingStep progress={upload.progress} accent={accent} t={t} />
      )}
      {upload.step === 'voice' && (
        <VoiceStep onPick={pickVoice} accent={accent} t={t} />
      )}
      {upload.step === 'generating' && upload.voice && (
        <GeneratingStep
          voiceId={upload.voice}
          progress={upload.progress}
          accent={accent}
          t={t}
        />
      )}
      {upload.step === 'ready' && upload.voice && (
        <ReadyStep
          voiceId={upload.voice}
          fileName={upload.fileName}
          accent={accent}
          t={t}
          onStart={openNewDoc}
          onLater={closeUpload}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100,
        borderRadius: 'inherit',
      }}
    >
      {content}
    </div>
  );
}

function ExtractingStep({
  progress,
  accent,
  t,
}: {
  progress: number;
  accent: string;
  t: JpTheme;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: `${accent}22`,
          border: `2px solid ${accent}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}
      >
        📄
      </div>
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: t.muted,
            letterSpacing: '0.08em',
          }}
        >
          <span>PARSING TEXT</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
              borderRadius: 3,
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function VoiceStep({
  onPick,
  accent,
  t,
}: {
  onPick: (id: string) => void;
  accent: string;
  t: JpTheme;
}) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      {JP_VOICES.map(v => (
        <button
          key={v.id}
          onClick={() => onPick(v.id)}
          onMouseEnter={() => setHovered(v.id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            background: hovered === v.id ? `${v.color}18` : t.inset,
            border: `1px solid ${hovered === v.id ? v.color : t.border}`,
            borderRadius: 16,
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          <JpVoiceAvatar voiceId={v.id} size={44} ring />
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: t.ink,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {v.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: t.muted,
                fontFamily: "'Syne', sans-serif",
                marginTop: 2,
              }}
            >
              {v.tone}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function GeneratingStep({
  voiceId,
  progress,
  accent,
  t,
}: {
  voiceId: string;
  progress: number;
  accent: string;
  t: JpTheme;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <JpVoiceAvatar voiceId={voiceId} size={72} ring />
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: t.muted,
            letterSpacing: '0.08em',
          }}
        >
          <span>STITCHING AUDIO</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
              borderRadius: 3,
              transition: 'width 0.12s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ReadyStep({
  voiceId,
  fileName,
  accent,
  t,
  onStart,
  onLater,
}: {
  voiceId: string;
  fileName: string;
  accent: string;
  t: JpTheme;
  onStart: () => void;
  onLater: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative' }}>
        <JpVoiceAvatar voiceId={voiceId} size={72} ring />
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#fff',
            border: `2px solid ${t.card}`,
          }}
        >
          ✓
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: t.muted,
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: 'center',
          maxWidth: 280,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {fileName}
      </div>
      <button
        onClick={onStart}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          border: 'none',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          cursor: 'pointer',
          letterSpacing: '0.02em',
        }}
      >
        Start listening →
      </button>
      <button
        onClick={onLater}
        style={{
          width: '100%',
          height: 40,
          borderRadius: 12,
          background: 'transparent',
          border: `1px solid ${t.border}`,
          color: t.muted,
          fontSize: 14,
          fontFamily: "'Syne', sans-serif",
          cursor: 'pointer',
        }}
      >
        Save for later
      </button>
    </div>
  );
}
