"use client";

import { useEffect, useState } from "react";
import { Play, SkipBack, SkipForward } from "lucide-react";

const WAVEFORM = [14, 22, 34, 26, 18, 30, 42, 28, 16, 36, 44, 24, 18, 32, 40, 22, 16, 34, 46, 28, 20, 36, 42, 26, 16, 30, 38, 24, 18, 32, 44, 28, 20, 34, 40, 22, 16, 28, 36, 20];
const PIVOT_INIT = 23;
const TOTAL_SECONDS = 18 * 60;

export function AudioPlayerMock({
  large = false,
}: {
  large?: boolean;
  showMascot?: boolean;
}) {
  const [pivot,   setPivot]   = useState(PIVOT_INIT);
  const [elapsed, setElapsed] = useState(Math.round((PIVOT_INIT / WAVEFORM.length) * TOTAL_SECONDS));

  useEffect(() => {
    const barInterval  = setInterval(() => setPivot(p => (p + 1) % WAVEFORM.length), 140);
    const timeInterval = setInterval(() => setElapsed(s => (s + 1) % TOTAL_SECONDS), 1000);
    return () => { clearInterval(barInterval); clearInterval(timeInterval); };
  }, []);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  const progress = (elapsed / TOTAL_SECONDS) * 100;

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: large ? "540px" : "500px" }}>
      <div
        style={{
          background: "var(--lp-surface)",
          border: "1px solid var(--lp-border)",
          borderRadius: "20px",
          padding: large ? "32px" : "26px",
          boxShadow: "var(--lp-shadow-card)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <p style={{ fontFamily: "var(--font-syne)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em", color: "var(--lp-amber)", textTransform: "uppercase", marginBottom: "6px" }}>
              Now Playing
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: large ? "20px" : "18px", fontWeight: 800, color: "var(--lp-text-1)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              BIO302 · Cell Division
            </p>
            <p style={{ fontFamily: "var(--font-syne)", fontSize: "11px", color: "var(--lp-text-3)", marginTop: "4px" }}>
              Chapter 4 · 18 min · 12 pages
            </p>
          </div>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid var(--lp-border)", borderRadius: "8px", padding: "6px 10px", flexShrink: 0 }}>
            <span
              style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "var(--lp-amber)", display: "inline-block",
                animation: "pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
              }}
            />
            <span style={{ fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 700, color: "var(--lp-text-2)", letterSpacing: "0.1em" }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Waveform */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "52px", marginBottom: "14px" }}>
          {WAVEFORM.map((h, i) => {
            const isPast    = i < pivot;
            const isCurrent = i === pivot;
            const isNear    = Math.abs(i - pivot) <= 3;
            return (
              <span
                key={i}
                className={isCurrent || isNear ? "animate-wave" : ""}
                style={{
                  width: "3px",
                  height: `${h}px`,
                  borderRadius: "2px",
                  background: isPast
                    ? "var(--lp-amber)"
                    : isCurrent
                    ? "var(--lp-amber-bright)"
                    : "var(--lp-border)",
                  opacity: isPast ? 0.85 : isCurrent ? 1 : isNear ? 0.55 : 0.3,
                  animationDelay: `${(i % 6) * 0.12}s`,
                  flexShrink: 0,
                  transition: "background 0.08s ease, opacity 0.08s ease",
                }}
              />
            );
          })}
        </div>

        {/* Progress */}
        <div style={{ height: "2px", background: "var(--lp-border)", borderRadius: "1px", marginBottom: "14px" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--lp-amber)", borderRadius: "1px", transition: "width 0.9s linear" }} />
        </div>

        {/* Transport */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-syne)", fontSize: "11px", color: "var(--lp-text-3)" }}>{minutes}:{seconds}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button type="button" style={{ color: "var(--lp-text-3)", lineHeight: 0 }} aria-label="Skip back">
              <SkipBack size={15} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Play"
              style={{
                width: "42px", height: "42px", borderRadius: "50%",
                background: "var(--lp-amber)", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#fff", flexShrink: 0,
              }}
            >
              <Play size={16} fill="currentColor" />
            </button>
            <button type="button" style={{ color: "var(--lp-text-3)", lineHeight: 0 }} aria-label="Skip forward">
              <SkipForward size={15} strokeWidth={1.75} />
            </button>
          </div>
          <span style={{ fontFamily: "var(--font-syne)", fontSize: "11px", color: "var(--lp-text-3)" }}>18:00</span>
        </div>
      </div>
    </div>
  );
}
