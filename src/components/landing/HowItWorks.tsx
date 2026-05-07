import { Upload, Mic2, Headphones } from "lucide-react";
import { steps } from "./data";

const ICONS = [Upload, Mic2, Headphones];

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: "#060C22", padding: "96px 0" }}>
      <div className="section-container">
        {/* Badge */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 16px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ color: "#F5A623", fontSize: "12px" }}>★</span>
            <span
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "11px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Simple to Begin
            </span>
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: "56px",
            letterSpacing: "-0.02em",
          }}
        >
          Three steps to a smarter study session
        </h2>

        {/* Cards */}
        <div className="lp-three-col" style={{ display: "grid" }}>
          {steps.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={step.id}
                style={{
                  background: "#0D1635",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  padding: "32px 28px",
                }}
              >
                {/* Number + icon */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(27,110,243,0.15)",
                      border: "1px solid rgba(27,110,243,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color="#6BAAFF" strokeWidth={1.75} />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#3A4D6B",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {step.id}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    marginBottom: "12px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "14px",
                    color: "#8B9BB4",
                    lineHeight: 1.7,
                  }}
                >
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
