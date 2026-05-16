'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';

// ── Text ──────────────────────────────────────────────────────────────────────

export const PREVIEW_TEXT = `Photosynthesis is the remarkable process by which plants, algae, and some bacteria capture light energy and convert it into chemical energy stored as glucose. This process is fundamental to life on Earth, as it forms the base of almost all food chains and is responsible for the oxygen in our atmosphere. Without photosynthesis, the diversity of life we see today would simply not exist.

The process occurs in two main stages that are tightly coupled. The light-dependent reactions take place in the thylakoid membranes of chloroplasts, where chlorophyll absorbs sunlight and uses that energy to split water molecules, releasing oxygen as a by-product and generating ATP and NADPH. These energy carriers then power the second stage — the Calvin cycle — which takes place in the stroma, where carbon dioxide from the atmosphere is fixed into organic molecules through a series of enzyme-catalysed reactions, ultimately producing glucose.

Photosynthesis sits at the very heart of the global carbon cycle. Plants absorb atmospheric carbon dioxide and lock it away in biomass; when organisms respire or decompose, that carbon is released again. Human activities — particularly the burning of fossil fuels — have disrupted this ancient balance, releasing carbon that was sequestered over millions of years. Understanding the molecular machinery of photosynthesis has therefore become critical not just for agriculture, but for engineering solutions to climate change, including artificial photosynthesis and carbon capture technologies.`;

export interface Token {
  word: string;
  paragraph: number;
  index: number;
}

export function tokenizePreview(text: string): Token[] {
  const tokens: Token[] = [];
  let idx = 0;
  text.split('\n\n').forEach((para, paraIdx) => {
    para.split(/\s+/).filter(Boolean).forEach(word => {
      tokens.push({ word, paragraph: paraIdx, index: idx++ });
    });
  });
  return tokens;
}

export const PREVIEW_TOKENIZED = tokenizePreview(PREVIEW_TEXT);

export const PREVIEW_DOC = {
  title: 'Photosynthesis & The Carbon Cycle',
  course: 'BIO 201 — Ecology',
  voice: 'adaora',
  pages: 24,
  durationSec: 32 * 60,
};

export const PARAGRAPH_TITLES = [
  '01 · Why it matters',
  '02 · Two coupled stages',
  '03 · The bigger picture',
];

// ── Context ────────────────────────────────────────────────────────────────────

interface PreviewValue {
  tIndex: number;
  playing: boolean;
  speed: number;
  setPlaying: (v: boolean) => void;
  setSpeed: (v: number) => void;
  setTIndex: (v: number) => void;
}

const PreviewCtx = createContext<PreviewValue | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [tIndex, setTIndex] = useState(54);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!playing) return;
    const delay = Math.max(120, 380 / speed);
    const id = setInterval(() => {
      setTIndex(prev => {
        if (prev >= PREVIEW_TOKENIZED.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);
    return () => clearInterval(id);
  }, [playing, speed]);

  return (
    <PreviewCtx.Provider
      value={{ tIndex, playing, speed, setPlaying, setSpeed, setTIndex }}
    >
      {children}
    </PreviewCtx.Provider>
  );
}

export function usePreview(): PreviewValue {
  const ctx = useContext(PreviewCtx);
  if (!ctx) throw new Error('usePreview must be inside PreviewProvider');
  return ctx;
}
