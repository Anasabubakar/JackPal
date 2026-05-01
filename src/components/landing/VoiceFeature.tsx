"use client";

import { CheckCircle2, Play, Pause } from "lucide-react";
import { voiceBullets } from "./data";
import { AudioProgress } from "@/components/AudioProgress";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";

const VOICE_LIST = [
  { name: "Adaora", gender: "Female", src: "/audio/adaora_yarngpt.mp3" },
  { name: "Zainab", gender: "Female", src: "/audio/zainab_yarngpt.mp3" },
  { name: "Nonso",  gender: "Male",   src: "/audio/nonso_yarngpt.mp3"  },
  { name: "Jude",   gender: "Male",   src: "/audio/jude_yarngpt.mp3"   },
];

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
        }}
      >
        {voice.name[0]}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: active ? "#FFFFFF" : "#C9D6E8" }}>
          {voice.name}
        </div>
        <div style={{ fontSize: "12px", color: "#8B9BB4", marginTop: "2px" }}>
          {voice.gender} · Nigerian AI
        </div>
      </div>
    </button>
  );
}

export function VoiceFeature() {
  const { playVoice, togglePlay, isPlaying, activeVoice } = useAudioPlayer();
  const activeIdx = VOICE_LIST.findIndex(v => v.name === activeVoice) === -1 ? 0 : VOICE_LIST.findIndex(v => v.name === activeVoice);

  return (
    <section id="voices" style={{ background: "#060C22", padding: "96px 0" }}>
      <div className="section-container">
        <div className="lp-two-col" style={{ display: "grid" }}>
          <div>
            <div
              style={{
                background: "#0D1635",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "28px",
              }}
            >
              <AudioProgress label={activeVoice || VOICE_LIST[0].name} />

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
                  {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: "2px" }} />}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {VOICE_LIST.map((v) => (
                  <VoiceCard
                    key={v.name}
                    voice={v}
                    active={v.name === activeVoice}
                    playing={isPlaying && v.name === activeVoice}
                    onSelect={() => playVoice(v.name, v.src)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
