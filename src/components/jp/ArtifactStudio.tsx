'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useJp, JP_SUBJECTS, type JpTheme } from '@/store/jpStore';
import {
  listWorkspaceArtifacts,
  generateWorkspaceArtifact,
  type Artifact,
} from '@/lib/api';

interface ArtifactStudioProps {
  theme: JpTheme;
  accent: string;
  frame?: 'desktop' | 'mobile';
}

// ── Data ───────────────────────────────────────────────────────────────────────

interface ArtifactType {
  id: string;
  icon: string;
  label: string;
  color: string;
}

const JP_ARTIFACT_TYPES: ArtifactType[] = [
  { id: 'quiz',        icon: '?',  label: 'Quiz',        color: '#1B6EF3' },
  { id: 'flashcard',   icon: '⌖',  label: 'Flashcards',  color: '#F5A623' },
  { id: 'mindmap',     icon: '◉',  label: 'Mind Map',    color: '#9333EA' },
  { id: 'slides',      icon: '▭',  label: 'Slides',      color: '#10B981' },
  { id: 'summary',     icon: '¶',  label: 'Summary',     color: '#EF4444' },
  { id: 'infographic', icon: '◳',  label: 'Infographic', color: '#0EA5E9' },
];

const JP_ARTIFACT_DATA = {
  quiz: {
    questions: [
      {
        q: 'Where do the light-dependent reactions of photosynthesis occur?',
        options: ['Stroma', 'Thylakoid membranes', 'Cell membrane', 'Mitochondria'],
        answer: 1,
        explanation: 'The light-dependent reactions occur in the thylakoid membranes, where chlorophyll absorbs light to generate ATP and NADPH.',
      },
      {
        q: 'What is the primary product of the Calvin cycle?',
        options: ['Oxygen', 'Water', 'Glucose', 'Carbon dioxide'],
        answer: 2,
        explanation: 'The Calvin cycle uses CO₂ and the energy from ATP and NADPH to synthesise glucose in the stroma.',
      },
      {
        q: 'Which gas is released as a by-product of the light reactions?',
        options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'],
        answer: 2,
        explanation: 'Water molecules are split during the light reactions, releasing oxygen as a by-product.',
      },
    ],
  },
  flashcard: {
    cards: [
      { front: 'What is photosynthesis?', back: 'The process by which plants convert light energy into chemical energy (glucose), releasing oxygen.' },
      { front: 'Where does the Calvin cycle occur?', back: 'In the stroma of the chloroplast.' },
      { front: 'What is ATP?', back: 'Adenosine triphosphate — the primary energy currency used in cellular processes.' },
      { front: 'What role does chlorophyll play?', back: 'Chlorophyll absorbs light (mostly red and blue wavelengths) and transfers energy to chemical reactions.' },
    ],
  },
  mindmap: {
    root: 'Photosynthesis',
    children: [
      {
        label: 'Light Reactions',
        children: [
          { label: 'Thylakoid membranes', children: [] },
          { label: 'ATP & NADPH production', children: [] },
          { label: 'O₂ released', children: [] },
        ],
      },
      {
        label: 'Calvin Cycle',
        children: [
          { label: 'Stroma', children: [] },
          { label: 'CO₂ fixation', children: [] },
          { label: 'Glucose synthesis', children: [] },
        ],
      },
      {
        label: 'Carbon Cycle',
        children: [
          { label: 'Carbon sequestration', children: [] },
          { label: 'Respiration release', children: [] },
          { label: 'Human impact', children: [] },
        ],
      },
    ],
  },
  summary: {
    text: '**Photosynthesis** is the process by which green plants, algae, and some bacteria convert **light energy** into **chemical energy** stored as glucose. The reaction can be summarised as: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.\n\nThe process has two main stages:\n\n1. **Light-dependent reactions** (thylakoids): Light is absorbed by chlorophyll, water is split, and ATP/NADPH are produced. Oxygen is released as a by-product.\n\n2. **Calvin cycle** (stroma): CO₂ is fixed using the ATP and NADPH from stage 1 to produce glucose via enzyme-catalysed reactions.',
    takeaways: [
      'Photosynthesis underpins virtually all food chains on Earth.',
      'The two stages are the light reactions (thylakoids) and the Calvin cycle (stroma).',
      'Oxygen in our atmosphere is largely a by-product of photosynthesis.',
      'Human disruption of the carbon cycle threatens the ancient balance.',
    ],
  },
  slides: {
    slides: [
      { title: 'Photosynthesis & The Carbon Cycle', body: 'BIO 201 — Ecology\n\nA primer on how plants power life on Earth.', notes: 'Set context: why photosynthesis matters globally.' },
      { title: 'What is Photosynthesis?', body: '• Converts light → chemical energy (glucose)\n• Performed by plants, algae, cyanobacteria\n• Equation: 6CO₂ + 6H₂O + light → glucose + 6O₂', notes: 'Emphasise that this reaction powers almost all life.' },
      { title: 'Two Coupled Stages', body: '1. Light reactions (thylakoids)\n   — Split water, produce ATP + NADPH, release O₂\n\n2. Calvin cycle (stroma)\n   — Fix CO₂ into glucose', notes: 'Draw the chloroplast diagram here.' },
      { title: 'The Carbon Cycle', body: '• Plants absorb atmospheric CO₂\n• Respiration & decomposition release it\n• Fossil fuels disrupt the balance', notes: 'Good moment to introduce climate change context.' },
    ],
  },
  infographic: {
    stats: [
      { icon: '🌿', stat: '~400 Gt', heading: 'Plant biomass', body: 'Total carbon stored in plant biomass globally.' },
      { icon: '💨', stat: '120 Gt/yr', heading: 'CO₂ fixed', body: 'Carbon fixed annually through photosynthesis.' },
      { icon: '☀️', stat: '1–2%', heading: 'Light used', body: 'Efficiency of solar energy conversion to glucose.' },
      { icon: '🌡️', stat: '+1.1°C', heading: 'Global warming', body: 'Average temperature rise since pre-industrial era.' },
    ],
  },
};

// ── Main component ─────────────────────────────────────────────────────────────

export function ArtifactStudio({ theme: t, accent, frame = 'desktop' }: ArtifactStudioProps) {
  const { workspaceId, docs, currentDocId } = useJp();
  const [selectedType, setSelectedType] = useState<string>('quiz');
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [generatedData, setGeneratedData] = useState<typeof JP_ARTIFACT_DATA | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentDoc = docs.find(d => d.id === currentDocId) || docs[0];
  const selectedDef = JP_ARTIFACT_TYPES.find(a => a.id === selectedType)!;

  // Load existing artifacts on mount
  const loadArtifacts = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const list = await listWorkspaceArtifacts(workspaceId);
      setArtifacts(list);
    } catch (e) {
      console.error('loadArtifacts:', e);
    }
  }, [workspaceId]);

  useEffect(() => { loadArtifacts(); }, [loadArtifacts]);

  // Load existing artifact when user selects a type that was already generated
  useEffect(() => {
    const existing = artifacts.find(a => a.type === selectedType);
    if (existing) {
      try {
        const parsed = JSON.parse(existing.content);
        setGeneratedData(prev => ({ ...(prev || JP_ARTIFACT_DATA), [selectedType]: parsed }));
        setGenerated(true);
      } catch {
        // Content is not JSON, will show raw
        setGeneratedData(prev => ({ ...(prev || JP_ARTIFACT_DATA), [selectedType]: { _raw: existing.content } }));
        setGenerated(true);
      }
    } else {
      setGenerated(false);
    }
  }, [selectedType, artifacts]);

  const handleGenerate = async () => {
    if (!workspaceId) return;
    setGenerating(true);
    setGenerated(false);
    setGenProgress(0);
    setError(null);

    // Animate progress while waiting
    const progressId = setInterval(() => {
      setGenProgress(p => Math.min(90, p + 3));
    }, 200);

    try {
      const prompt = currentDoc
        ? `Generate a ${selectedType} for: "${currentDoc.title}" (${currentDoc.course})`
        : `Generate a ${selectedType} for studying`;

      const result = await generateWorkspaceArtifact(workspaceId, selectedType, {
        title: `${selectedDef.label} — ${currentDoc?.title || 'Study'}`,
        prompt,
        format: 'json',
      });

      clearInterval(progressId);
      setGenProgress(100);

      const artifact = result.artifact;
      setArtifacts(prev => {
        const idx = prev.findIndex(a => a.type === selectedType);
        if (idx >= 0) { const next = [...prev]; next[idx] = artifact; return next; }
        return [...prev, artifact];
      });

      try {
        const parsed = JSON.parse(artifact.content);
        setGeneratedData(prev => ({ ...(prev || JP_ARTIFACT_DATA), [selectedType]: parsed }));
      } catch {
        setGeneratedData(prev => ({ ...(prev || JP_ARTIFACT_DATA), [selectedType]: { _raw: artifact.content } }));
      }
      setGenerated(true);
    } catch (e: any) {
      clearInterval(progressId);
      setError(e?.message || 'Generation failed. Check backend connection.');
      setGenerating(false);
      return;
    } finally {
      clearInterval(progressId);
      setGenerating(false);
    }
  };

  // Fallback progress animation (not needed anymore but kept for safety)
  useEffect(() => {
    if (!generating) return;
    // already handled by handleGenerate
  }, [generating]);

  const displayData = generatedData || JP_ARTIFACT_DATA;

  if (frame === 'mobile') {
    return <MobileArtifactStudio t={t} accent={accent} selectedType={selectedType} onSelectType={setSelectedType} generated={generated} generating={generating} genProgress={genProgress} onGenerate={handleGenerate} selectedDef={selectedDef} displayData={displayData} currentDocTitle={currentDoc?.title || ''} />;
  }

  const docSubj = currentDoc ? (JP_SUBJECTS[currentDoc.subject] || JP_SUBJECTS['Biology']) : JP_SUBJECTS['Biology'];

  return (
    <div style={{ display: 'flex', height: '100%', background: t.bg, overflow: 'hidden', fontFamily: "'Syne', sans-serif" }}>
      {/* Left rail */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          background: t.sidebar,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          padding: 20,
          gap: 24,
        }}
        className="jp-scroll"
      >
        {/* Source doc */}
        <div>
          <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>
            SOURCE DOC
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: t.card, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{currentDoc ? docSubj.glyph : '📄'}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.ink }}>{currentDoc?.title || 'No document selected'}</div>
              <div style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
                {currentDoc ? `${currentDoc.course} · ${currentDoc.pages}p` : 'Upload a PDF first'}
              </div>
            </div>
          </div>
        </div>

        {/* Generated artifacts */}
        <div>
          <div style={{ fontSize: 10, color: t.faded, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 8 }}>
            GENERATED ({artifacts.length})
          </div>
          {artifacts.length === 0 ? (
            <div style={{ fontSize: 12, color: t.faded, padding: '8px 0' }}>None yet — click Generate</div>
          ) : (
            artifacts.map(a => {
              const def = JP_ARTIFACT_TYPES.find(d => d.id === a.type);
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedType(a.type)}
                  style={{
                    padding: '8px 10px',
                    fontSize: 12,
                    color: selectedType === a.type ? accent : t.muted,
                    cursor: 'pointer',
                    borderRadius: 8,
                    marginBottom: 2,
                    background: selectedType === a.type ? `${accent}10` : 'transparent',
                  }}
                >
                  {def?.icon} {def?.label || a.type}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Type picker */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${t.border}`,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {JP_ARTIFACT_TYPES.map(art => (
            <button
              key={art.id}
              onClick={() => setSelectedType(art.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: selectedType === art.id ? `${art.color}22` : t.inset,
                border: `1px solid ${selectedType === art.id ? art.color + '66' : t.border}`,
                color: selectedType === art.id ? art.color : t.muted,
                fontSize: 13,
                fontWeight: selectedType === art.id ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{art.icon}</span> {art.label}
            </button>
          ))}
          <button
            onClick={handleGenerate}
            disabled={generating || !workspaceId}
            style={{
              marginLeft: 'auto',
              padding: '8px 20px',
              borderRadius: 10,
              background: generating ? t.inset : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              border: generating ? `1px solid ${t.border}` : 'none',
              color: generating ? t.muted : '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? '⏳ Generating…' : '✦ Generate'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '8px 24px', fontSize: 12, color: '#EF4444', background: '#EF444410', borderBottom: `1px solid ${t.border}` }}>
            {error}
          </div>
        )}

        {/* Preview */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }} className="jp-scroll">
          <ArtifactPreview
            type={selectedType}
            def={selectedDef}
            data={displayData}
            generated={generated}
            generating={generating}
            genProgress={genProgress}
            t={t}
            accent={accent}
            docTitle={currentDoc?.title || ''}
          />
        </div>
      </div>
    </div>
  );
}

// ── Mobile variant ────────────────────────────────────────────────────────────

function MobileArtifactStudio({
  t, accent, selectedType, onSelectType,
  generated, generating, genProgress, onGenerate, selectedDef, displayData, currentDocTitle,
}: {
  t: JpTheme; accent: string;
  selectedType: string; onSelectType: (v: string) => void;
  generated: boolean; generating: boolean; genProgress: number; onGenerate: () => void;
  selectedDef: ArtifactType;
  displayData: typeof JP_ARTIFACT_DATA;
  currentDocTitle: string;
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.ink, fontFamily: "'Fraunces', Georgia, serif" }}>Study Tools</div>
        <button onClick={onGenerate} disabled={generating} style={{ padding: '6px 14px', borderRadius: 10, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer' }}>
          {generating ? '⏳' : '✦ Generate'}
        </button>
      </div>
      {/* Doc title */}
      <div style={{ padding: '0 16px 12px', fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
        {currentDocTitle || 'No document selected'}
      </div>
      {/* Horizontal type carousel */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8, overflowX: 'auto' }} className="jp-scroll">
        {JP_ARTIFACT_TYPES.map(art => (
          <button
            key={art.id}
            onClick={() => onSelectType(art.id)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 10,
              background: selectedType === art.id ? `${art.color}22` : t.inset,
              border: `1px solid ${selectedType === art.id ? art.color + '66' : t.border}`,
              color: selectedType === art.id ? art.color : t.muted,
              fontSize: 12,
              fontWeight: selectedType === art.id ? 700 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>{art.icon}</span> {art.label}
          </button>
        ))}
      </div>
      {/* Preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }} className="jp-scroll">
        <ArtifactPreview
          type={selectedType}
          def={selectedDef}
          data={displayData}
          generated={generated}
          generating={generating}
          genProgress={genProgress}
          t={t}
          accent={accent}
          docTitle={currentDocTitle}
        />
      </div>
    </div>
  );
}

// ── ArtifactPreview ───────────────────────────────────────────────────────────

function ArtifactPreview({
  type, def, data, generated, generating, genProgress, t, accent, docTitle,
}: {
  type: string;
  def: ArtifactType;
  data: typeof JP_ARTIFACT_DATA;
  generated: boolean;
  generating: boolean;
  genProgress: number;
  t: JpTheme;
  accent: string;
  docTitle?: string;
}) {
  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header strip */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: `${def.color}10`,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${def.color}22`,
            border: `1px solid ${def.color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: def.color,
          }}
        >
          {def.icon}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>{def.label}</div>
          <div style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            {docTitle || 'Study document'}
          </div>
        </div>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div
          style={{
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div style={{ fontSize: 32, animation: 'jp-spin 1s linear infinite' }}>✦</div>
          <div style={{ width: '100%', maxWidth: 320 }}>
            <div style={{ height: 6, borderRadius: 3, background: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${genProgress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}88)`, borderRadius: 3, transition: 'width 0.1s linear' }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: t.muted }}>Generating {def.label.toLowerCase()}...</div>
        </div>
      )}

      {/* Not yet generated */}
      {!generated && !generating && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16, color: t.faded }}>{def.icon}</div>
          <div style={{ fontSize: 14, color: t.muted, marginBottom: 8 }}>
            Click <strong style={{ color: accent }}>✦ Generate</strong> to create this {def.label.toLowerCase()} with AI
          </div>
        </div>
      )}

      {/* Artifact content */}
      {generated && !generating && (
        <div style={{ padding: 20 }}>
          {/* Raw text fallback */}
          {(data[type as keyof typeof data] as any)?._raw && (
            <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: "'Fraunces', Georgia, serif" }}>
              {(data[type as keyof typeof data] as any)._raw}
            </div>
          )}
          {!(data[type as keyof typeof data] as any)?._raw && (
            <>
              {type === 'quiz' && <ArtifactQuiz data={data.quiz} t={t} accent={accent} />}
              {type === 'flashcard' && <ArtifactFlashcards data={data.flashcard} t={t} accent={accent} />}
              {type === 'mindmap' && <ArtifactMindMap data={data.mindmap} t={t} accent={accent} />}
              {type === 'slides' && <ArtifactSlides data={data.slides} t={t} accent={accent} />}
              {type === 'summary' && <ArtifactSummary data={data.summary} t={t} accent={accent} />}
              {type === 'infographic' && <ArtifactInfo data={data.infographic} t={t} accent={accent} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── ArtifactQuiz ──────────────────────────────────────────────────────────────

function ArtifactQuiz({ data, t, accent }: { data: typeof JP_ARTIFACT_DATA['quiz']; t: JpTheme; accent: string }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const q = data.questions[qIdx];
  const revealed = selected !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
        Q {qIdx + 1} / {data.questions.length}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: t.ink, fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.4 }}>
        {q.q}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isSelected = selected === i;
          let bg = t.inset;
          let border = t.border;
          let color = t.ink2;
          if (revealed) {
            if (isCorrect) { bg = '#10B98122'; border = '#10B981'; color = '#10B981'; }
            else if (isSelected && !isCorrect) { bg = '#EF444422'; border = '#EF4444'; color = '#EF4444'; }
          }
          return (
            <button
              key={i}
              onClick={() => !revealed && setSelected(i)}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: bg,
                border: `1px solid ${border}`,
                color,
                fontSize: 13,
                textAlign: 'left',
                cursor: revealed ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: t.faded }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {revealed && isCorrect && <span style={{ marginLeft: 'auto', color: '#10B981' }}>✓</span>}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: `${accent}10`, border: `1px solid ${accent}22`, fontSize: 13, color: t.ink2 }}>
          <span style={{ fontWeight: 700, color: accent }}>Explanation: </span>{q.explanation}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => { setQIdx(Math.max(0, qIdx - 1)); setSelected(null); }}
          style={{ padding: '8px 16px', borderRadius: 10, background: t.inset, border: `1px solid ${t.border}`, color: t.muted, fontSize: 12, cursor: 'pointer', opacity: qIdx === 0 ? 0.4 : 1 }}>
          ← Prev
        </button>
        <button onClick={() => { setQIdx(Math.min(data.questions.length - 1, qIdx + 1)); setSelected(null); }}
          style={{ padding: '8px 16px', borderRadius: 10, background: accent, border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', opacity: qIdx === data.questions.length - 1 ? 0.4 : 1 }}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ── ArtifactFlashcards ────────────────────────────────────────────────────────

function ArtifactFlashcards({ data, t, accent }: { data: typeof JP_ARTIFACT_DATA['flashcard']; t: JpTheme; accent: string }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = data.cards[idx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
        {idx + 1} / {data.cards.length}
      </div>
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          width: '100%',
          minHeight: 160,
          background: flipped ? `${accent}18` : t.card2,
          border: `1px solid ${flipped ? accent + '44' : t.border}`,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: flipped ? 400 : 700, color: t.ink, fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.5 }}>
          {flipped ? card.back : card.front}
        </div>
      </div>
      <div style={{ fontSize: 11, color: t.faded, fontFamily: "'Syne', sans-serif" }}>
        {flipped ? 'Tap to see question' : 'Tap to reveal answer'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }}
          style={{ padding: '8px 16px', borderRadius: 10, background: t.inset, border: `1px solid ${t.border}`, color: t.muted, fontSize: 12, cursor: 'pointer' }}>
          ← Prev
        </button>
        <button
          style={{ padding: '8px 16px', borderRadius: 10, background: '#F5A62322', border: '1px solid #F5A62344', color: '#F5A623', fontSize: 12, cursor: 'pointer' }}>
          Still learning
        </button>
        <button
          style={{ padding: '8px 16px', borderRadius: 10, background: '#10B98122', border: '1px solid #10B98144', color: '#10B981', fontSize: 12, cursor: 'pointer' }}>
          Known it ✓
        </button>
        <button onClick={() => { setIdx(Math.min(data.cards.length - 1, idx + 1)); setFlipped(false); }}
          style={{ padding: '8px 16px', borderRadius: 10, background: accent, border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ── ArtifactMindMap ───────────────────────────────────────────────────────────

interface MindNode { label: string; children: MindNode[] }

function ArtifactMindMap({ data, t, accent }: { data: typeof JP_ARTIFACT_DATA['mindmap']; t: JpTheme; accent: string }) {
  return (
    <div style={{ fontFamily: "'Syne', sans-serif" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: accent, fontFamily: "'Fraunces', Georgia, serif", marginBottom: 12 }}>
        {data.root}
      </div>
      {data.children.map((child, i) => (
        <MindNodeComp key={i} node={child} depth={0} accent={accent} t={t} />
      ))}
    </div>
  );
}

function MindNodeComp({ node, depth, accent, t }: { node: MindNode; depth: number; accent: string; t: JpTheme }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 4 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: depth === 0 ? `${accent}18` : 'transparent',
          border: `1px solid ${depth === 0 ? accent + '33' : 'transparent'}`,
          color: depth === 0 ? accent : t.ink2,
          fontSize: 13,
          fontWeight: depth === 0 ? 700 : 400,
          cursor: node.children.length ? 'pointer' : 'default',
        }}
      >
        {node.children.length > 0 && (
          <span style={{ fontSize: 10, color: t.faded }}>{open ? '▼' : '▶'}</span>
        )}
        {node.label}
      </button>
      {open && node.children.map((child, i) => (
        <MindNodeComp key={i} node={child} depth={depth + 1} accent={accent} t={t} />
      ))}
    </div>
  );
}

// ── ArtifactSlides ────────────────────────────────────────────────────────────

function ArtifactSlides({ data, t, accent }: { data: typeof JP_ARTIFACT_DATA['slides']; t: JpTheme; accent: string }) {
  const [idx, setIdx] = useState(0);
  const [notes, setNotes] = useState(false);
  const slide = data.slides[idx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 16:9 slide */}
      <div
        style={{
          aspectRatio: '16/9',
          background: t.card2,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: t.ink, fontFamily: "'Fraunces', Georgia, serif" }}>{slide.title}</div>
        <div style={{ flex: 1, fontSize: 14, color: t.ink2, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{slide.body}</div>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)`, borderRadius: 2 }} />
      </div>
      {notes && (
        <div style={{ padding: 12, background: '#F5A62310', border: '1px solid #F5A62333', borderRadius: 10, fontSize: 12, color: t.muted, fontStyle: 'italic' }}>
          📝 {slide.notes}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {data.slides.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)}
              style={{ width: 8, height: 8, borderRadius: '50%', background: i === idx ? accent : t.faded, cursor: 'pointer' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setNotes(!notes)}
            style={{ padding: '6px 10px', borderRadius: 8, background: notes ? `${accent}18` : t.inset, border: `1px solid ${notes ? accent + '44' : t.border}`, color: notes ? accent : t.muted, fontSize: 11, cursor: 'pointer' }}>
            Notes
          </button>
          <button onClick={() => setIdx(Math.max(0, idx - 1))}
            style={{ padding: '6px 12px', borderRadius: 8, background: t.inset, border: `1px solid ${t.border}`, color: t.muted, fontSize: 12, cursor: 'pointer' }}>←</button>
          <button onClick={() => setIdx(Math.min(data.slides.length - 1, idx + 1))}
            style={{ padding: '6px 12px', borderRadius: 8, background: accent, border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ── ArtifactSummary ───────────────────────────────────────────────────────────

function ArtifactSummary({ data, t, accent }: { data: typeof JP_ARTIFACT_DATA['summary']; t: JpTheme; accent: string }) {
  const renderText = (text: string) => {
    return text.split('\n\n').map((para, i) => {
      const rendered = para.split(/\*\*(.+?)\*\*/g).map((chunk, j) => (
        j % 2 === 1 ? <strong key={j} style={{ color: t.ink }}>{chunk}</strong> : <span key={j}>{chunk}</span>
      ));
      return <p key={i} style={{ fontSize: 14, color: t.ink2, lineHeight: 1.7, marginBottom: 12 }}>{rendered}</p>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>{renderText(data.text)}</div>
      <div>
        <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginBottom: 10 }}>
          KEY TAKEAWAYS
        </div>
        {data.takeaways.map((tk, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '8px 12px', borderRadius: 10, background: t.inset, border: `1px solid ${t.border}` }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: t.ink2 }}>{tk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ArtifactInfo ──────────────────────────────────────────────────────────────

function ArtifactInfo({ data, t, accent }: { data: typeof JP_ARTIFACT_DATA['infographic']; t: JpTheme; accent: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {data.stats.map((stat, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 12, background: t.inset, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 24 }}>{stat.icon}</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: accent, fontFamily: "'JetBrains Mono', monospace" }}>{stat.stat}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{stat.heading}</div>
          <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{stat.body}</div>
        </div>
      ))}
    </div>
  );
}
