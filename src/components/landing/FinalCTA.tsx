"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { BrandLogo } from "./BrandLogo";

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });

  const textY = useTransform(smooth, [0, 0.5, 1], [36, 0, -24]);
  const textOpacity = useTransform(smooth, [0, 0.15, 0.8, 1], [0.35, 1, 1, 0.7]);

  const orbScale = useTransform(smooth, [0, 0.5, 1], [0.9, 1.05, 1.15]);
  const orbRotate = useTransform(smooth, [0, 1], [-8, 10]);
  const ringRotate = useTransform(smooth, [0, 1], [0, 50]);
  const ringRotateReverse = useTransform(smooth, [0, 1], [0, -65]);
  const glowOpacity = useTransform(smooth, [0, 0.5, 1], [0.35, 0.65, 0.45]);

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      className="relative overflow-hidden border-y border-white/10 bg-[#020A2A] py-16 sm:py-24"
    >
      <motion.div
        style={{ opacity: glowOpacity }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_30%,rgba(57,197,255,0.22),transparent_34%),radial-gradient(circle_at_84%_58%,rgba(64,113,255,0.24),transparent_36%)]"
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
        <motion.div style={{ y: textY, opacity: textOpacity }}>
          <h2 className="max-w-[20ch] text-[clamp(2rem,4.4vw,3.6rem)] leading-tight text-white">
            Your next exam deserves better than <span className="text-[#3ABEFF]">all-night reading sessions.</span>
          </h2>
          <p className="mt-5 max-w-[54ch] text-sm leading-relaxed text-[#C8DCFF] sm:text-base">
            Join thousands of Nigerian students already on the waitlist.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#2F7CFF] to-[#37C2FF] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(52,148,255,0.45)] transition hover:brightness-110"
            >
              Join the Waitlist
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#345EBF] bg-[#081F66]/80 px-6 text-sm font-semibold text-[#E8F2FF] transition hover:bg-[#0E307E]"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        <motion.div style={{ scale: orbScale, rotate: orbRotate }} className="relative mx-auto w-full max-w-[470px]">
          <div className="relative flex h-[280px] w-full items-center justify-center overflow-hidden rounded-[34px] border border-[#2C4FA4] bg-gradient-to-b from-[#0A2C84] via-[#08256F] to-[#051A57] p-7 shadow-[0_28px_62px_rgba(0,0,0,0.45)] sm:h-[340px] sm:p-8">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[#49D8FF]/45 blur-3xl" />
            <div className="absolute -left-6 bottom-8 h-24 w-24 rounded-full bg-[#2F6FFF]/40 blur-3xl" />

            <motion.div style={{ rotate: ringRotate }} className="absolute h-56 w-56 rounded-full border border-[#68CDFD]/35" />
            <motion.div
              style={{ rotate: ringRotateReverse }}
              className="absolute h-44 w-44 rounded-full border border-[#6EA8FF]/30"
            />

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="relative z-10 flex h-40 w-40 animate-float-slow items-center justify-center rounded-[40px] border border-[#7FD7FF]/65 bg-[linear-gradient(160deg,#1F5ED6_0%,#1A9EED_100%)] shadow-[0_0_46px_rgba(92,200,255,0.45)] sm:h-48 sm:w-48"
            >
              <BrandLogo className="h-24 w-24 sm:h-28 sm:w-28" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
