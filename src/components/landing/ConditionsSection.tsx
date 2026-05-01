import { ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";
import { conditionBullets } from "./data";

export function ConditionsSection() {
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
          <article
            className="p-6 sm:p-10"
            style={{
              overflow: "hidden",
              borderRadius: "20px",
              border: "1px solid var(--lp-border)",
              background: "var(--lp-surface-2)",
              position: "relative",
            }}
          >
            {/* Amber accent line at top */}
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "var(--lp-amber)", opacity: 0.5 }}
              aria-hidden
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
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
                  Privacy & Performance
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.8rem, 4vw, 3rem)",
                    fontWeight: 800,
                    lineHeight: "1.02",
                    letterSpacing: "-0.02em",
                    color: "var(--lp-text-1)",
                    maxWidth: "22ch",
                    marginBottom: "16px",
                  }}
                >
                  Built for real-world{" "}
                  <em style={{ fontStyle: "italic", color: "var(--lp-amber)" }}>Nigerian conditions.</em>
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "14px",
                    lineHeight: "1.75",
                    color: "var(--lp-text-2)",
                    maxWidth: "60ch",
                    marginBottom: "24px",
                  }}
                >
                  JackPal does not assume you have fast WiFi, unlimited data, or a 2024 flagship phone. It is engineered for the actual constraints of student life.
                </p>

                <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {conditionBullets.map((item) => (
                    <li
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <ShieldCheck
                        style={{
                          width: "18px",
                          height: "18px",
                          flexShrink: 0,
                          marginTop: "1px",
                          color: "var(--lp-amber)",
                        }}
                        strokeWidth={1.75}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-syne)",
                          fontSize: "13px",
                          lineHeight: "1.6",
                          color: "var(--lp-text-2)",
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Editorial waveform decoration */}
              <div
                className="relative hidden items-center justify-center lg:flex"
                style={{ height: "220px" }}
                aria-hidden
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "4px",
                    opacity: 0.2,
                  }}
                >
                  {[20, 34, 52, 40, 28, 44, 60, 36, 22, 48, 64, 32, 20, 38, 56, 30, 22, 44, 68, 38, 24, 50, 58, 34].map((h, i) => (
                    <span
                      key={i}
                      style={{
                        width: "5px",
                        height: `${h}px`,
                        borderRadius: "3px",
                        background: "var(--lp-amber)",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
