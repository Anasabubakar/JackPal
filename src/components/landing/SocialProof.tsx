"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
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
                marginBottom: "48px",
              }}
            >
              What students said when we showed them a demo
            </h2>
          </Reveal>
        </motion.div>

        <div className="grid gap-0 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 0.09}>
              <article
                style={{
                  padding: "28px 0",
                  paddingRight: "32px",
                  borderTop: `2px solid ${index === 0 ? "var(--lp-amber)" : "var(--lp-border)"}`,
                  height: "100%",
                }}
              >
                {/* Decorative quote mark */}
                <p
                  aria-hidden
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "72px",
                    lineHeight: 0.8,
                    letterSpacing: "-0.04em",
                    color: "var(--lp-amber)",
                    opacity: index === 0 ? 0.55 : 0.18,
                    marginBottom: "14px",
                    userSelect: "none",
                  }}
                >
                  &ldquo;
                </p>

                {/* Quote text */}
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(15px, 1.8vw, 17px)",
                    lineHeight: "1.6",
                    color: "var(--lp-text-1)",
                    marginBottom: "24px",
                  }}
                >
                  {item.quote}
                </p>

                {/* Attribution */}
                <div style={{ marginTop: "auto" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: index === 0 ? "var(--lp-amber)" : "var(--lp-text-1)",
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
                      letterSpacing: "0.03em",
                    }}
                  >
                    {item.meta}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
