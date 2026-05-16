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
import { JpWaveBar, JpBarsWave, JpVoiceAvatar, JpSubjectChip } from './atoms';

interface MobileProps {
  theme: JpTheme;
  accent: string;
  radius: number;
}

type MobileTab = 'library' | 'listen' | 'upload' | 'study' | 'me';

export function Mobile({ theme: t, accent, radius }: MobileProps) {
  const { route, setRoute, startUpload, docs, currentDocId, isPlaying } = useJp();
  const [tab, setTab] = useState<MobileTab>('library');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTabChange = (newTab: MobileTab) => {
    if (newTab === 'upload') {
      fileInputRef.current?.click();
      return;
    }
    setTab(newTab);
    if (newTab === 'library') setRoute({ mobile: 'library' });
    if (newTab === 'listen') setRoute({ mobile: 'player' });
  };

  const currentDoc = docs.find(d => d.id === currentDocId) || docs[0];

  return (
    <div
      style={{
        width: 402,
        height: 874,
        background: t.bg,
        borderRadius: 40,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        border: `1px solid ${t.border}`,
        flexShrink: 0,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) startUpload(file, 'mobile');
          e.target.value = '';
        }}
      />
      {route.mobile === 'library' && (
        <MobileLibrary t={t} accent={accent} radius={radius} />
      )}
      {route.mobile === 'player' && (
        <MobilePlayer t={t} accent={accent} radius={radius} />
      )}

      {/* Mini player */}
      {route.mobile === 'library' && isPlaying && (
        <MobileMiniPlayer t={t} accent={accent} />
      )}

      {/* Toast */}
      <MobileToast t={t} accent={accent} />

      {/* Tab bar */}
      <MobileTabBar
        tab={tab}
        onChange={handleTabChange}
        t={t}
        accent={accent}
        isPlaying={isPlaying}
      />
    </div>
  );
}

// ── MobileLibrary ─────────────────────────────────────────────────────────────

function MobileLibrary({ t, accent, radius }: { t: JpTheme; accent: string; radius: number }) {
  const { docs } = useJp();
  const [filter, setFilter] = useState<string>('All');

  const filtered = docs.filter(d => {
    if (filter === 'All') return true;
    if (filter === 'In progress') return d.progressSec > 0 && d.progressSec < d.durationSec;
    if (filter === 'Finished') return d.progressSec >= d.durationSec;
    return d.progressSec === 0;
  });

  return (
    <div
      style={{ flex: 1, overflow: 'auto', paddingBottom: 160 }}
      className="jp-scroll"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, #F5A623)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'Fraunces', Georgia, serif",
            }}
          >
            J
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: t.ink,
              fontFamily: "'Fraunces', Georgia, serif",
            }}
          >
            JackPals
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: t.card,
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            ⌕
          </button>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent}, #F5A623)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            T
          </div>
        </div>
      </div>

      {/* Continue hero */}
      <div style={{ padding: '0 16px 16px' }}>
        <MobileContinueHero t={t} accent={accent} radius={radius} />
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 12px',
          overflowX: 'auto',
        }}
        className="jp-scroll"
      >
        {['All', 'In progress', 'Finished', 'Not started'].map(f => (
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(doc => (
          <MobileDocCard key={doc.id} doc={doc} t={t} accent={accent} radius={radius} />
        ))}
      </div>
    </div>
  );
}

// ── MobileContinueHero ────────────────────────────────────────────────────────

function MobileContinueHero({ t, accent, radius }: { t: JpTheme; accent: string; radius: number }) {
  const { docs, currentDocId, isPlaying, togglePlay, playDoc } = useJp();
  const doc = docs.find(d => d.id === currentDocId) || docs[0];
  const subj = JP_SUBJECTS[doc.subject] || JP_SUBJECTS['Biology'];
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${subj.ink}88, ${subj.ink}44)`,
        border: `1px solid ${subj.ink}55`,
        borderRadius: radius * 0.8,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: -20,
          transform: 'translateY(-50%)',
          fontSize: 100,
          opacity: 0.12,
          userSelect: 'none',
        }}
      >
        {subj.glyph}
      </div>
      <div
        style={{
          fontSize: 9,
          color: accent,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          letterSpacing: '0.12em',
          background: `${accent}22`,
          padding: '3px 10px',
          borderRadius: 100,
          width: 'fit-content',
        }}
      >
        LISTENING
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: '#fff',
          fontFamily: "'Fraunces', Georgia, serif",
          lineHeight: 1.25,
        }}
      >
        {doc.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <JpVoiceAvatar voiceId={doc.voice} size={28} ring />
        <div style={{ flex: 1 }}>
          <JpWaveBar progress={progress} accent={accent} height={28} animated={isPlaying} theme={t} />
        </div>
        <button
          onClick={() => (isPlaying ? togglePlay() : playDoc(doc.id, 'mobile'))}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: accent,
            border: 'none',
            color: '#fff',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}

// ── MobileDocCard ─────────────────────────────────────────────────────────────

function MobileDocCard({
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
  const subj = JP_SUBJECTS[doc.subject] || JP_SUBJECTS['Biology'];

  return (
    <div
      onClick={() => playDoc(doc.id, 'mobile')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: radius * 0.6,
        padding: 12,
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${subj.ink}55, ${subj.ink}22)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
        }}
      >
        {subj.glyph}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 4 }}>
          <JpSubjectChip subject={doc.subject} theme={t} />
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: t.ink,
            fontFamily: "'Fraunces', Georgia, serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
        >
          {doc.title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
          }}
        >
          <JpVoiceAvatar voiceId={doc.voice} size={16} />
          <span
            style={{
              fontSize: 11,
              color: t.muted,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {fmtDuration(doc.durationSec)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── MobilePlayer ──────────────────────────────────────────────────────────────

function MobilePlayer({ t, accent, radius }: { t: JpTheme; accent: string; radius: number }) {
  const { docs, currentDocId, isPlaying, togglePlay, seek, setRoute } = useJp();
  const doc = docs.find(d => d.id === currentDocId) || docs[0];
  const subj = JP_SUBJECTS[doc.subject] || JP_SUBJECTS['Biology'];
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        gap: 20,
        paddingBottom: 100,
        overflow: 'auto',
      }}
      className="jp-scroll"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => setRoute({ mobile: 'library' })}
          style={{
            background: 'transparent',
            border: 'none',
            color: t.muted,
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <div
          style={{
            fontSize: 10,
            color: t.muted,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em',
          }}
        >
          NOW PLAYING
        </div>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: t.muted,
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          ⋮
        </button>
      </div>

      {/* Cover art */}
      <div
        style={{
          aspectRatio: '1',
          borderRadius: 24,
          background: `linear-gradient(135deg, ${subj.ink}88, ${subj.ink}33)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: 80, opacity: 0.25 }}>{subj.glyph}</div>
        <div style={{ position: 'absolute', bottom: 16 }}>
          <JpBarsWave accent={accent} playing={isPlaying} theme={t} count={7} />
        </div>
      </div>

      {/* Title + voice */}
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: t.ink,
            fontFamily: "'Fraunces', Georgia, serif",
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          {doc.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <JpVoiceAvatar voiceId={doc.voice} size={24} ring />
          <span style={{ fontSize: 13, color: t.muted, fontFamily: "'Syne', sans-serif" }}>
            {JP_VOICES.find(v => v.id === doc.voice)?.name} · {doc.course}
          </span>
        </div>
      </div>

      {/* Wave bar */}
      <div>
        <JpWaveBar progress={progress} accent={accent} height={44} animated={isPlaying} theme={t} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
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
          gap: 20,
        }}
      >
        <button
          onClick={() => seek(-15)}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: t.inset,
            border: `1px solid ${t.border}`,
            color: t.ink,
            fontSize: 20,
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
            fontSize: 28,
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
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          »
        </button>
      </div>
    </div>
  );
}

// ── MobileMiniPlayer ──────────────────────────────────────────────────────────

function MobileMiniPlayer({ t, accent }: { t: JpTheme; accent: string }) {
  const { docs, currentDocId, isPlaying, togglePlay, setRoute } = useJp();
  const doc = docs.find(d => d.id === currentDocId) || docs[0];
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 96,
        left: 16,
        right: 16,
        height: 60,
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 10,
        zIndex: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
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
          background: accent,
          borderRadius: '2px 0 0 0',
        }}
      />
      <JpVoiceAvatar voiceId={doc.voice} size={36} />
      <div
        onClick={() => setRoute({ mobile: 'player' })}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <div
          style={{
            fontSize: 12,
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
            fontSize: 10,
            color: t.muted,
            fontFamily: "'JetBrains Mono', monospace',",
          }}
        >
          {JP_VOICES.find(v => v.id === doc.voice)?.name}
        </div>
      </div>
      <button
        onClick={togglePlay}
        style={{
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
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  );
}

// ── MobileTabBar ──────────────────────────────────────────────────────────────

const TAB_ITEMS = [
  { id: 'library', label: 'Library', icon: '◫' },
  { id: 'listen',  label: 'Listen',  icon: '◐' },
  { id: 'upload',  label: '',        icon: '+' },
  { id: 'study',   label: 'Study',   icon: '◇' },
  { id: 'me',      label: 'Me',      icon: '◯' },
] as const;

function MobileTabBar({
  tab,
  onChange,
  t,
  accent,
  isPlaying,
}: {
  tab: MobileTab;
  onChange: (t: MobileTab) => void;
  t: JpTheme;
  accent: string;
  isPlaying: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 84,
        background: t.sidebar,
        borderTop: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 16,
        zIndex: 30,
      }}
    >
      {TAB_ITEMS.map(item => {
        const isActive = tab === item.id;
        const isUpload = item.id === 'upload';
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id as MobileTab)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: isUpload
                ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
                : 'transparent',
              border: 'none',
              color: isUpload ? '#fff' : isActive ? accent : t.muted,
              cursor: 'pointer',
              width: isUpload ? 48 : 52,
              height: isUpload ? 48 : undefined,
              borderRadius: isUpload ? '50%' : undefined,
              fontSize: isUpload ? 24 : 20,
              boxShadow: isUpload ? `0 4px 12px ${accent}55` : 'none',
              justifyContent: isUpload ? 'center' : undefined,
              marginTop: isUpload ? -10 : 0,
            }}
          >
            <span>{item.icon}</span>
            {!isUpload && (
              <span style={{ fontSize: 9, fontFamily: "'Syne', sans-serif" }}>{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── MobileToast ───────────────────────────────────────────────────────────────

function MobileToast({ t, accent }: { t: JpTheme; accent: string }) {
  const { toast } = useJp();
  if (!toast) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 180,
        left: 16,
        right: 16,
        background: toast.kind === 'warn' ? '#F5A623' : t.card,
        border: `1px solid ${toast.kind === 'warn' ? '#F5A623' : t.border}`,
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 50,
        animation: 'jp-slide-up 0.3s ease both',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <span style={{ fontSize: 16 }}>{toast.kind === 'warn' ? '⚠' : '✓'}</span>
      <span
        style={{
          fontSize: 12,
          color: toast.kind === 'warn' ? '#1a0a00' : t.ink,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 500,
        }}
      >
        {toast.msg}
      </span>
    </div>
  );
}
