"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "./Reveal";
import { realityStats } from "./data";

export function ProblemReality() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.25 });

  const statsY = useTransform(smooth, [0, 1], [30, -30]);
  const textY = useTransform(smooth, [0, 1], [40, -25]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#031144] py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(67,195,255,0.18),transparent_40%)]" />
      <div className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <motion.div style={{ y: statsY }}>
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#7BC8FF]">THE REALITY</p>
            <div className="mt-5 space-y-4">
              {realityStats.map((item) => (
                <article key={item.value} className="rounded-2xl border border-[#2A458D] bg-[#0A2467]/70 p-4">
                  <p className="text-3xl font-bold text-[#57CBFF] sm:text-4xl">{item.value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#D5E5FF]">{item.text}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </motion.div>

        <motion.div style={{ y: textY }}>
          <Reveal delay={0.08}>
            <h2 className="max-w-[26ch] text-[clamp(1.9rem,4vw,3rem)] leading-tight text-white">
              Nigerian students are reading more and <span className="text-[#3CC0FF]">retaining less.</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#CBDDFF] sm:text-base">
              Between long commutes, noisy hostels, shared reading spaces, and the sheer volume of course material, the traditional sit
              down and read method is failing most undergraduates.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#CBDDFF] sm:text-base">
              Not because students are not trying. Because the tools available were not built for how we actually live.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#CBDDFF] sm:text-base">
              Apps like NotebookLM exist, but they were built for a different context. The voices are foreign. The accents are unfamiliar.
              When something sounds distant, your brain switches off faster.
            </p>

            <p className="mt-6 rounded-2xl border border-[#3A67C9] bg-[#0A266E] p-4 text-sm font-semibold text-[#E7F0FF] sm:text-base">
              Jackpals is built differently for the Nigerian student experience, from the ground up.
            </p>
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}
