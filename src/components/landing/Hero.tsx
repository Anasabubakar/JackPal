"use client";

import { useState, useEffect } from "react";
import { Play, SkipBack, SkipForward } from "lucide-react";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";

const VOICES = ["Adaora", "Zainab", "Nonso", "Jude"];
const PROGRESS_PATH =
  "M4 24 C10 24 12 17 18 24 S28 31 34 24 S44 17 50 24 S60 31 66 24 S76 17 82 24 S92 31 98 24 S108 17 114 24 S124 31 130 24 S140 17 146 24 S156 31 162 24 S172 17 178 24 S188 31 194 24 S204 17 210 24 S220 31 226 24 L516 24";

function AppMockup() {
  const [progress, setProgress] = useState(22);
  const [activeVoice, setActiveVoice] = useState("Adaora");
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.25)), 100);
    return () => clearInterval(t);
  }, [playing]);

  const totalSecs = Math.floor((progress / 100) * 18 * 60);
  const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
  const secs = String(totalSecs % 60).padStart(2, "0");

  return (
    <div
      style={{
        background: "#0D1635",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "24px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
        <JackpalsLogo variant="mark" className="h-9 w-9 shrink-0 object-contain" alt="" />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-syne)" }}>
            Ecology 101 — Chapter 4
          </div>
          <div style={{ fontSize: "11px", color: "#8B9BB4", fontFamily: "var(--font-syne)", marginTop: "2px" }}>
            PDF · 12 pages · 18 min
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: "18px" }}>
        <div className="jp-audio-progress" style={{ margin: "26px 0 14px" }}>
          <div className="jp-audio-wave-rail">
            <svg viewBox="0 0 520 48" aria-hidden="true" preserveAspectRatio="none">
              <path d={PROGRESS_PATH} pathLength={100} />
            </svg>
            <div className="jp-audio-wave-fill" style={{ width: `${progress}%` }}>
              <svg viewBox="0 0 520 48" aria-hidden="true" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="jp-progress-gradient-hero" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#2d6bff" />
                    <stop offset="38%" stopColor="#0095ff" />
                    <stop offset="72%" stopColor="#24d4f5" />
                    <stop offset="100%" stopColor="#9dfbff" />
                  </linearGradient>
                </defs>
                <path d={PROGRESS_PATH} pathLength={100} stroke="url(#jp-progress-gradient-hero)" />
              </svg>
            </div>
            <span className="jp-audio-wave-thumb" style={{ left: `${progress}%` }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "11px", color: "#8B9BB4", fontFamily: "var(--font-syne)" }}>{mins}:{secs}</span>
          <span style={{ fontSize: "11px", color: "#8B9BB4", fontFamily: "var(--font-syne)" }}>18:00</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginBottom: "22px" }}>
        <button
          onClick={() => setProgress((p) => Math.max(0, p - 10))}
          style={{ border: "none", background: "none", color: "#8B9BB4", cursor: "pointer", padding: "6px", display: "flex" }}
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={() => setPlaying((v) => !v)}
          style={{
            width: "46px", height: "46px", borderRadius: "50%",
            background: "#1B6EF3", border: "none", color: "white",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(27,110,243,0.45)", flexShrink: 0,
          }}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <rect x="2" y="1" width="4" height="12" rx="1" />
              <rect x="8" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <Play size={16} fill="white" style={{ marginLeft: "2px" }} />
          )}
        </button>
        <button
          onClick={() => setProgress((p) => Math.min(100, p + 10))}
          style={{ border: "none", background: "none", color: "#8B9BB4", cursor: "pointer", padding: "6px", display: "flex" }}
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Voice tabs */}
      <div style={{ display: "flex", gap: "6px" }}>
        {VOICES.map((v) => (
          <button
            key={v}
            onClick={() => setActiveVoice(v)}
            style={{
              flex: 1, height: "32px", borderRadius: "6px",
              border: activeVoice === v ? "1px solid #1B6EF3" : "1px solid rgba(255,255,255,0.08)",
              background: activeVoice === v ? "rgba(27,110,243,0.15)" : "transparent",
              color: activeVoice === v ? "#6BAAFF" : "#8B9BB4",
              fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-syne)",
              cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.02em",
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section style={{ background: "#060C22", padding: "96px 0 80px" }}>
      <div className="lp-hero-grid section-container" style={{ display: "grid" }}>
        {/* Left */}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4.5vw, 54px)",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.18,
              letterSpacing: "-0.025em",
              marginBottom: "24px",
            }}
          >
            Your textbooks, read out loud, in a voice that sounds{" "}
            <span style={{ color: "#1B6EF3" }}>like home.</span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "16px",
              color: "#8B9BB4",
              lineHeight: 1.75,
              marginBottom: "40px",
              maxWidth: "480px",
            }}
          >
            JackPals converts any document, PDF, or file into high-quality audio
            narrated by Nigerian AI voices. Study on a commute, between classes,
            or anywhere life takes you — without staring at a screen.
          </p>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <a
              href="#pricing"
              style={{
                display: "inline-flex", alignItems: "center",
                height: "52px", padding: "0 32px", borderRadius: "10px",
                background: "#F5A623", color: "#FFFFFF",
                fontFamily: "var(--font-syne)", fontSize: "14px", fontWeight: 700,
                textDecoration: "none", transition: "filter 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            >
              Join the Waitlist
            </a>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex", alignItems: "center",
                height: "52px", padding: "0 24px", borderRadius: "10px",
                background: "transparent", color: "#FFFFFF",
                fontFamily: "var(--font-syne)", fontSize: "14px", fontWeight: 500,
                textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)",
                transition: "border-color 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
            >
              See How It Works →
            </a>
          </div>
        </div>

        {/* Right — mockup */}
        <div
          className="lp-hero-mockup"
          style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <AppMockup />
        </div>
      </div>
    </section>
  );
}
