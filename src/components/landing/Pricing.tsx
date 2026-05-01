import { Check, X } from "lucide-react";
import { freePlan, proPlan } from "./data";

export function Pricing() {
  return (
    <section id="pricing" style={{ background: "#FFFFFF", padding: "96px 0" }}>
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
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p style={{ fontFamily: "var(--font-syne)", fontSize: "15px", color: "#6B7280" }}>
            No hidden fees. No pressure. Built for the Nigerian student.
          </p>
        </div>

        {/* Cards */}
        <div className="lp-pricing-grid" style={{ display: "grid" }}>
          {/* Free */}
          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "20px",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#9CA3AF",
                marginBottom: "16px",
              }}
            >
              {freePlan.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "48px",
                fontWeight: 700,
                color: "#0A1628",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              {freePlan.price}
            </div>
            <div
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                color: "#9CA3AF",
                marginBottom: "32px",
              }}
            >
              {freePlan.meta}
            </div>

            {/* Included */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {freePlan.includes.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Check size={16} color="#1B6EF3" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontFamily: "var(--font-syne)", fontSize: "14px", color: "#374151" }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Limited */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "36px" }}>
              {freePlan.limited.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <X size={16} color="#D1D5DB" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontFamily: "var(--font-syne)", fontSize: "14px", color: "#9CA3AF" }}>{item}</span>
                </div>
              ))}
            </div>

            <a
              href="#final-cta"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "50px",
                borderRadius: "10px",
                border: "1px solid #D1D5DB",
                background: "transparent",
                color: "#374151",
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                transition: "border-color 0.15s, color 0.15s",
                marginTop: "auto",
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
              {freePlan.cta}
            </a>
          </div>

          {/* Pro */}
          <div
            style={{
              border: "2px solid #1B6EF3",
              borderRadius: "20px",
              padding: "36px 32px",
              background: "#F0F6FF",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Most popular badge */}
            <div
              style={{
                position: "absolute",
                top: "-14px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#1B6EF3",
                color: "white",
                fontFamily: "var(--font-syne)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "4px 14px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
              }}
            >
              {proPlan.badge}
            </div>

            <div
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#1B6EF3",
                marginBottom: "16px",
              }}
            >
              {proPlan.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "48px",
                fontWeight: 700,
                color: "#0A1628",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              {proPlan.price}
            </div>
            <div
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                color: "#6B7280",
                marginBottom: "32px",
              }}
            >
              {proPlan.meta}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "36px" }}>
              {proPlan.includes.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Check size={16} color="#1B6EF3" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontFamily: "var(--font-syne)", fontSize: "14px", color: "#374151" }}>{item}</span>
                </div>
              ))}
            </div>

            <a
              href="#final-cta"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "50px",
                borderRadius: "10px",
                background: "#F5A623",
                color: "white",
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                transition: "filter 0.15s",
                marginTop: "auto",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            >
              {proPlan.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
