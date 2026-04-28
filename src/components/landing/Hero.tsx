"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { AudioPlayerMock } from "./AudioPlayerMock";
import { Reveal } from "./Reveal";

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 130, damping: 26, mass: 0.25 });
  const leftY = useTransform(smooth, [0, 1], [0, 50]);
  const rightY = useTransform(smooth, [0, 1], [0, -45]);
  const glowScale = useTransform(smooth, [0, 1], [1, 1.25]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-b border-white/10">
      <motion.div
        style={{ scale: glowScale }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(60,183,255,0.28),transparent_36%),radial-gradient(circle_at_85%_12%,rgba(52,96,255,0.24),transparent_35%),linear-gradient(180deg,#020A2A_0%,#03114A_58%,#020A2A_100%)]"
      />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-24">
        <motion.div style={{ y: leftY }}>
          <Reveal>
            <p className="inline-flex rounded-full border border-[#2D5FC5]/90 bg-[#0B2371]/80 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#A8D4FF]">
              Built for Nigerian students
            </p>
            <h1 className="mt-6 max-w-[16ch] text-[clamp(2rem,8.5vw,4.6rem)] font-bold leading-[0.96] tracking-[-0.02em] text-white">
              Your textbooks, read out loud, in a <span className="text-[#35B9FF]">voice that sounds like home.</span>
            </h1>
            <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-[#D1E3FF] sm:text-lg">
              Jackpals converts any document, PDF, or link into high-quality audio narrated by Nigerian AI voices. Study on a commute,
              between classes, or anywhere your life takes you without staring at a screen.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#final-cta"
                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#2F7CFF] to-[#35C5FF] px-6 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(41,137,255,0.45)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Join the Waitlist
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#3159B8] bg-[#081E63]/80 px-6 text-sm font-semibold text-[#E8F2FF] transition hover:bg-[#0D2D82]"
              >
                See How It Works
              </a>
            </div>

            <p className="mt-5 text-xs text-[#88A9E5]">Launching Q2 2026 · ₦1,000/month after launch · No card required</p>
          </Reveal>
        </motion.div>

        <motion.div style={{ y: rightY }}>
          <Reveal delay={0.1} className="w-full">
            <AudioPlayerMock showMascot large={false} />
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}
