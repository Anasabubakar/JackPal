"use client";

import { Fragment } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "./Reveal";
import { steps } from "./data";

function StepConnector({ delay }: { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div
      ref={ref}
      className="hidden md:flex items-center justify-center"
      style={{ flex: "0 0 auto", width: "48px", marginTop: "-20px" }}
    >
      <svg width="48" height="20" viewBox="0 0 48 20" fill="none" overflow="visible">
        <motion.line
          x1="0" y1="10" x2="48" y2="10"
          stroke="var(--lp-amber)"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 0.5 } : {}}
          transition={{ duration: 0.6, delay, ease: "easeOut" }}
        />
        <motion.polygon
          points="44,6 48,10 44,14"
          fill="var(--lp-amber)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.5 } : {}}
          transition={{ duration: 0.2, delay: delay + 0.5 }}
        />
      </svg>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "var(--lp-bg)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.22em", color: "var(--lp-amber)", marginBottom: "16px",
            }}
          >
            Simple by Design
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4.2vw, 3.2rem)",
              fontWeight: 800, lineHeight: "1.02", letterSpacing: "-0.02em",
              color: "var(--lp-text-1)", maxWidth: "22ch", marginBottom: "40px",
            }}
          >
            Three steps to a smarter study session.
          </h2>
        </Reveal>

        {/* Desktop: steps + connectors in a row */}
        <div className="hidden md:flex items-stretch gap-0">
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              <Reveal delay={index * 0.1} className="flex-1">
                <article
                  style={{
                    border: "1px solid var(--lp-border)", borderRadius: "16px",
                    background: "var(--lp-surface)", padding: "24px 26px",
                    height: "100%", transition: "border-color 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--lp-amber)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--lp-border)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  <p style={{
                    fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 700,
                    letterSpacing: "0.18em", color: "var(--lp-amber)", marginBottom: "14px",
                  }}>
                    {step.id}
                  </p>
                  <h3 style={{
                    fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700,
                    lineHeight: "1.1", color: "var(--lp-text-1)", marginBottom: "12px",
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-syne)", fontSize: "13px",
                    lineHeight: "1.7", color: "var(--lp-text-2)",
                  }}>
                    {step.description}
                  </p>
                </article>
              </Reveal>
              {index < steps.length - 1 && <StepConnector delay={0.2 + index * 0.15} />}
            </Fragment>
          ))}
        </div>

        {/* Mobile: stacked */}
        <div className="flex flex-col gap-4 md:hidden">
          {steps.map((step, index) => (
            <Reveal key={step.id} delay={index * 0.07}>
              <article
                style={{
                  border: "1px solid var(--lp-border)", borderRadius: "16px",
                  background: "var(--lp-surface)", padding: "24px 26px",
                }}
              >
                <p style={{
                  fontFamily: "var(--font-syne)", fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.18em", color: "var(--lp-amber)", marginBottom: "14px",
                }}>
                  {step.id}
                </p>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700,
                  lineHeight: "1.1", color: "var(--lp-text-1)", marginBottom: "12px",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: "var(--font-syne)", fontSize: "13px",
                  lineHeight: "1.7", color: "var(--lp-text-2)",
                }}>
                  {step.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
