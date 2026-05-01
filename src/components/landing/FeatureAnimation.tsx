"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useEffect, useState, type ComponentType } from "react";
import { Headphones, Mic2, FileUp, Play, SkipBack, SkipForward } from "lucide-react";

const TABS = [
  { id: "listen",  label: "Listen Mode",   icon: Headphones },
  { id: "podcast", label: "Podcast Mode",  icon: Mic2 },
  { id: "upload",  label: "Any Document",  icon: FileUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

const WAVEFORM = [12, 20, 34, 24, 14, 28, 44, 26, 14, 36, 50, 22, 12, 30, 40, 18, 12, 32, 48, 24, 16, 36, 44, 20, 12, 26, 38, 20, 14, 28, 46, 22, 16, 30, 42, 18, 12, 24, 36, 16];

const TEXT_CHUNKS = [
  "The cell cycle is divided into two main stages: interphase and the mitotic phase.",
  "During interphase, the cell prepares for division by replicating its DNA and growing in size.",
  "The mitotic phase consists of mitosis and cytokinesis, producing two identical daughter cells.",
  "Each daughter cell inherits a complete set of chromosomes identical to the parent cell.",
];

const TRANSCRIPT = [
  { speaker: "Q", text: "So why does mitosis need four distinct phases to complete?" },
  { speaker: "A", text: "Because the cell has to physically separate its chromosomes in a precise sequence." },
  { speaker: "Q", text: "What happens if the spindle fibres don't attach properly?" },
  { speaker: "A", text: "You get nondisjunction. The chromosomes don't separate evenly between the daughter cells." },
  { speaker: "Q", text: "That can lead to aneuploidy, right? Conditions like trisomy?" },
];

const DOC_TYPES = [
  { ext: "pdf",  name: "BIO302 Notes.pdf" },
  { ext: "docx", name: "Organic Chemistry.docx" },
  { ext: "txt",  name: "Macro Economics.txt" },
  { ext: "pdf",  name: "Public Law Lecture.pdf" },
];

// ── Listen panel ────────────────────────────────────────────────────────────
function ListenPanel() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const chunkTimer = setInterval(() => setActive(p => (p + 1) % TEXT_CHUNKS.length), 3200);
    const progTimer  = setInterval(() => setProgress(p => (p >= 100 ? 0 : p + 0.4)), 80);
    return () => { clearInterval(chunkTimer); clearInterval(progTimer); };
  }, []);

  return (
    <div className="p-5 sm:p-10" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Reader */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "68ch" }}>
        {TEXT_CHUNKS.map((chunk, i) => (
          <motion.p
            key={i}
            animate={{
              opacity: i === active ? 1 : 0.25,
              x: i === active ? 0 : -4,
              borderLeftColor: i === active ? "var(--lp-amber)" : "transparent",
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 1.8vw, 17px)",
              lineHeight: "1.7",
              color: "var(--lp-text-1)",
              borderLeft: "2px solid transparent",
              paddingLeft: "14px",
            }}
          >
            {chunk}
          </motion.p>
        ))}
      </div>

      {/* Mini player */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", paddingTop: "20px", borderTop: "1px solid var(--lp-border)" }}>
        <button type="button" style={{ color: "var(--lp-text-3)", lineHeight: 0 }}><SkipBack size={15} strokeWidth={1.75} /></button>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--lp-amber)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
          <Play size={14} fill="currentColor" />
        </div>
        <button type="button" style={{ color: "var(--lp-text-3)", lineHeight: 0 }}><SkipForward size={15} strokeWidth={1.75} /></button>
        <div style={{ flex: 1, height: "2px", background: "var(--lp-border)", borderRadius: "1px", overflow: "hidden" }}>
          <motion.div animate={{ width: `${progress}%` }} style={{ height: "100%", background: "var(--lp-amber)", borderRadius: "1px" }} transition={{ duration: 0.08 }} />
        </div>
        <span style={{ fontFamily: "var(--font-syne)", fontSize: "11px", color: "var(--lp-text-3)", flexShrink: 0 }}>
          {String(Math.floor(progress * 0.18)).padStart(2, "0")}:{String(Math.floor((progress * 0.18 % 1) * 60)).padStart(2, "0")} / 18:00
        </span>
      </div>
    </div>
  );
}

// ── Podcast panel ───────────────────────────────────────────────────────────
function PodcastPanel() {
  const [activeLine, setActiveLine] = useState(1);
  const [activeBar,  setActiveBar]  = useState(12);

  useEffect(() => {
    const lineTimer = setInterval(() => setActiveLine(p => (p + 1) % TRANSCRIPT.length), 2400);
    const barTimer  = setInterval(() => setActiveBar(p => (p + 1) % WAVEFORM.length), 80);
    return () => { clearInterval(lineTimer); clearInterval(barTimer); };
  }, []);

  return (
    <div className="p-5 sm:p-10" style={{ display: "flex", gap: "0", flexDirection: "column" }}>
      {/* Waveform */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "56px", marginBottom: "32px" }}>
        {WAVEFORM.map((h, i) => {
          const dist = Math.abs(i - activeBar);
          const scale = dist === 0 ? 1 : dist === 1 ? 0.82 : dist <= 3 ? 0.55 : 0.25;
          return (
            <motion.span
              key={i}
              animate={{ height: `${h * scale}px` }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              style={{
                width: "3px",
                borderRadius: "2px",
                background: i < activeBar ? "var(--lp-amber)" : "var(--lp-border)",
                display: "inline-block",
                flexShrink: 0,
                minHeight: "3px",
                opacity: i < activeBar ? 1 : 0.35,
              }}
            />
          );
        })}
      </div>

      {/* Transcript */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {TRANSCRIPT.map((line, i) => (
          <motion.div
            key={i}
            animate={{ opacity: i === activeLine ? 1 : 0.28 }}
            transition={{ duration: 0.35 }}
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
              borderLeft: i === activeLine ? "2px solid var(--lp-amber)" : "2px solid transparent",
              paddingLeft: "14px",
            }}
          >
            <span style={{
              fontFamily: "var(--font-syne)", fontSize: "9px", fontWeight: 700,
              color: i === activeLine ? "var(--lp-amber)" : "var(--lp-text-3)",
              letterSpacing: "0.12em", whiteSpace: "nowrap", marginTop: "3px", flexShrink: 0,
            }}>
              {line.speaker}
            </span>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(13px, 1.6vw, 16px)",
              lineHeight: "1.65",
              color: i === activeLine ? "var(--lp-text-1)" : "var(--lp-text-2)",
            }}>
              {line.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Upload panel ─────────────────────────────────────────────────────────────
function UploadPanel() {
  const [step, setStep]     = useState(0);
  const [docIdx, setDocIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep(s => {
        if (s >= 2) { setDocIdx(d => (d + 1) % DOC_TYPES.length); return 0; }
        return s + 1;
      });
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const doc = DOC_TYPES[docIdx];
  const stepLabels = ["Uploading document", "Processing with AI", "Audio ready to play"];
  const extColor: Record<string, string> = { pdf: "#E53E3E", docx: "#2B6CB0", txt: "#2D7A4F" };

  return (
    <div className="p-5 sm:p-10" style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "center", justifyContent: "center", minHeight: "280px" }}>
      {/* File card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={doc.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "var(--lp-surface)",
            border: "1px solid var(--lp-border)",
            borderRadius: "14px",
            padding: "18px 24px",
            width: "100%",
            maxWidth: "440px",
          }}
        >
          <div style={{
            width: "44px", height: "44px", borderRadius: "10px",
            background: `${extColor[doc.ext] ?? "var(--lp-amber)"}22`,
            border: `1px solid ${extColor[doc.ext] ?? "var(--lp-amber)"}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 800,
            color: extColor[doc.ext] ?? "var(--lp-amber)", letterSpacing: "0.04em",
            textTransform: "uppercase", flexShrink: 0,
          }}>
            {doc.ext}
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-syne)", fontSize: "13px", fontWeight: 600, color: "var(--lp-text-1)" }}>{doc.name}</p>
            <p style={{ fontFamily: "var(--font-syne)", fontSize: "11px", color: "var(--lp-text-3)", marginTop: "2px" }}>
              {stepLabels[step]}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {stepLabels.map((label, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <motion.div
              animate={{
                background: i <= step ? "var(--lp-amber)" : "var(--lp-border)",
                scale: i === step ? 1.2 : 1,
              }}
              style={{ width: "8px", height: "8px", borderRadius: "50%" }}
              transition={{ duration: 0.3 }}
            />
            {i < stepLabels.length - 1 && (
              <div style={{ display: "none" }} />
            )}
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "var(--font-syne)", fontSize: "12px", color: "var(--lp-text-3)" }}>
        PDF · DOCX · TXT · up to 10MB · ready in ~30 seconds
      </p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
const PANELS: Record<TabId, ComponentType> = {
  listen:  ListenPanel,
  podcast: PodcastPanel,
  upload:  UploadPanel,
};

export function FeatureAnimation() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [activeTab, setActiveTab] = useState<TabId>("listen");

  // Auto-advance tabs
  useEffect(() => {
    const id = setInterval(() => {
      setActiveTab(prev => {
        const i = TABS.findIndex(t => t.id === prev);
        return TABS[(i + 1) % TABS.length].id;
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const ActivePanel = PANELS[activeTab];

  return (
    <section
      ref={sectionRef}
      style={{
        background: "var(--lp-bg)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
      }}
    >
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "40px" }}
        >
          <p className="uppercase" style={{ fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", color: "var(--lp-amber)", marginBottom: "14px" }}>
            See It Work
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, lineHeight: "1.02", letterSpacing: "-0.025em", color: "var(--lp-text-1)", maxWidth: "22ch" }}>
            One upload.{" "}
            <em style={{ fontStyle: "italic", color: "var(--lp-amber)" }}>Three ways to learn.</em>
          </h2>
        </motion.div>

        {/* Showcase card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            border: "1px solid var(--lp-border)",
            borderRadius: "20px",
            background: "var(--lp-surface)",
            overflow: "hidden",
            boxShadow: "var(--lp-shadow-card)",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--lp-border)",
              background: "var(--lp-surface-2)",
            }}
          >
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "16px 12px",
                    fontFamily: "var(--font-syne)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: isActive ? "var(--lp-amber)" : "var(--lp-text-3)",
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? "2px solid var(--lp-amber)" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "color 0.2s ease, border-color 0.2s ease",
                    position: "relative",
                  }}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Animated panel */}
          <div style={{ minHeight: "340px", position: "relative" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <ActivePanel />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "16px",
              borderTop: "1px solid var(--lp-border)",
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{ lineHeight: 0, background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <motion.div
                  animate={{
                    width: activeTab === tab.id ? "24px" : "6px",
                    background: activeTab === tab.id ? "var(--lp-amber)" : "var(--lp-border)",
                  }}
                  style={{ height: "6px", borderRadius: "3px" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
