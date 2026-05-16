'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  useJp,
  JP_SUBJECTS,
  JP_VOICES,
  fmtTime,
  fmtDuration,
  type JpTheme,
} from '@/store/jpStore';
import { getDocumentText } from '@/lib/api';
import { JpWaveBar, JpVoiceAvatar, JpSubjectChip } from './atoms';

interface ReaderPageProps {
  theme: JpTheme;
  accent: string;
  frame?: 'desktop' | 'mobile';
}

// ── Data ───────────────────────────────────────────────────────────────────────

interface Sentence {
  id: string;
  text: string;
  section: number;
}

const JP_SECTIONS = [
  'Introduction',
  'Light reactions',
  'The Calvin cycle',
  'C4 plants',
  'Ecological implications',
];

const JP_DOC_SENTENCES: Sentence[] = [
  { id: 's01', section: 0, text: 'Photosynthesis is the remarkable process by which plants, algae, and some bacteria capture light energy and convert it into chemical energy stored as glucose.' },
  { id: 's02', section: 0, text: 'This process is fundamental to life on Earth, as it forms the base of almost all food chains and is responsible for the oxygen in our atmosphere.' },
  { id: 's03', section: 0, text: 'Without photosynthesis, the diversity of life we see today would simply not exist.' },
  { id: 's04', section: 1, text: 'The light-dependent reactions take place in the thylakoid membranes of chloroplasts, where chlorophyll absorbs sunlight.' },
  { id: 's05', section: 1, text: 'This absorbed energy is used to split water molecules, releasing oxygen as a by-product and generating ATP and NADPH.' },
  { id: 's06', section: 1, text: 'The electron transport chain within the thylakoid membrane is key to this energy conversion.' },
  { id: 's07', section: 2, text: 'The Calvin cycle takes place in the stroma, where carbon dioxide from the atmosphere is fixed into organic molecules.' },
  { id: 's08', section: 2, text: 'Through a series of enzyme-catalysed reactions, the cycle ultimately produces glucose using the ATP and NADPH from the light reactions.' },
  { id: 's09', section: 2, text: 'The enzyme RuBisCO plays a central role in carbon fixation during this stage.' },
  { id: 's10', section: 3, text: 'C4 plants like maize and sugarcane have evolved a modified photosynthetic pathway that reduces photorespiration in hot, dry conditions.' },
  { id: 's11', section: 3, text: 'They spatially separate the initial CO₂ capture in mesophyll cells from the Calvin cycle in bundle sheath cells.' },
  { id: 's12', section: 4, text: 'Photosynthesis sits at the heart of the global carbon cycle, with plants absorbing and locking away atmospheric CO₂ in biomass.' },
];

interface Note {
  id: string;
  sentenceId: string;
  kind: 'highlight' | 'bookmark' | 'note';
  text?: string;
  color?: string;
}

const JP_NOTES: Note[] = [
  { id: 'n1', sentenceId: 's01', kind: 'highlight', color: '#F5A623' },
  { id: 'n2', sentenceId: 's04', kind: 'bookmark' },
  { id: 'n3', sentenceId: 's07', kind: 'highlight', color: '#1B6EF3' },
  { id: 'n4', sentenceId: 's10', kind: 'note', text: 'Compare with C3 pathway for exam.' },
];

function splitIntoSentences(text: string): Sentence[] {
  const raw = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/);
  return raw
    .filter(s => s.trim().length > 10)
    .slice(0, 60)
    .map((s, i) => ({
      id: `s${String(i + 1).padStart(2, '0')}`,
      text: s.trim(),
      section: Math.floor(i / 3),
    }));
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ReaderPage({ theme: t, accent, frame = 'desktop' }: ReaderPageProps) {
  const { docs, currentDocId } = useJp();
  const doc = docs.find(d => d.id === currentDocId) || docs[0] || null;
  const [activeSection, setActiveSection] = useState(0);
  const [activeSentence, setActiveSentence] = useState('s01');
  const [sentences, setSentences] = useState<Sentence[]>(JP_DOC_SENTENCES);
  const [sections, setSections] = useState<string[]>(JP_SECTIONS);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (!doc?.id) return;
    setDocLoading(true);
    getDocumentText(doc.id)
      .then(text => {
        const parsed = splitIntoSentences(text);
        if (parsed.length > 0) {
          setSentences(parsed);
          // Build sections from sentence groups
          const maxSection = Math.max(...parsed.map(s => s.section));
          setSections(Array.from({ length: maxSection + 1 }, (_, i) => `Section ${i + 1}`));
          setActiveSentence(parsed[0].id);
          setActiveSection(0);
        }
      })
      .catch(() => {
        // Fall back to demo sentences
        setSentences(JP_DOC_SENTENCES);
        setSections(JP_SECTIONS);
      })
      .finally(() => setDocLoading(false));
  }, [doc?.id]);

  if (!doc) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted, fontFamily: "'Syne', sans-serif", fontSize: 14 }}>Upload a PDF to start reading.</div>;
  }

  if (frame === 'mobile') {
    return <MobileReader t={t} accent={accent} doc={doc} activeSentence={activeSentence} onSentence={setActiveSentence} />;
  }

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
      {/* ToC */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          background: t.sidebar,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          padding: '20px 16px',
          gap: 20,
        }}
        className="jp-scroll"
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, fontFamily: "'Fraunces', Georgia, serif", marginBottom: 4 }}>
            {doc.title}
          </div>
          <div style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>{doc.course}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>
            CONTENTS
          </div>
          {sections.map((section, i) => {
            const isActive = activeSection === i;
            return (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: isActive ? `${accent}18` : 'transparent',
                  border: `1px solid ${isActive ? accent + '44' : 'transparent'}`,
                  color: isActive ? accent : t.muted,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  marginBottom: 2,
                }}
              >
                {section}
              </button>
            );
          })}
        </div>
        {/* Voice card */}
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: t.card,
            border: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <JpVoiceAvatar voiceId={doc.voice} size={36} ring />
          <div>
            <div style={{ fontSize: 11, color: t.faded, fontFamily: "'JetBrains Mono', monospace', letterSpacing: '0.06em', marginBottom: 2" }}>READING WITH</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>
              {JP_VOICES.find(v => v.id === doc.voice)?.name}
            </div>
          </div>
        </div>
      </div>

      {/* Reader */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px 40px 100px',
          position: 'relative',
        }}
        className="jp-scroll"
      >
        {docLoading && (
          <div style={{ textAlign: 'center', padding: 40, color: t.muted, fontSize: 13 }}>Loading document…</div>
        )}
        {!docLoading && (
          <ReaderContent
            sentences={sentences}
            notes={JP_NOTES}
            activeSentence={activeSentence}
            onSentence={setActiveSentence}
            activeSection={activeSection}
            t={t}
            accent={accent}
          />
        )}
        {/* Floating mini-player bar */}
        <FloatingPlayerBar t={t} accent={accent} doc={doc} />
      </div>

      {/* Notes inspector */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          background: t.sidebar,
          borderLeft: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 16px 8px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>Notes & Highlights</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }} className="jp-scroll">
          {JP_NOTES.map(note => {
            const sentence = sentences.find(s => s.id === note.sentenceId);
            return (
              <div
                key={note.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  marginBottom: 8,
                }}
              >
                {note.kind === 'highlight' && (
                  <div
                    style={{
                      fontSize: 12,
                      color: t.ink2,
                      lineHeight: 1.5,
                      borderLeft: `3px solid ${note.color || accent}`,
                      paddingLeft: 8,
                    }}
                  >
                    "{sentence?.text.substring(0, 80)}…"
                  </div>
                )}
                {note.kind === 'bookmark' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: accent }}>🔖</span>
                    <span style={{ fontSize: 12, color: t.muted }}>Bookmarked</span>
                  </div>
                )}
                {note.kind === 'note' && note.text && (
                  <div>
                    <div style={{ fontSize: 11, color: '#F5A623', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>NOTE</div>
                    <div style={{ fontSize: 12, color: t.ink2 }}>{note.text}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, display: 'flex', gap: 6 }}>
          <button style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}33`, color: accent, fontSize: 11, cursor: 'pointer' }}>✦ Summarise notes</button>
          <button style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: t.inset, border: `1px solid ${t.border}`, color: t.muted, fontSize: 11, cursor: 'pointer' }}>↓ Export</button>
        </div>
      </div>
    </div>
  );
}

// ── ReaderContent ─────────────────────────────────────────────────────────────

function ReaderContent({
  sentences, notes, activeSentence, onSentence, activeSection, t, accent,
}: {
  sentences: Sentence[];
  notes: Note[];
  activeSentence: string;
  onSentence: (id: string) => void;
  activeSection: number;
  t: JpTheme;
  accent: string;
}) {
  const bySec: Sentence[][] = JP_SECTIONS.map(() => []);
  sentences.forEach(s => bySec[s.section]?.push(s));

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {bySec.map((secs, i) => (
        <div key={i}>
          <div
            style={{
              fontSize: 11,
              color: activeSection === i ? accent : t.faded,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            {JP_SECTIONS[i]}
          </div>
          {secs.map(sentence => {
            const isActive = sentence.id === activeSentence;
            const note = notes.find(n => n.sentenceId === sentence.id);
            return (
              <div
                key={sentence.id}
                onClick={() => onSentence(sentence.id)}
                style={{
                  position: 'relative',
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 4,
                  background: isActive ? `${accent}18` : note?.kind === 'highlight' ? `${note.color}18` : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  borderLeft: isActive ? `3px solid ${accent}` : note?.kind === 'highlight' ? `3px solid ${note.color}` : '3px solid transparent',
                }}
              >
                <p
                  style={{
                    fontSize: 19,
                    fontFamily: "'Fraunces', Georgia, serif",
                    color: isActive ? t.ink : t.ink2,
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {sentence.text}
                </p>
                {note?.kind === 'note' && note.text && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '6px 10px',
                      background: '#F5A62318',
                      border: '1px solid #F5A62333',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#F5A623',
                      fontStyle: 'italic',
                    }}
                  >
                    📝 {note.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── FloatingPlayerBar ─────────────────────────────────────────────────────────

function FloatingPlayerBar({ t, accent, doc }: { t: JpTheme; accent: string; doc: { id: string; voice: string; progressSec: number; durationSec: number } }) {
  const { isPlaying, togglePlay, seek } = useJp();
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 88,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 480,
        height: 56,
        background: t.isDark ? 'rgba(13,22,53,0.9)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${t.border}`,
        borderRadius: 28,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        zIndex: 20,
      }}
    >
      <JpVoiceAvatar voiceId={doc.voice} size={28} />
      <div style={{ flex: 1 }}>
        <JpWaveBar progress={progress} accent={accent} height={28} animated={isPlaying} theme={t} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => seek(-15)} style={{ background: 'none', border: 'none', color: t.muted, fontSize: 16, cursor: 'pointer' }}>«</button>
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
        <button onClick={() => seek(15)} style={{ background: 'none', border: 'none', color: t.muted, fontSize: 16, cursor: 'pointer' }}>»</button>
      </div>
      <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace", minWidth: 70, textAlign: 'right' }}>
        {fmtTime(doc.progressSec)} / {fmtDuration(doc.durationSec)}
      </div>
    </div>
  );
}

// ── MobileReader ──────────────────────────────────────────────────────────────

function MobileReader({
  t, accent, doc, activeSentence, onSentence,
}: {
  t: JpTheme;
  accent: string;
  doc: { id: string; title: string; course: string; voice: string; progressSec: number; durationSec: number };
  activeSentence: string;
  onSentence: (id: string) => void;
}) {
  const { isPlaying, togglePlay, seek } = useJp();
  const progress = doc.durationSec > 0 ? doc.progressSec / doc.durationSec : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <JpSubjectChip subject="Biology" theme={t} />
        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
      </div>
      {/* Text */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 160px' }} className="jp-scroll">
        {JP_DOC_SENTENCES.map(s => {
          const isActive = s.id === activeSentence;
          return (
            <p
              key={s.id}
              onClick={() => onSentence(s.id)}
              style={{
                fontSize: 17,
                fontFamily: "'Fraunces', Georgia, serif",
                color: isActive ? t.ink : t.ink2,
                lineHeight: 1.75,
                marginBottom: 8,
                padding: '4px 8px',
                borderRadius: 6,
                background: isActive ? `${accent}18` : 'transparent',
                borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                cursor: 'pointer',
              }}
            >
              {s.text}
            </p>
          );
        })}
      </div>
      {/* Sticky player */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: t.sidebar,
          borderTop: `1px solid ${t.border}`,
          padding: '12px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <JpWaveBar progress={progress} accent={accent} height={32} animated={isPlaying} theme={t} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <JpVoiceAvatar voiceId={doc.voice} size={28} />
            <span style={{ fontSize: 12, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtTime(doc.progressSec)} / {fmtDuration(doc.durationSec)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => seek(-15)} style={{ background: 'none', border: 'none', color: t.muted, fontSize: 18, cursor: 'pointer' }}>«</button>
            <button
              onClick={togglePlay}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: accent,
                border: 'none',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={() => seek(15)} style={{ background: 'none', border: 'none', color: t.muted, fontSize: 18, cursor: 'pointer' }}>»</button>
            <button style={{ background: 'none', border: 'none', color: t.muted, fontSize: 16, cursor: 'pointer' }}>🔖</button>
          </div>
        </div>
      </div>
    </div>
  );
}
