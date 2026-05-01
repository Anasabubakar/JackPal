"use client";

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { AudioProgress } from "@/components/AudioProgress";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { AUDIO_PREVIEW_VOICES, type AudioPreviewVoice } from "@/lib/audioPreviews";

const VOICE_LIST = AUDIO_PREVIEW_VOICES;

function VoiceCard({
  voice,
  active,
  playing,
  onSelect,
}: {
  voice: AudioPreviewVoice;
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
          {playing ? "Playing now" : `${voice.gender} · Nigerian AI`}
        </div>
      </div>
    </button>
  );
}

export function VoiceFeature() {
  const {
    playVoice,
    togglePlay,
    isPlaying,
    activeVoice,
    activeSrc,
    skipBy,
    playbackRate,
    cyclePlaybackRate,
  } = useAudioPlayer();
  const selectedVoice = VOICE_LIST.find((voice) => voice.name === activeVoice) ?? VOICE_LIST[0];
  const isCurrentPreview = activeSrc === selectedVoice.src;

  const handleToggle = () => {
    if (isCurrentPreview) {
      togglePlay();
      return;
    }
    playVoice(selectedVoice.name, selectedVoice.src);
  };

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
              <AudioProgress label={selectedVoice.name} />

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <button
                  onClick={() => skipBy(-10)}
                  aria-label="Skip voice preview back 10 seconds"
                  style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B9BB4",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <SkipBack size={17} />
                </button>
                <button
                  onClick={handleToggle}
                  style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: "#1B6EF3", border: "none", color: "white",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 20px rgba(27,110,243,0.45)",
                  }}
                >
                  {isCurrentPreview && isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: "2px" }} />}
                </button>
                <button
                  onClick={() => skipBy(10)}
                  aria-label="Skip voice preview forward 10 seconds"
                  style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B9BB4",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <SkipForward size={17} />
                </button>
                <button
                  onClick={cyclePlaybackRate}
                  aria-label="Change voice preview speed"
                  style={{
                    height: "34px", minWidth: "52px", borderRadius: "999px",
                    background: "rgba(27,110,243,0.12)", border: "1px solid rgba(27,110,243,0.24)", color: "#6BAAFF",
                    cursor: "pointer", fontSize: "12px", fontWeight: 700,
                  }}
                >
                  {playbackRate}x
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {VOICE_LIST.map((v) => (
                  <VoiceCard
                    key={v.name}
                    voice={v}
                    active={v.name === selectedVoice.name}
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
