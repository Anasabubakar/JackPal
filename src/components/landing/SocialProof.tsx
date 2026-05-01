"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";
import { Reveal } from "./Reveal";
import { testimonials } from "./data";

export function SocialProof() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });
  const headingY = useTransform(smooth, [0, 1], [24, -18]);

  return (
    <section
      ref={sectionRef}
      style={{
        background: "var(--lp-bg)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
      }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <motion.div style={{ y: headingY }}>
          <Reveal>
            <p
              className="uppercase"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "var(--lp-amber)",
                marginBottom: "16px",
              }}
            >
              First Reactions
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.4vw, 3.2rem)",
                fontWeight: 800,
                lineHeight: "1.02",
                letterSpacing: "-0.02em",
                color: "var(--lp-text-1)",
                maxWidth: "26ch",
                marginBottom: "40px",
              }}
            >
              What students said when we showed them a demo
            </h2>
          </Reveal>
        </motion.div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 0.07} className="min-w-[84%] snap-start sm:min-w-[67%] lg:min-w-0">
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                style={{
                  height: "100%",
                  border: "1px solid var(--lp-border)",
                  borderRadius: "16px",
                  background: "var(--lp-surface)",
                  padding: "24px",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(212, 148, 10, 0.35)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--lp-border)")}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "3px", color: "var(--lp-amber)" }}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={`${item.name}-${idx}`} style={{ fontSize: "14px" }}>★</span>
                    ))}
                  </div>
                  <Quote
                    style={{ width: "16px", height: "16px", color: "var(--lp-text-3)" }}
                    strokeWidth={1.5}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "15px",
                    lineHeight: "1.7",
                    color: "var(--lp-text-2)",
                    marginBottom: "20px",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--lp-text-1)",
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "11px",
                    color: "var(--lp-text-3)",
                    marginTop: "3px",
                  }}
                >
                  {item.meta}
                </p>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
