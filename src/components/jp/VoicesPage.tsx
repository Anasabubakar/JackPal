'use client';

import React, { useState } from 'react';
import { JP_VOICES, type JpTheme } from '@/store/jpStore';
import { JpVoiceAvatar, JpWaveBar } from './atoms';

interface VoicesPageProps {
  theme: JpTheme;
  accent: string;
  frame?: 'desktop' | 'mobile';
}

const JP_VOICE_DETAILS = [
  {
    id: 'adaora',
    name: 'Adaora',
    region: 'Lagos · Southwest',
    description: 'Adaora speaks with the warm, melodic cadence of Lagos — clear, nurturing, and perfectly suited for long-form academic listening. Her intonation reduces cognitive load and makes complex material feel approachable.',
    sample: 'Photosynthesis is the remarkable process by which plants capture light energy…',
    specs: { sampleRate: '24 kHz', codec: 'AAC-LC', latency: '~180 ms' },
    bestFor: ['Science', 'Biology', 'Long lectures', 'Revision'],
    minutes: 847,
  },
  {
    id: 'zainab',
    name: 'Zainab',
    region: 'Kano · Northwest',
    description: 'Zainab brings the precise, authoritative clarity of Northern Nigerian speech patterns. Ideal for law, technical content, and anything requiring careful articulation of terminology.',
    sample: 'Every citizen shall have the right to freedom of thought, conscience and religion…',
    specs: { sampleRate: '24 kHz', codec: 'AAC-LC', latency: '~160 ms' },
    bestFor: ['Law', 'Policy', 'Technical docs', 'Complex terminology'],
    minutes: 512,
  },
  {
    id: 'nonso',
    name: 'Nonso',
    region: 'Enugu · Southeast',
    description: 'Nonso\'s energetic delivery mirrors the dynamism of the Igbo entrepreneurial spirit. Great for economics, business, and any content that benefits from an upbeat, engaging narration style.',
    sample: 'When price elasticity of demand is greater than one, we say demand is elastic…',
    specs: { sampleRate: '24 kHz', codec: 'AAC-LC', latency: '~170 ms' },
    bestFor: ['Economics', 'Business', 'Commerce', 'Finance'],
    minutes: 723,
  },
  {
    id: 'jude',
    name: 'Jude',
    region: 'Port Harcourt · South-South',
    description: 'Jude\'s deep, measured tones lend authority to chemistry, engineering and the physical sciences. His pacing is deliberate, allowing students to absorb dense technical information.',
    sample: 'Enantiomers are non-superimposable mirror images of each other, exhibiting chirality…',
    specs: { sampleRate: '24 kHz', codec: 'AAC-LC', latency: '~190 ms' },
    bestFor: ['Chemistry', 'Engineering', 'Physics', 'Mathematics'],
    minutes: 391,
  },
];

export function VoicesPage({ theme: t, accent, frame = 'desktop' }: VoicesPageProps) {
  const [selectedId, setSelectedId] = useState('adaora');
  const selected = JP_VOICE_DETAILS.find(v => v.id === selectedId)!;
  const selectedColor = JP_VOICES.find(v => v.id === selectedId)?.color || accent;

  if (frame === 'mobile') {
    return <MobileVoicesPage t={t} accent={accent} selectedId={selectedId} onSelect={setSelectedId} selected={selected} selectedColor={selectedColor} />;
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
      {/* Left: Voice list */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: t.sidebar,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
        className="jp-scroll"
      >
        <div style={{ padding: '20px 20px 12px' }}>
          <div style={{ fontSize: 11, color: t.faded, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 16 }}>
            AVAILABLE VOICES
          </div>
          {JP_VOICE_DETAILS.map(vd => {
            const voice = JP_VOICES.find(v => v.id === vd.id)!;
            const isSelected = vd.id === selectedId;
            return (
              <div
                key={vd.id}
                onClick={() => setSelectedId(vd.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: isSelected ? `${voice.color}18` : 'transparent',
                  border: `1px solid ${isSelected ? voice.color + '44' : 'transparent'}`,
                  cursor: 'pointer',
                  marginBottom: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <JpVoiceAvatar voiceId={vd.id} size={40} ring={isSelected} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? voice.color : t.ink }}>
                    {vd.name}
                  </div>
                  <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
                    {vd.region}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace" }}>
                  {vd.minutes}m
                </div>
              </div>
            );
          })}
        </div>

        {/* Clone CTA */}
        <div style={{ padding: '20px', marginTop: 'auto', borderTop: `1px solid ${t.border}` }}>
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${accent}22, ${accent}0a)`,
              border: `1px solid ${accent}33`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: t.ink, marginBottom: 4 }}>Clone your voice</div>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>Record 3 minutes and get your own AI voice narrator.</div>
            <button
              style={{
                width: '100%',
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Clone voice
            </button>
          </div>
        </div>
      </div>

      {/* Right: Detail */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }} className="jp-scroll">
        <VoiceDetail vd={selected} color={selectedColor} t={t} accent={accent} />
      </div>
    </div>
  );
}

function VoiceDetail({
  vd,
  color,
  t,
  accent,
}: {
  vd: typeof JP_VOICE_DETAILS[0];
  color: string;
  t: JpTheme;
  accent: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 680 }}>
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `1px solid ${color}44`,
          borderRadius: 20,
          padding: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <JpVoiceAvatar voiceId={vd.id} size={80} ring />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: t.ink, fontFamily: "'Fraunces', Georgia, serif" }}>
            {vd.name}
          </div>
          <div style={{ fontSize: 13, color: t.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
            {vd.region}
          </div>
          <div style={{ fontSize: 13, color: t.ink2, marginTop: 10, lineHeight: 1.6 }}>
            {vd.description}
          </div>
        </div>
        <button
          onClick={() => setPlaying(!playing)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>
      </div>

      {/* Sample bar */}
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 10 }}>
          SAMPLE
        </div>
        <div style={{ fontSize: 14, color: t.ink2, fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.6, marginBottom: 14 }}>
          "{vd.sample}"
        </div>
        <JpWaveBar progress={playing ? 0.45 : 0} accent={color} height={36} animated={playing} theme={t} />
      </div>

      {/* Specs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
        }}
      >
        {Object.entries(vd.specs).map(([key, val]) => (
          <div
            key={key}
            style={{
              padding: 16,
              borderRadius: 12,
              background: t.card,
              border: `1px solid ${t.border}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: t.ink, fontFamily: "'JetBrains Mono', monospace" }}>
              {val}
            </div>
            <div style={{ fontSize: 10, color: t.muted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
              {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Best for */}
      <div>
        <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 10 }}>
          BEST FOR
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {vd.bestFor.map(tag => (
            <div
              key={tag}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                background: `${color}18`,
                border: `1px solid ${color}33`,
                color,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>

      {/* Stats + actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            background: t.card,
            border: `1px solid ${t.border}`,
            textAlign: 'center',
            flex: 1,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color: t.ink, fontFamily: "'JetBrains Mono', monospace" }}>
            {vd.minutes}
          </div>
          <div style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>MINS LISTENED</div>
        </div>
        <button
          style={{
            flex: 2,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Use {vd.name} by default
        </button>
      </div>
    </div>
  );
}

// ── Mobile variant ────────────────────────────────────────────────────────────

function MobileVoicesPage({
  t, accent, selectedId, onSelect, selected, selectedColor,
}: {
  t: JpTheme;
  accent: string;
  selectedId: string;
  onSelect: (id: string) => void;
  selected: typeof JP_VOICE_DETAILS[0];
  selectedColor: string;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, overflow: 'auto', fontFamily: "'Syne', sans-serif" }} className="jp-scroll">
      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 8px', overflowX: 'auto' }} className="jp-scroll">
        {JP_VOICE_DETAILS.map(vd => {
          const voice = JP_VOICES.find(v => v.id === vd.id)!;
          const isSelected = vd.id === selectedId;
          return (
            <button
              key={vd.id}
              onClick={() => onSelect(vd.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 100,
                background: isSelected ? `${voice.color}22` : 'transparent',
                border: `1px solid ${isSelected ? voice.color + '44' : t.border}`,
                color: isSelected ? voice.color : t.muted,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {vd.name}
            </button>
          );
        })}
      </div>
      <div style={{ padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, background: `${selectedColor}18`, border: `1px solid ${selectedColor}33` }}>
          <JpVoiceAvatar voiceId={selectedId} size={56} ring />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.ink, fontFamily: "'Fraunces', Georgia, serif" }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>{selected.region}</div>
          </div>
          <button onClick={() => setPlaying(!playing)}
            style={{ width: 44, height: 44, borderRadius: '50%', background: selectedColor, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {playing ? '⏸' : '▶'}
          </button>
        </div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.6 }}>{selected.description}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selected.bestFor.map(tag => (
            <div key={tag} style={{ padding: '5px 12px', borderRadius: 100, background: `${selectedColor}18`, border: `1px solid ${selectedColor}33`, color: selectedColor, fontSize: 12, fontWeight: 600 }}>
              {tag}
            </div>
          ))}
        </div>
        <button
          style={{ width: '100%', height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}cc)`, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Use {selected.name} by default
        </button>
        {/* Clone CTA */}
        <div style={{ padding: 16, borderRadius: 14, background: `${accent}10`, border: `1px solid ${accent}22` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.ink, marginBottom: 4 }}>Clone your voice</div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 10 }}>Record 3 minutes and get your own AI voice narrator.</div>
          <button style={{ width: '100%', height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            + Clone voice
          </button>
        </div>
      </div>
    </div>
  );
}
