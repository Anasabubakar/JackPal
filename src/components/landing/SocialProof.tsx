"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";
import { Reveal } from "./Reveal";
import { testimonials } from "./data";

export function SocialProof() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });
  const headingY = useTransform(smooth, [0, 1], [24, -18]);

  return (
    <section ref={sectionRef} className="bg-[#F4F8FF] py-16 text-[#102349] sm:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <motion.div style={{ y: headingY }}>
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#2A73ED]">REAL ACTION</p>
            <h2 className="mt-3 max-w-[22ch] text-[clamp(1.9rem,4.4vw,3.1rem)] leading-tight">
              What students said when we showed them a demo
            </h2>
          </Reveal>
        </motion.div>

        <div className="mt-9 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 0.07} className="min-w-[84%] snap-start sm:min-w-[67%] lg:min-w-0">
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="h-full rounded-3xl border border-[#D7E4FA] bg-white p-6 shadow-[0_12px_24px_rgba(20,43,90,0.08)] transition hover:shadow-[0_22px_40px_rgba(20,43,90,0.14)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-[#F6B644]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={`${item.name}-${idx}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="h-5 w-5 text-[#2A73ED]" />
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-[#2A3F66]">{item.quote}</p>
                <p className="mt-5 text-sm font-semibold text-[#0F2A57]">{item.name}</p>
                <p className="mt-1 text-xs text-[#5B729C]">{item.meta}</p>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
