"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "./data";

export function FAQ() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  return (
    <section id="faq" style={{ background: "#FFFFFF", padding: "96px 0" }}>
      <div className="section-container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: 700,
              color: "#0A1628",
              letterSpacing: "-0.025em",
              marginBottom: "12px",
            }}
          >
            Frequently Asked Questions
          </h2>
          <p style={{ fontFamily: "var(--font-syne)", fontSize: "15px", color: "#6B7280" }}>
            Got questions? We have answers.
          </p>
        </div>

        {/* Accordion */}
        <div style={{ maxWidth: "740px", margin: "0 auto" }}>
          {faqs.map((item, index) => {
            const isOpen = openItem === index;
            return (
              <div
                key={item.question}
                style={{
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <button
                  type="button"
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "24px 0",
                    textAlign: "left",
                    fontFamily: "var(--font-syne)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: isOpen ? "#0A1628" : "#374151",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "color 0.15s",
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
                      border: `1px solid ${isOpen ? "#1B6EF3" : "#D1D5DB"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s",
                      background: isOpen ? "rgba(27,110,243,0.1)" : "transparent",
                    }}
                  >
                    <ChevronDown
                      style={{
                        width: "16px",
                        height: "16px",
                        color: isOpen ? "#1B6EF3" : "#9CA3AF",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s, color 0.15s",
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
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        style={{
                          paddingBottom: "24px",
                          fontFamily: "var(--font-syne)",
                          fontSize: "14px",
                          lineHeight: 1.8,
                          color: "#6B7280",
                        }}
                      >
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
