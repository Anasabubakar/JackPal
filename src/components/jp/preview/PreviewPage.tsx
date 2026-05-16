'use client';

import React, { useState } from 'react';
import { PreviewProvider, usePreview } from './PreviewState';
import VariantA from './VariantA';
import VariantB from './VariantB';
import VariantC from './VariantC';
import type { JpTheme } from '@/store/jpStore';
import { jpTheme } from '@/store/jpStore';

interface PreviewPageProps {
  theme: JpTheme;
  accent: string;
}

const ACCENT_SWATCHES = ['#1B6EF3', '#F5A623', '#10B981', '#9333EA', '#EF4444'];
const SOURCE_OPTIONS = ['youtube', 'pdf', 'web', 'notes'] as const;

export function PreviewPage({ theme: defaultTheme, accent: defaultAccent }: PreviewPageProps) {
  const [accent, setAccent] = useState(defaultAccent);
  const [themeA, setThemeA] = useState(defaultTheme.isDark);
  const [themeC, setThemeC] = useState(defaultTheme.isDark);
  const [sourceC, setSourceC] = useState<typeof SOURCE_OPTIONS[number]>('pdf');
  const [wordSpeed, setWordSpeed] = useState(1);

  const tA = jpTheme(themeA);
  const tC = jpTheme(themeC);

  return (
    <PreviewProvider>
      <div
        style={{
          background: '#060C22',
          minHeight: '100%',
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        {/* Tweaks sidebar */}
        <TweaksSidebar
          accent={accent}
          onAccent={setAccent}
          themeA={themeA}
          onThemeA={setThemeA}
          themeC={themeC}
          onThemeC={setThemeC}
          sourceC={sourceC}
          onSourceC={setSourceC}
          wordSpeed={wordSpeed}
          onWordSpeed={setWordSpeed}
        />

        {/* Artboards scroll container */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '32px 24px',
            display: 'flex',
            gap: 32,
            alignItems: 'flex-start',
          }}
          className="jp-scroll"
        >
          {/* Artboard A */}
          <Artboard label="A · Paper Reader">
            <div style={{ width: 900, height: 640, position: 'relative' }}>
              <VariantA theme={tA} accent={accent} />
            </div>
          </Artboard>

          {/* Artboard B */}
          <Artboard label="B · Spotlight">
            <div style={{ width: 700, height: 640 }}>
              <VariantB theme={defaultTheme} accent={accent} />
            </div>
          </Artboard>

          {/* Artboard C */}
          <Artboard label="C · Source Split">
            <div style={{ width: 900, height: 640, position: 'relative' }}>
              <VariantC theme={tC} accent={accent} source={sourceC} />
            </div>
          </Artboard>
        </div>
      </div>
    </PreviewProvider>
  );
}

function Artboard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.08em',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Tweaks sidebar ────────────────────────────────────────────────────────────

function TweaksSidebar({
  accent, onAccent,
  themeA, onThemeA,
  themeC, onThemeC,
  sourceC, onSourceC,
  wordSpeed, onWordSpeed,
}: {
  accent: string; onAccent: (v: string) => void;
  themeA: boolean; onThemeA: (v: boolean) => void;
  themeC: boolean; onThemeC: (v: boolean) => void;
  sourceC: typeof SOURCE_OPTIONS[number]; onSourceC: (v: typeof SOURCE_OPTIONS[number]) => void;
  wordSpeed: number; onWordSpeed: (v: number) => void;
}) {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: '#0A1130',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        overflowY: 'auto',
      }}
      className="jp-scroll"
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.8)',
          fontFamily: "'Syne', sans-serif",
          letterSpacing: '0.04em',
        }}
      >
        Preview Tweaks
      </div>

      {/* Accent color */}
      <TweakSection label="Accent colour">
        <div style={{ display: 'flex', gap: 8 }}>
          {ACCENT_SWATCHES.map(color => (
            <button
              key={color}
              onClick={() => onAccent(color)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: color,
                border: `2px solid ${accent === color ? '#fff' : 'transparent'}`,
                cursor: 'pointer',
                boxShadow: accent === color ? `0 0 0 2px ${color}55` : 'none',
              }}
            />
          ))}
        </div>
      </TweakSection>

      {/* Theme A */}
      <TweakSection label="A · Theme">
        <ThemeToggle isDark={themeA} onChange={onThemeA} />
      </TweakSection>

      {/* Theme C */}
      <TweakSection label="C · Theme">
        <ThemeToggle isDark={themeC} onChange={onThemeC} />
      </TweakSection>

      {/* Source C */}
      <TweakSection label="C · Source">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SOURCE_OPTIONS.map(src => (
            <button
              key={src}
              onClick={() => onSourceC(src)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: sourceC === src ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${sourceC === src ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                color: sourceC === src ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {src.charAt(0).toUpperCase() + src.slice(1)}
            </button>
          ))}
        </div>
      </TweakSection>

      {/* Word speed */}
      <TweakSection label="Word speed">
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={wordSpeed}
          onChange={e => onWordSpeed(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: accent }}
        />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
          {wordSpeed}× speed
        </div>
      </TweakSection>
    </div>
  );
}

function TweakSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ThemeToggle({ isDark, onChange }: { isDark: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[true, false].map(dark => (
        <button
          key={String(dark)}
          onClick={() => onChange(dark)}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 8,
            background: isDark === dark ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: `1px solid ${isDark === dark ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
            color: isDark === dark ? '#fff' : 'rgba(255,255,255,0.35)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {dark ? '🌙 Dark' : '☀ Light'}
        </button>
      ))}
    </div>
  );
}
