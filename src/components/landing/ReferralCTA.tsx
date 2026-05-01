"use client";

import { Share2 } from "lucide-react";
import { Reveal } from "./Reveal";

export function ReferralCTA() {
  return (
    <section
      style={{
        background: "var(--lp-bg)",
        borderBottom: "1px solid var(--lp-border)",
        padding: "64px 0",
      }}
    >
      <div className="mx-auto w-full max-w-[940px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <article
            className="p-6 sm:p-10"
            style={{
              border: "1px solid var(--lp-border)",
              borderRadius: "16px",
              background: "var(--lp-surface)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                border: "1px solid rgba(212, 148, 10, 0.3)",
                borderRadius: "6px",
                padding: "4px 12px",
                fontFamily: "var(--font-syne)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--lp-amber)",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Spread the word
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)",
                fontWeight: 800,
                lineHeight: "1.05",
                letterSpacing: "-0.02em",
                color: "var(--lp-text-1)",
                marginBottom: "12px",
              }}
            >
              Know a student who needs this?
            </h2>
            <p
              className="mx-auto"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                lineHeight: "1.75",
                color: "var(--lp-text-2)",
                maxWidth: "54ch",
                marginBottom: "28px",
              }}
            >
              JackPal is better when your study group uses it. Share it with one person and help them reclaim hours of wasted commute time.
            </p>
            <button
              type="button"
              style={{
                display: "inline-flex",
                height: "46px",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "10px",
                background: "var(--lp-amber)",
                color: "var(--lp-bg)",
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "0 28px",
                border: "none",
                cursor: "pointer",
                transition: "filter 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
            >
              <Share2 style={{ width: "15px", height: "15px" }} strokeWidth={2} />
              Share JackPal
            </button>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
