"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "./data";
import { Reveal } from "./Reveal";

export function FAQ() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        background: "var(--lp-surface)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
      }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">

          {/* Left — sticky editorial headline */}
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--lp-amber)",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  marginBottom: "24px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#fff",
                    display: "inline-block",
                    opacity: 0.85,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    color: "#fff",
                    textTransform: "uppercase",
                  }}
                >
                  Questions
                </span>
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)",
                  fontWeight: 800,
                  lineHeight: "1.0",
                  letterSpacing: "-0.025em",
                  color: "var(--lp-text-1)",
                  marginBottom: "20px",
                }}
              >
                Frequently<br />Asked<br />Questions.
              </h2>

              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "var(--lp-text-2)",
                }}
              >
                Got questions? We have answers.
              </p>
            </div>
          </Reveal>

          {/* Right — accordion */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {faqs.map((item, index) => {
              const isOpen = openItem === index;
              return (
                <Reveal key={item.question} delay={index * 0.04}>
                  <article
                    style={{
                      borderBottom: "1px solid var(--lp-border)",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        padding: "20px 0",
                        textAlign: "left",
                        fontFamily: "var(--font-syne)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: isOpen ? "var(--lp-text-1)" : "var(--lp-text-2)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        transition: "color 0.15s ease",
                      }}
                      onClick={() => setOpenItem(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.question}</span>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          border: `1px solid ${isOpen ? "var(--lp-amber)" : "var(--lp-border)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "border-color 0.2s ease",
                          background: isOpen ? "var(--lp-amber-dim)" : "transparent",
                        }}
                      >
                        <ChevronDown
                          style={{
                            width: "14px",
                            height: "14px",
                            color: isOpen ? "var(--lp-amber)" : "var(--lp-text-3)",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.25s ease, color 0.15s ease",
                          }}
                        />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <p
                            style={{
                              paddingBottom: "20px",
                              fontFamily: "var(--font-syne)",
                              fontSize: "13px",
                              lineHeight: "1.8",
                              color: "var(--lp-text-2)",
                            }}
                          >
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
