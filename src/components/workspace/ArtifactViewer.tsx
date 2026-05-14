'use client';

/**
 * ArtifactViewer — rich interactive renderers for every artifact type.
 *
 * Dispatches on artifact.type + artifact.format:
 *   quiz       (json)  → interactive multiple-choice with scoring
 *   flashcard  (json)  → flip-card deck with tag filters
 *   mind-map   (json)  → collapsible tree
 *   slide-deck (json)  → slide-by-slide presentation
 *   infographic(json)  → stat cards
 *   data-table (csv)   → formatted table
 *   video      (json)  → scene-by-scene script
 *   audio      (json)  → podcast script with speaker labels
 *   report / study-guide / summary (markdown) → formatted prose
 *   fallback           → scrollable pre
 */

import React, { useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  BarChart2,
  Globe,
  Lightbulb,
  Shield,
  Clock,
  Target,
  Scale,
  Network,
  BookOpen,
  Table,
} from 'lucide-react';
import type { Artifact } from '@/lib/api';
import { Markdown } from '@/components/ui/Markdown';

// ── Icon map for infographic sections ──────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  chart:     <BarChart2 size={20} />,
  graph:     <BarChart2 size={20} />,
  globe:     <Globe size={20} />,
  lightbulb: <Lightbulb size={20} />,
  shield:    <Shield size={20} />,
  clock:     <Clock size={20} />,
  target:    <Target size={20} />,
  scale:     <Scale size={20} />,
  network:   <Network size={20} />,
  book:      <BookOpen size={20} />,
  table:     <Table size={20} />,
};

// ── Quiz viewer ────────────────────────────────────────────────────────────────

type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
};

function QuizViewer({ data }: { data: QuizQuestion[] }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);

  const q = data[current];
  const isAnswered = current in answered;
  const isCorrect = answered[current] === q?.answer_index;

  const handleSelect = useCallback(
    (idx: number) => {
      if (isAnswered) return;
      setSelected(idx);
      setAnswered((prev) => ({ ...prev, [current]: idx }));
      if (q && idx === q.answer_index) setScore((s) => s + 1);
    },
    [isAnswered, current, q],
  );

  const handleNext = () => {
    if (current < data.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswered({});
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / data.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-4">
        <div
          className="text-[48px] font-bold"
          style={{ color: pct >= 70 ? 'var(--teal)' : 'var(--blue)', fontFamily: 'var(--font-syne)' }}
        >
          {pct}%
        </div>
        <div className="text-[14px]" style={{ color: 'var(--text-2)' }}>
          {score} / {data.length} correct
        </div>
        <div className="text-[12px] text-center max-w-xs" style={{ color: 'var(--text-3)' }}>
          {pct >= 80
            ? 'Excellent! You clearly know this material.'
            : pct >= 60
            ? 'Good effort — review the questions you missed.'
            : 'Keep studying and try again.'}
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white"
          style={{ background: 'var(--blue)' }}
        >
          <RotateCcw size={13} /> Retry
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          Question {current + 1} / {data.length}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--teal)' }}>
          Score: {score}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((current) / data.length) * 100}%`, background: 'var(--blue)' }}
        />
      </div>
      {/* Question */}
      <div
        className="rounded-xl p-4 text-[14px] leading-relaxed"
        style={{ background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
      >
        {q.question}
      </div>
      {/* Options */}
      <div className="grid gap-2">
        {q.options.map((opt, idx) => {
          let bg = 'var(--surface-2)';
          let border = 'var(--border)';
          let color = 'var(--text-2)';

          if (isAnswered) {
            if (idx === q.answer_index) {
              bg = 'rgba(42,154,120,0.15)';
              border = 'var(--teal)';
              color = 'var(--teal)';
            } else if (idx === answered[current]) {
              bg = 'rgba(248,113,113,0.12)';
              border = '#f87171';
              color = '#f87171';
            }
          } else if (selected === idx) {
            bg = 'var(--blue-dim)';
            border = 'var(--blue)';
            color = 'var(--blue)';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className="w-full text-left rounded-xl px-4 py-3 text-[13px] transition-all duration-200 flex items-start gap-3"
              style={{ background: bg, border: `1px solid ${border}`, color }}
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ background: border, color: isAnswered || selected === idx ? 'white' : 'var(--text-3)' }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="leading-snug">{opt}</span>
              {isAnswered && idx === q.answer_index && (
                <CheckCircle2 size={16} className="ml-auto shrink-0 mt-0.5" style={{ color: 'var(--teal)' }} />
              )}
              {isAnswered && idx === answered[current] && idx !== q.answer_index && (
                <XCircle size={16} className="ml-auto shrink-0 mt-0.5" style={{ color: '#f87171' }} />
              )}
            </button>
          );
        })}
      </div>
      {/* Explanation */}
      {isAnswered && (
        <div
          className="rounded-xl px-4 py-3 text-[12px] leading-relaxed"
          style={{
            background: isCorrect ? 'rgba(42,154,120,0.1)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${isCorrect ? 'var(--teal)' : '#f87171'}`,
            color: 'var(--text-2)',
          }}
        >
          <span className="font-bold" style={{ color: isCorrect ? 'var(--teal)' : '#f87171' }}>
            {isCorrect ? '✓ Correct — ' : '✗ Incorrect — '}
          </span>
          {q.explanation}
        </div>
      )}
      {/* Next */}
      {isAnswered && (
        <button
          onClick={handleNext}
          className="self-end inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white"
          style={{ background: 'var(--blue)' }}
        >
          {current < data.length - 1 ? 'Next' : 'See score'}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

// ── Flashcard viewer ────────────────────────────────────────────────────────────

type Flashcard = { front: string; back: string; tag: string };

function FlashcardViewer({ data }: { data: Flashcard[] }) {
  const tags = Array.from(new Set(data.map((c) => c.tag)));
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const filtered = activeTag ? data.filter((c) => c.tag === activeTag) : data;
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const card = filtered[idx];

  const handleFlip = () => setFlipped((f) => !f);
  const handleNext = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % filtered.length);
  };
  const handlePrev = () => {
    setFlipped(false);
    setIdx((i) => (i - 1 + filtered.length) % filtered.length);
  };
  const toggleKnown = () => {
    setKnown((prev) => {
      const next = new Set(prev);
      const globalIdx = data.indexOf(card);
      if (next.has(globalIdx)) next.delete(globalIdx);
      else next.add(globalIdx);
      return next;
    });
  };

  if (!card) return null;
  const globalIdx = data.indexOf(card);
  const isKnown = known.has(globalIdx);

  return (
    <div className="flex flex-col gap-4">
      {/* Tag filter */}
      {tags.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTag(null); setIdx(0); setFlipped(false); }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: !activeTag ? 'var(--blue-dim)' : 'var(--surface-2)',
              border: `1px solid ${!activeTag ? 'var(--blue)' : 'var(--border)'}`,
              color: !activeTag ? 'var(--blue)' : 'var(--text-3)',
            }}
          >
            All ({data.length})
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTag(t); setIdx(0); setFlipped(false); }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              style={{
                background: activeTag === t ? 'var(--blue-dim)' : 'var(--surface-2)',
                border: `1px solid ${activeTag === t ? 'var(--blue)' : 'var(--border)'}`,
                color: activeTag === t ? 'var(--blue)' : 'var(--text-3)',
              }}
            >
              {t} ({data.filter((c) => c.tag === t).length})
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          {idx + 1} / {filtered.length}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--teal)' }}>
          {known.size} known
        </div>
      </div>

      {/* Card */}
      <div
        onClick={handleFlip}
        className="relative cursor-pointer select-none rounded-2xl min-h-[200px] flex flex-col items-center justify-center p-6 text-center transition-all duration-300"
        style={{
          background: flipped ? 'rgba(42,154,120,0.1)' : 'var(--surface-2)',
          border: `1px solid ${flipped ? 'var(--teal)' : 'var(--border)'}`,
        }}
      >
        <div
          className="text-[9px] font-bold uppercase tracking-widest mb-3"
          style={{ color: flipped ? 'var(--teal)' : 'var(--text-3)' }}
        >
          {flipped ? 'Answer' : 'Question'} · tap to flip
        </div>
        <div
          className="text-[15px] leading-relaxed"
          style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
        >
          {flipped ? card.back : card.front}
        </div>
        <div
          className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
        >
          {card.tag}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 justify-between">
        <button
          onClick={handlePrev}
          className="p-2 rounded-xl"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={toggleKnown}
          className="flex-1 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: isKnown ? 'rgba(42,154,120,0.15)' : 'var(--surface-2)',
            border: `1px solid ${isKnown ? 'var(--teal)' : 'var(--border)'}`,
            color: isKnown ? 'var(--teal)' : 'var(--text-2)',
          }}
        >
          {isKnown ? '✓ Known' : 'Mark known'}
        </button>
        <button
          onClick={handleFlip}
          className="p-2 rounded-xl"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          {flipped ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          onClick={handleNext}
          className="p-2 rounded-xl"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Mind map viewer ─────────────────────────────────────────────────────────────

type MindNode = { title: string; children?: MindNode[] };

function MindMapNode({ node, depth = 0 }: { node: MindNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const depthColors = ['var(--blue)', 'var(--teal)', 'var(--text-2)', 'var(--text-3)'];
  const color = depthColors[Math.min(depth, depthColors.length - 1)];
  const fontSize = depth === 0 ? '15px' : depth === 1 ? '13px' : '12px';
  const fontWeight = depth === 0 ? 700 : depth === 1 ? 600 : 400;

  return (
    <div className="select-none">
      <div
        className="flex items-start gap-2 py-1 cursor-pointer rounded-lg px-2 -mx-2 transition-colors hover:bg-white/[0.04]"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        {hasChildren ? (
          <span className="mt-0.5 shrink-0" style={{ color }}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
        )}
        <span style={{ color, fontSize, fontWeight, lineHeight: 1.4 }}>{node.title}</span>
      </div>
      {open && hasChildren && (
        <div style={{ borderLeft: `1px solid var(--border)`, marginLeft: `${depth * 20 + 16}px` }}>
          {node.children!.map((child, i) => (
            <MindMapNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function MindMapViewer({ data }: { data: MindNode }) {
  return (
    <div className="p-2">
      <MindMapNode node={data} depth={0} />
    </div>
  );
}

// ── Slide deck viewer ───────────────────────────────────────────────────────────

type Slide = { title: string; bullets: string[]; speaker_notes: string };
type SlideDeck = { title: string; slides: Slide[] };

function SlideDeckViewer({ data }: { data: SlideDeck }) {
  const [idx, setIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const slide = data.slides[idx];
  const total = data.slides.length;

  if (!slide) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((idx + 1) / total) * 100}%`, background: 'var(--blue)' }}
        />
      </div>

      {/* Slide */}
      <div
        className="rounded-2xl p-6 min-h-[220px] flex flex-col gap-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-3)' }}
        >
          Slide {idx + 1} / {total}
        </div>
        <div
          className="text-[18px] font-bold leading-tight"
          style={{ color: 'var(--text-1)', fontFamily: 'var(--font-syne)' }}
        >
          {slide.title}
        </div>
        {slide.bullets.length > 0 && (
          <ul className="space-y-2">
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--text-2)' }}>
                <span className="mt-2 shrink-0 w-1 h-1 rounded-full" style={{ background: 'var(--blue)' }} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Speaker notes */}
      {slide.speaker_notes && (
        <>
          <button
            onClick={() => setShowNotes((n) => !n)}
            className="self-start inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-3)' }}
          >
            {showNotes ? <EyeOff size={12} /> : <Eye size={12} />}
            Speaker notes
          </button>
          {showNotes && (
            <div
              className="rounded-xl px-4 py-3 text-[12px] italic leading-relaxed"
              style={{ background: 'rgba(44,123,229,0.08)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
            >
              {slide.speaker_notes}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <div className="flex-1 flex justify-center gap-1 flex-wrap">
          {data.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? 'var(--blue)' : 'var(--border)' }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
          disabled={idx === total - 1}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Infographic viewer ──────────────────────────────────────────────────────────

type InfographicSection = { heading: string; stat: string; body: string; icon: string };
type Infographic = { title: string; sections: InfographicSection[] };

function InfographicViewer({ data }: { data: Infographic }) {
  return (
    <div className="space-y-4">
      <div
        className="text-[16px] font-bold"
        style={{ color: 'var(--text-1)', fontFamily: 'var(--font-syne)' }}
      >
        {data.title}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {data.sections.map((sec, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
              >
                {ICON_MAP[sec.icon] ?? <Lightbulb size={16} />}
              </div>
              <div
                className="text-[20px] font-bold leading-none text-right"
                style={{ color: 'var(--blue)', fontFamily: 'var(--font-syne)' }}
              >
                {sec.stat}
              </div>
            </div>
            <div className="text-[12px] font-semibold" style={{ color: 'var(--text-1)' }}>
              {sec.heading}
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
              {sec.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Data table viewer ───────────────────────────────────────────────────────────

function DataTableViewer({ csv }: { csv: string }) {
  const lines = csv.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return null;

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr style={{ background: 'var(--surface-2)' }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[10px] border-b"
                style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{ borderBottom: `1px solid var(--border)`, background: ri % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2.5"
                  style={{ color: 'var(--text-2)' }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Video script viewer ─────────────────────────────────────────────────────────

type VideoScene = {
  scene: number;
  title: string;
  narration: string;
  b_roll: string[];
  duration_sec: number;
};
type VideoScript = { title: string; scenes: VideoScene[] };

function VideoScriptViewer({ data }: { data: VideoScript }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const total = data.scenes.reduce((acc, s) => acc + s.duration_sec, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-syne)' }}>
          {data.title}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          ~{Math.round(total / 60)}m {total % 60}s
        </div>
      </div>
      {data.scenes.map((scene, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ background: 'var(--surface-2)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
              >
                {scene.scene}
              </span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{scene.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{scene.duration_sec}s</span>
              {expanded === i ? <ChevronUp size={14} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />}
            </div>
          </button>
          {expanded === i && (
            <div className="px-4 py-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{scene.narration}</p>
              {scene.b_roll.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>B-Roll</div>
                  <div className="flex flex-wrap gap-1.5">
                    {scene.b_roll.map((b, bi) => (
                      <span
                        key={bi}
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Audio/podcast script viewer ─────────────────────────────────────────────────

type PodcastLine = { speaker: string; text: string; voice?: string };

function AudioScriptViewer({ data }: { data: PodcastLine[] }) {
  return (
    <div className="space-y-3">
      {data.map((line, i) => {
        const isEzinne = line.speaker?.toLowerCase().includes('ezinne') || line.speaker?.toLowerCase().includes('a');
        return (
          <div key={i} className={`flex gap-3 ${isEzinne ? '' : 'flex-row-reverse'}`}>
            <div
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: isEzinne ? 'var(--blue-dim)' : 'rgba(42,154,120,0.2)',
                color: isEzinne ? 'var(--blue)' : 'var(--teal)',
              }}
            >
              {(line.speaker || '?')[0].toUpperCase()}
            </div>
            <div
              className="rounded-xl px-4 py-3 text-[13px] leading-relaxed max-w-[85%]"
              style={{
                background: isEzinne ? 'var(--surface-2)' : 'rgba(42,154,120,0.08)',
                border: `1px solid ${isEzinne ? 'var(--border)' : 'rgba(42,154,120,0.25)'}`,
                color: 'var(--text-2)',
              }}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: isEzinne ? 'var(--blue)' : 'var(--teal)' }}
              >
                {line.speaker}
              </div>
              {line.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main dispatcher ─────────────────────────────────────────────────────────────

export function ArtifactViewer({ artifact }: { artifact: Artifact }) {
  const { type, format, content } = artifact;

  // Parse JSON once
  let parsed: unknown = null;
  if (format === 'json' && content) {
    try {
      parsed = JSON.parse(content);
    } catch {
      // fall through to raw display
    }
  }

  // Quiz
  if (type === 'quiz' && Array.isArray(parsed)) {
    return <QuizViewer data={parsed as QuizQuestion[]} />;
  }

  // Flashcards
  if ((type === 'flashcard' || type === 'flashcards') && Array.isArray(parsed)) {
    return <FlashcardViewer data={parsed as Flashcard[]} />;
  }

  // Mind map
  if (type === 'mind-map' && parsed && typeof parsed === 'object' && 'children' in (parsed as object)) {
    return <MindMapViewer data={parsed as MindNode} />;
  }

  // Slide deck
  if (type === 'slide-deck' && parsed && typeof parsed === 'object' && 'slides' in (parsed as object)) {
    return <SlideDeckViewer data={parsed as SlideDeck} />;
  }

  // Infographic
  if (type === 'infographic' && parsed && typeof parsed === 'object' && 'sections' in (parsed as object)) {
    return <InfographicViewer data={parsed as Infographic} />;
  }

  // Video script
  if (type === 'video' && parsed && typeof parsed === 'object' && 'scenes' in (parsed as object)) {
    return <VideoScriptViewer data={parsed as VideoScript} />;
  }

  // Audio/podcast script (JSON array)
  if (type === 'audio' && Array.isArray(parsed)) {
    return <AudioScriptViewer data={parsed as PodcastLine[]} />;
  }

  // Data table (CSV)
  if (type === 'data-table' && format === 'csv' && content) {
    return <DataTableViewer csv={content} />;
  }

  // Markdown prose (report, study-guide, summary)
  if (format === 'markdown' && content) {
    return <Markdown content={content} />;
  }

  // Fallback: raw text
  return (
    <pre
      className="text-[12px] whitespace-pre-wrap leading-relaxed"
      style={{ color: 'var(--text-2)' }}
    >
      {content ?? '(no content)'}
    </pre>
  );
}
