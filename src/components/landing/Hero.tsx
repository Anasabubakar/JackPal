"use client";

import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { AudioPlayerMock } from "./AudioPlayerMock";
import { HeroWave } from "./HeroWave";

const PHRASES = ["Out loud.", "On the go.", "In Pidgin.", "Offline."];

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const ITEM = {
  hidden:  { opacity: 0, y: 22, filter: "blur(4px)" },
  show:    { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.55, ease: EASE } },
};

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const smooth   = useSpring(scrollYProgress, { stiffness: 130, damping: 26, mass: 0.25 });
  const leftY    = useTransform(smooth, [0, 1], [0, 45]);
  const rightY   = useTransform(smooth, [0, 1], [0, -35]);

  const [phraseIdx, setPhraseIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhraseIdx(i => (i + 1) % PHRASES.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: "var(--lp-bg)", borderBottom: "1px solid var(--lp-border)" }}
    >
      <HeroWave />

      {/* Top accent line */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{ background: "var(--lp-amber)", opacity: 0.3 }}
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">

        {/* Left column */}
        <motion.div style={{ y: leftY }}>
          <motion.div variants={STAGGER} initial="hidden" animate="show">

            <motion.p
              variants={ITEM}
              className="uppercase"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "var(--lp-amber)",
              }}
            >
              Audio Learning · Built for Nigerian Students
            </motion.p>

            <motion.h1 variants={ITEM} className="mt-4" style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3rem, 9vw, 5.4rem)",
              fontWeight: 800,
              lineHeight: "0.93",
              letterSpacing: "-0.025em",
              color: "var(--lp-text-1)",
            }}>
              Your lecture<br />
              notes.{" "}
              <AnimatePresence mode="wait" initial={false}>
                <motion.em
                  key={phraseIdx}
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                  exit={{    opacity: 0, y: -14, filter: "blur(8px)" }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  style={{ fontStyle: "italic", color: "var(--lp-amber)", display: "inline-block" }}
                >
                  {PHRASES[phraseIdx]}
                </motion.em>
              </AnimatePresence>
            </motion.h1>

            <motion.p variants={ITEM} className="mt-5" style={{
              fontFamily: "var(--font-syne)",
              fontSize: "15px",
              lineHeight: "1.75",
              color: "var(--lp-text-2)",
              maxWidth: "50ch",
            }}>
              JackPal converts any PDF, Word doc, or textbook into audio narrated by Nigerian AI voices that sound like home. Study on a commute, between lectures, anywhere.
            </motion.p>

            <motion.div variants={ITEM} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#final-cta"
                style={{
                  background: "var(--lp-amber)", color: "var(--lp-bg)",
                  fontFamily: "var(--font-syne)", fontSize: "13px", fontWeight: 700,
                  letterSpacing: "0.06em", borderRadius: "10px", height: "48px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "0 28px",
                }}
                className="w-full transition hover:brightness-110 sm:w-auto"
              >
                Join the Waitlist
              </a>
              <a
                href="#how-it-works"
                style={{
                  border: "1px solid var(--lp-border)", color: "var(--lp-text-1)",
                  fontFamily: "var(--font-syne)", fontSize: "13px", fontWeight: 600,
                  borderRadius: "10px", height: "48px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "0 28px", transition: "border-color 0.2s, color 0.2s",
                }}
                className="w-full sm:w-auto"
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--lp-amber)";
                  e.currentTarget.style.color = "var(--lp-amber)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--lp-border)";
                  e.currentTarget.style.color = "var(--lp-text-1)";
                }}
              >
                See How It Works
              </a>
            </motion.div>

            <motion.p variants={ITEM} className="mt-6" style={{
              fontFamily: "var(--font-syne)", fontSize: "11px",
              color: "var(--lp-text-3)", letterSpacing: "0.04em",
            }}>
              Students at UNILAG · OAU · LASU · UI · ABU · UNIBEN already on the list
            </motion.p>

          </motion.div>
        </motion.div>

        {/* Right column */}
        <motion.div
          style={{ y: rightY }}
          initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0,  scale: 1,    filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <AudioPlayerMock />
        </motion.div>

      </div>
    </section>
  );
}
