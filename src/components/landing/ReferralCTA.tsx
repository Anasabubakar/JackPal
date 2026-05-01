import { Share2 } from "lucide-react";

export function ReferralCTA() {
  return (
    <section style={{ background: "#F5F7FA", padding: "80px 0" }}>
      <div className="section-container">
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "20px",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(27,110,243,0.12)",
              border: "1px solid rgba(27,110,243,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <Share2 size={24} color="#1B6EF3" strokeWidth={1.75} />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 700,
              color: "#0A1628",
              letterSpacing: "-0.025em",
              marginBottom: "12px",
            }}
          >
            Know a student who needs this?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "15px",
              color: "#6B7280",
              lineHeight: 1.7,
              maxWidth: "520px",
              marginBottom: "28px",
            }}
          >
            JackPals is better when your study group uses it. Share it with one person and help them ace their next exam.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "46px",
                padding: "0 24px",
                borderRadius: "10px",
                background: "#1B6EF3",
                color: "white",
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            >
              Spread the word
            </button>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "46px",
                padding: "0 24px",
                borderRadius: "10px",
                background: "transparent",
                color: "#374151",
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                fontWeight: 600,
                border: "1px solid #D1D5DB",
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#9CA3AF";
                e.currentTarget.style.color = "#0A1628";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#D1D5DB";
                e.currentTarget.style.color = "#374151";
              }}
            >
              Share feedback
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
