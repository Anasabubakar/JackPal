"use client";

import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Reveal } from "./Reveal";
import { voiceBullets } from "./data";

const NUM_BARS = 36;
const SPEECH_RHYTHM = [0.3, 0.5, 0.9, 1.0, 0.8, 0.6, 0.4, 0.7, 1.0, 0.9, 0.5, 0.3, 0.2, 0.4, 0.8, 1.0, 0.7, 0.5];

function LiveFreqVisualizer() {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: NUM_BARS }, () => 4));
  const phaseRef = useRef(0);

  const tick = useCallback(() => {
    phaseRef.current = (phaseRef.current + 1) % SPEECH_RHYTHM.length;
    const energy = SPEECH_RHYTHM[phaseRef.current];
    setHeights(prev => prev.map((_, i) => {
      const center = NUM_BARS / 2;
      const dist = Math.abs(i - center) / center;
      const envelope = 1 - dist * 0.6;
      const rand = 0.4 + Math.random() * 0.6;
      const target = 4 + energy * envelope * rand * 52;
      return prev[i] + (target - prev[i]) * 0.28;
    }));
  }, []);

  useEffect(() => {
    const id = setInterval(tick, 75);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div
      style={{
        border: "1px solid var(--lp-border)",
        borderRadius: "16px",
        background: "var(--lp-surface)",
        padding: "28px 24px 20px",
        boxShadow: "var(--lp-shadow-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <span
          style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--lp-amber)",
            animation: "pulse-ring 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite",
            display: "inline-block",
          }}
        />
        <span style={{ fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", color: "var(--lp-text-3)" }}>
          LIVE AUDIO · Nigerian Voice
        </span>
      </div>

      {/* Bars */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          height: "64px",
          justifyContent: "center",
        }}
      >
        {heights.map((h, i) => (
          <motion.span
            key={i}
            animate={{ height: `${h}px` }}
            transition={{ duration: 0.08, ease: "easeOut" }}
            style={{
              width: "3px",
              borderRadius: "3px",
              background: `color-mix(in srgb, var(--lp-amber) ${60 + (h / 60) * 40}%, var(--lp-amber-bright))`,
              opacity: 0.5 + (h / 60) * 0.5,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      <p style={{
        fontFamily: "var(--font-syne)", fontSize: "11px",
        color: "var(--lp-text-3)", marginTop: "14px", textAlign: "center",
        letterSpacing: "0.04em",
      }}>
        "...the mitochondria is the powerhouse of the cell..."
      </p>
    </div>
  );
}

export function VoiceFeature() {
  return (
    <section
      id="voices"
      style={{
        background: "var(--lp-bg)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
      }}
    >
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">

        <Reveal>
          <LiveFreqVisualizer />
        </Reveal>

        <Reveal delay={0.08}>
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.22em", color: "var(--lp-amber)", marginBottom: "16px",
            }}
          >
            Nigerian Voices
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4.2vw, 3.2rem)",
              fontWeight: 800, lineHeight: "1.02", letterSpacing: "-0.02em",
              color: "var(--lp-text-1)", maxWidth: "22ch", marginBottom: "20px",
            }}
          >
            Voices that actually sound like{" "}
            <em style={{ fontStyle: "italic", color: "var(--lp-amber)" }}>you.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-syne)", fontSize: "15px", lineHeight: "1.75",
              color: "var(--lp-text-2)", marginBottom: "24px", maxWidth: "48ch",
            }}
          >
            Our Nigerian AI voices carry rhythm, warmth, and familiarity. When you hear something that sounds like home, your brain stays present.
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {voiceBullets.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  border: "1px solid var(--lp-border)", borderRadius: "10px",
                  background: "var(--lp-surface)", padding: "12px 14px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex", width: "20px", height: "20px",
                    borderRadius: "50%", background: "var(--lp-amber-dim)",
                    border: "1px solid rgba(44,123,229,0.3)",
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px", color: "var(--lp-amber)",
                  }}
                >
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <span style={{ fontFamily: "var(--font-syne)", fontSize: "13px", lineHeight: "1.6", color: "var(--lp-text-2)" }}>
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        </Reveal>

      </div>
    </section>
  );
}
