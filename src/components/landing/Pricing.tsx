"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Check, X } from "lucide-react";
import { Reveal } from "./Reveal";
import { freePlan, proPlan } from "./data";

export function Pricing() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 130, damping: 28, mass: 0.25 });

  const headingY = useTransform(smooth, [0, 1], [30, -20]);
  const cardsY = useTransform(smooth, [0, 1], [40, -35]);

  return (
    <section ref={sectionRef} id="pricing" className="relative overflow-hidden bg-[#020A2A] py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,146,255,0.18),transparent_40%)]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <motion.div style={{ y: headingY }}>
          <Reveal>
            <p className="text-center text-xs font-semibold tracking-[0.18em] text-[#87CBFF]">TRANSPARENT PRICING</p>
            <h2 className="mx-auto mt-3 max-w-[15ch] text-center text-[clamp(1.9rem,4.1vw,3rem)] leading-tight text-white">
              Start free. Upgrade when you are ready.
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-center text-sm leading-relaxed text-[#C6DBFF] sm:text-base">
              No hidden fees. No foreign currency. Priced for the Nigerian student.
            </p>
          </Reveal>
        </motion.div>

        <motion.div style={{ y: cardsY }} className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-2">
          <Reveal>
            <article className="h-full rounded-3xl border border-[#2E4D95] bg-[#071D60]/80 p-6 sm:p-7">
              <p className="text-sm font-semibold text-[#BFD8FF]">{freePlan.name}</p>
              <p className="mt-3 text-5xl font-bold leading-none text-white">{freePlan.price}</p>
              <p className="mt-2 text-sm text-[#ABCAFF]">{freePlan.meta}</p>

              <ul className="mt-6 space-y-2.5">
                {freePlan.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#E4EEFF]">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E7DFF] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <ul className="mt-5 space-y-2.5 border-t border-[#2B4D9B] pt-5">
                {freePlan.limited.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#A7C1EF]">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#3A5DA8] text-[#8AA5D8]">
                      <X className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#final-cta"
                className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full border border-[#3A63BB] bg-[#0A2A7A] text-sm font-semibold text-white transition hover:bg-[#11358F]"
              >
                {freePlan.cta}
              </a>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="relative h-full rounded-3xl border border-[#4A79DE] bg-gradient-to-b from-[#0D2E89] to-[#082067] p-6 shadow-[0_18px_50px_rgba(39,136,255,0.3)] sm:p-7">
              <span className="absolute right-5 top-5 rounded-full border border-[#83CFFF] bg-[#0E4AAA] px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[#DDF2FF]">
                {proPlan.badge}
              </span>
              <p className="text-sm font-semibold text-[#D8EAFF]">{proPlan.name}</p>
              <p className="mt-3 text-5xl font-bold leading-none text-white">{proPlan.price}</p>
              <p className="mt-2 text-sm text-[#CBE0FF]">{proPlan.meta}</p>

              <ul className="mt-6 space-y-2.5">
                {proPlan.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#ECF4FF]">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4AD2FF] text-[#053E79]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#final-cta"
                className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#35BEFF] to-[#2E78FF] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(56,178,255,0.38)] transition hover:brightness-110"
              >
                {proPlan.cta}
              </a>
            </article>
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}
