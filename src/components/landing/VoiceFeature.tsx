"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, CheckCircle2 } from "lucide-react";
import { voiceBullets } from "./data";

const VOICE_LIST = [
  { name: "Adaora", gender: "Female", src: "/audio/adaora_yarngpt.mp3" },
  { name: "Zainab", gender: "Female", src: "/audio/zainab_yarngpt.mp3" },
  { name: "Nonso",  gender: "Male",   src: "/audio/nonso_yarngpt.mp3"  },
  { name: "Jude",   gender: "Male",   src: "/audio/jude_yarngpt.mp3"   },
];

const PROGRESS_PATH =
  "M4 24 C10 24 12 17 18 24 S28 31 34 24 S44 17 50 24 S60 31 66 24 S76 17 82 24 S92 31 98 24 S108 17 114 24 S124 31 130 24 S140 17 146 24 S156 31 162 24 S172 17 178 24 S188 31 194 24 S204 17 210 24 S220 31 226 24 L516 24";

function VoiceCard({
  voice,
  active,
  playing,
  onSelect,
}: {
  voice: typeof VOICE_LIST[0];
  active: boolean;
  playing: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 16px",
        borderRadius: "12px",
        border: active ? "1px solid rgba(27,110,243,0.4)" : "1px solid rgba(255,255,255,0.06)",
        background: active ? "rgba(27,110,243,0.12)" : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: active
            ? "linear-gradient(135deg, #1B6EF3, #4F9CF9)"
            : "linear-gradient(135deg, #1C2E55, #253A6E)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "15px",
          fontWeight: 700,
          color: "white",
          fontFamily: "var(--font-syne)",
        }}
      >
        {voice.name[0]}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-syne)", fontSize: "14px", fontWeight: 700, color: active ? "#FFFFFF" : "#C9D6E8" }}>
          {voice.name}
        </div>
        <div style={{ fontFamily: "var(--font-syne)", fontSize: "12px", color: "#8B9BB4", marginTop: "2px" }}>
          {voice.gender} · Nigerian AI
        </div>
      </div>

      {/* Waveform / playing indicator */}
      {active && playing ? (
        <div
          style={{
            width: "42px",
            height: "8px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.12)",
            overflow: "hidden",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "inherit",
              background: "linear-gradient(90deg, #1B6EF3 0%, #61E3F0 100%)",
              boxShadow: "0 0 12px rgba(97,227,240,0.45)",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: active ? "#1B6EF3" : "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Play size={11} fill={active ? "white" : "#8B9BB4"} color={active ? "white" : "#8B9BB4"} style={{ marginLeft: "1px" }} />
        </div>
      )}
    </button>
  );
}

export function VoiceFeature() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(VOICE_LIST[activeIdx].src);
    audioRef.current = audio;
    audio.addEventListener("timeupdate", () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    });
    audio.addEventListener("ended", () => { setPlaying(false); setProgress(0); });
    return () => { audio.pause(); audio.src = ""; };
  }, [activeIdx]);

  function selectVoice(i: number) {
    audioRef.current?.pause();
    setPlaying(false);
    setProgress(0);
    setActiveIdx(i);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().catch(() => {}); setPlaying(true); }
  }

  return (
    <section id="voices" style={{ background: "#060C22", padding: "96px 0" }}>
      <div className="section-container">
        <div className="lp-two-col" style={{ display: "grid" }}>
          {/* Left — voice player */}
          <div>
            <div
              style={{
                background: "#0D1635",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "28px",
              }}
            >
              {/* Progress */}
              <div className="jp-audio-progress" style={{ margin: "0 0 24px" }}>
                <div className="jp-audio-wave-rail">
                  <svg viewBox="0 0 520 48" aria-hidden="true" preserveAspectRatio="none">
                    <path d={PROGRESS_PATH} pathLength={100} />
                  </svg>
                  <div className="jp-audio-wave-fill" style={{ width: `${progress}%` }}>
                    <svg viewBox="0 0 520 48" aria-hidden="true" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="jp-progress-gradient-voice" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#2d6bff" />
                          <stop offset="38%" stopColor="#0095ff" />
                          <stop offset="72%" stopColor="#24d4f5" />
                          <stop offset="100%" stopColor="#9dfbff" />
                        </linearGradient>
                      </defs>
                      <path d={PROGRESS_PATH} pathLength={100} stroke="url(#jp-progress-gradient-voice)" />
                    </svg>
                  </div>
                  <span className="jp-audio-wave-thumb" style={{ left: `${progress}%` }} />
                </div>
              </div>

              {/* Play button */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <button
                  onClick={togglePlay}
                  style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: "#1B6EF3", border: "none", color: "white",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 20px rgba(27,110,243,0.45)",
                  }}
                >
                  {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: "2px" }} />}
                </button>
              </div>

              {/* Voice list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {VOICE_LIST.map((v, i) => (
                  <VoiceCard
                    key={v.name}
                    voice={v}
                    active={i === activeIdx}
                    playing={playing && i === activeIdx}
                    onSelect={() => selectVoice(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right — copy */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3.5vw, 42px)",
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.2,
                letterSpacing: "-0.025em",
                marginBottom: "32px",
              }}
            >
              Voices that actually sound like{" "}
              <span style={{ color: "#1B6EF3", textDecoration: "underline", textDecorationColor: "rgba(27,110,243,0.4)", textUnderlineOffset: "6px" }}>you</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {voiceBullets.map((bullet, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <CheckCircle2
                    size={20}
                    color="#1B6EF3"
                    strokeWidth={2}
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  />
                  <p style={{ fontFamily: "var(--font-syne)", fontSize: "15px", color: "#8B9BB4", lineHeight: 1.65 }}>
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
