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
    <section
      ref={sectionRef}
      id="pricing"
      style={{
        background: "var(--lp-surface)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <motion.div style={{ y: headingY }}>
          <Reveal>
            <p
              className="text-center uppercase"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "var(--lp-amber)",
                marginBottom: "16px",
              }}
            >
              Transparent Pricing
            </p>
            <h2
              className="mx-auto text-center"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.2vw, 3.2rem)",
                fontWeight: 800,
                lineHeight: "1.02",
                letterSpacing: "-0.02em",
                color: "var(--lp-text-1)",
                maxWidth: "18ch",
                marginBottom: "12px",
              }}
            >
              Start free. Upgrade when you're ready.
            </h2>
            <p
              className="mx-auto text-center"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                color: "var(--lp-text-2)",
                maxWidth: "50ch",
                marginBottom: "40px",
              }}
            >
              No hidden fees. No foreign currency. Priced for the Nigerian student.
            </p>
          </Reveal>
        </motion.div>

        <motion.div style={{ y: cardsY }} className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
          <Reveal>
            <article
              style={{
                height: "100%",
                border: "1px solid var(--lp-border)",
                borderRadius: "16px",
                background: "var(--lp-surface-2)",
                padding: "28px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--lp-text-2)",
                  marginBottom: "12px",
                }}
              >
                {freePlan.name}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "48px",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: "var(--lp-text-1)",
                  letterSpacing: "-0.02em",
                }}
              >
                {freePlan.price}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "12px",
                  color: "var(--lp-text-3)",
                  marginTop: "6px",
                  marginBottom: "24px",
                }}
              >
                {freePlan.meta}
              </p>

              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {freePlan.includes.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "var(--lp-amber-dim)",
                        border: "1px solid rgba(212, 148, 10, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                        color: "var(--lp-amber)",
                      }}
                    >
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span style={{ fontFamily: "var(--font-syne)", fontSize: "13px", color: "var(--lp-text-2)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  borderTop: "1px solid var(--lp-border)",
                  paddingTop: "20px",
                  marginBottom: "28px",
                }}
              >
                {freePlan.limited.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: "1px solid var(--lp-border)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                        color: "var(--lp-text-3)",
                      }}
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </span>
                    <span style={{ fontFamily: "var(--font-syne)", fontSize: "13px", color: "var(--lp-text-3)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#final-cta"
                style={{
                  display: "inline-flex",
                  height: "46px",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  border: "1px solid var(--lp-border)",
                  fontFamily: "var(--font-syne)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--lp-text-1)",
                  transition: "border-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--lp-amber)";
                  e.currentTarget.style.color = "var(--lp-amber)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--lp-border)";
                  e.currentTarget.style.color = "var(--lp-text-1)";
                }}
              >
                {freePlan.cta}
              </a>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article
              style={{
                height: "100%",
                border: "1px solid var(--lp-amber)",
                borderRadius: "16px",
                background: "var(--lp-surface-2)",
                padding: "28px",
                position: "relative",
                boxShadow: "0 0 0 1px rgba(212, 148, 10, 0.2), 0 24px 48px rgba(0,0,0,0.4)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "var(--lp-amber)",
                  color: "var(--lp-bg)",
                  fontFamily: "var(--font-syne)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  borderRadius: "6px",
                  padding: "3px 10px",
                }}
              >
                {proPlan.badge}
              </span>

              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--lp-amber)",
                  marginBottom: "12px",
                }}
              >
                {proPlan.name}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "48px",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: "var(--lp-text-1)",
                  letterSpacing: "-0.02em",
                }}
              >
                {proPlan.price}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "12px",
                  color: "var(--lp-text-2)",
                  marginTop: "6px",
                  marginBottom: "24px",
                }}
              >
                {proPlan.meta}
              </p>

              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "40px" }}>
                {proPlan.includes.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "var(--lp-amber)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                        color: "var(--lp-bg)",
                      }}
                    >
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span style={{ fontFamily: "var(--font-syne)", fontSize: "13px", color: "var(--lp-text-1)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#final-cta"
                style={{
                  display: "inline-flex",
                  height: "46px",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  background: "var(--lp-amber)",
                  color: "var(--lp-bg)",
                  fontFamily: "var(--font-syne)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  transition: "filter 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
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
