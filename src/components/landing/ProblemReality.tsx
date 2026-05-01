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
    <section
      ref={sectionRef}
      style={{
        background: "var(--lp-surface)",
        borderTop: "1px solid var(--lp-border)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <motion.div style={{ y: statsY }}>
          <Reveal>
            <p
              className="uppercase"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "var(--lp-amber)",
                marginBottom: "20px",
              }}
            >
              The Reality
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {realityStats.map((item) => (
                <article
                  key={item.value}
                  style={{
                    border: "1px solid var(--lp-border)",
                    borderRadius: "14px",
                    background: "var(--lp-surface-2)",
                    padding: "20px 22px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(2rem, 4vw, 2.8rem)",
                      fontWeight: 800,
                      color: "var(--lp-amber)",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.value}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "13px",
                      lineHeight: "1.6",
                      color: "var(--lp-text-2)",
                      marginTop: "8px",
                    }}
                  >
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </Reveal>
        </motion.div>

        <motion.div style={{ y: textY }}>
          <Reveal delay={0.08}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.2vw, 3.2rem)",
                fontWeight: 800,
                lineHeight: "1.05",
                letterSpacing: "-0.02em",
                color: "var(--lp-text-1)",
                maxWidth: "26ch",
                marginBottom: "20px",
              }}
            >
              Nigerian students are reading more and{" "}
              <em style={{ fontStyle: "italic", color: "var(--lp-amber)" }}>retaining less.</em>
            </h2>

            {[
              "Between long commutes, noisy hostels, shared reading spaces, and the sheer volume of course material, the traditional sit down and read method is failing most undergraduates.",
              "Not because students are not trying. Because the tools available were not built for how we actually live.",
              "Apps like NotebookLM exist, but they were built for a different context. The voices are foreign. The accents are unfamiliar. When something sounds distant, your brain switches off faster.",
            ].map((para, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "15px",
                  lineHeight: "1.75",
                  color: "var(--lp-text-2)",
                  marginBottom: i < 2 ? "16px" : "24px",
                }}
              >
                {para}
              </p>
            ))}

            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: "1.6",
                color: "var(--lp-text-1)",
                borderLeft: "3px solid var(--lp-amber)",
                paddingLeft: "16px",
              }}
            >
              JackPal is built differently, for the Nigerian student experience, from the ground up.
            </p>
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}
