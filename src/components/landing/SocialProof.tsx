import { testimonials } from "./data";

function Stars() {
  return (
    <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="#F5A623">
          <path d="M8 1l1.854 3.753L14 5.44l-3 2.923.708 4.137L8 10.347l-3.708 2.153L5 8.363 2 5.44l4.146-.687z" />
        </svg>
      ))}
    </div>
  );
}

export function SocialProof() {
  return (
    <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
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
              Real Action
            </span>
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#0A1628",
            textAlign: "center",
            marginBottom: "56px",
            letterSpacing: "-0.02em",
          }}
        >
          What students said when we showed them a demo
        </h2>

        {/* Cards */}
        <div className="lp-three-col" style={{ display: "grid" }}>
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stars />
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "15px",
                  color: "#374151",
                  lineHeight: 1.7,
                  flex: 1,
                  marginBottom: "24px",
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0A1628",
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: "12px",
                    color: "#9CA3AF",
                    marginTop: "2px",
                  }}
                >
                  {t.meta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
