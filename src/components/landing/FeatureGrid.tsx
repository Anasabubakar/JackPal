"use client";

import { Reveal } from "./Reveal";
import { featureCards } from "./data";

export function FeatureGrid() {
  return (
    <section
      style={{
        background: "var(--lp-surface)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "80px 0",
      }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
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
            Real Action
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4.2vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: "1.02",
              letterSpacing: "-0.02em",
              color: "var(--lp-text-1)",
              maxWidth: "18ch",
              marginBottom: "40px",
            }}
          >
            Everything you need. Nothing you don't.
          </h2>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.05}>
              <article
                style={{
                  border: "1px solid var(--lp-border)",
                  borderRadius: "14px",
                  background: "var(--lp-surface-2)",
                  padding: "24px",
                  height: "100%",
                  transition: "border-color 0.2s ease, transform 0.2s ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212, 148, 10, 0.4)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--lp-border)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    fontWeight: 700,
                    lineHeight: "1.15",
                    color: "var(--lp-text-1)",
                    marginBottom: "12px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "13px",
                    lineHeight: "1.7",
                    color: "var(--lp-text-2)",
                  }}
                >
                  {feature.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
