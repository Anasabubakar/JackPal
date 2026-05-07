import { realityStats } from "./data";

export function ProblemReality() {
  return (
    <section style={{ background: "#F5F7FA", padding: "96px 0" }}>
      <div className="section-container">
        <div className="lp-two-col" style={{ display: "grid" }}>
          {/* Left — stats */}
          <div>
            {/* Badge */}
            <div style={{ marginBottom: "32px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 16px",
                  borderRadius: "999px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ color: "#F5A623", fontSize: "12px" }}>★</span>
                <span
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6B7280",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  The Reality
                </span>
              </span>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {realityStats.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(36px, 5vw, 52px)",
                      fontWeight: 700,
                      color: "#0A1628",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      flexShrink: 0,
                      minWidth: "80px",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "15px",
                      color: "#6B7280",
                      lineHeight: 1.6,
                      paddingTop: "8px",
                    }}
                  >
                    {s.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — explanation */}
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 700,
                color: "#0A1628",
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
                marginBottom: "24px",
              }}
            >
              Nigerian students are reading more and{" "}
              <span style={{ color: "#1B6EF3" }}>retaining less.</span>
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                fontFamily: "var(--font-syne)",
                fontSize: "15px",
                color: "#6B7280",
                lineHeight: 1.75,
              }}
            >
              <p>
                Between long commutes, noisy hostels, shared reading spaces, and the sheer volume of course material — the traditional &ldquo;sit down and read&rdquo; method is failing most Nigerian students.
              </p>
              <p>
                Not because students aren&apos;t trying. Because the tools available were never designed with them in mind.
              </p>
              <p>
                Apps like NotebookLM exist, but they were built for a different context. The voices are foreign. The accents are unfamiliar. And without the right input format, your brain switches off faster.
              </p>
              <p>
                JackPals is built differently — for the Nigerian academic experience, from the ground up.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
