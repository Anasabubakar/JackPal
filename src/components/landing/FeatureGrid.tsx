import { featureCards } from "./data";

export function FeatureGrid() {
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
          Everything you need. Nothing you don&apos;t.
        </h2>

        {/* Grid */}
        <div className="lp-feature-grid" style={{ display: "grid" }}>
          {featureCards.map((card, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "28px 24px",
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "#D1D5DB";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "16px" }}>{card.icon}</div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0A1628",
                  marginBottom: "10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "14px",
                  color: "#6B7280",
                  lineHeight: 1.7,
                }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
