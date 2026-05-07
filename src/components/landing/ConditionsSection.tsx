import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { conditionBullets } from "./data";

export function ConditionsSection() {
  return (
    <section style={{ background: "#060C22", padding: "96px 0" }}>
      <div className="section-container">
        <div className="lp-two-col" style={{ display: "grid" }}>
          {/* Left — copy */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {/* Badge */}
            <div style={{ marginBottom: "24px" }}>
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
                  Privacy &amp; Performance
                </span>
              </span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 3.5vw, 40px)",
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.2,
                letterSpacing: "-0.025em",
                marginBottom: "36px",
              }}
            >
              Built for real-world{" "}
              <span style={{ color: "#1B6EF3" }}>Nigerian conditions.</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {conditionBullets.map((bullet, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <CheckCircle2
                    size={20}
                    color="#1B6EF3"
                    strokeWidth={2}
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  />
                  <p style={{ fontFamily: "var(--font-syne)", fontSize: "15px", color: "#8B9BB4", lineHeight: 1.65 }}>
                    {bullet}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "40px" }}>
              <a
                href="#pricing"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: "50px",
                  padding: "0 28px",
                  borderRadius: "10px",
                  background: "rgba(27,110,243,0.15)",
                  border: "1px solid rgba(27,110,243,0.3)",
                  color: "#6BAAFF",
                  fontFamily: "var(--font-syne)",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(27,110,243,0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(27,110,243,0.15)")}
              >
                Try It Free →
              </a>
            </div>
          </div>

          {/* Right — image */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "380px",
                aspectRatio: "1",
                borderRadius: "24px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Glow */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at center, rgba(27,110,243,0.2) 0%, transparent 70%)",
                  borderRadius: "24px",
                }}
              />
              <Image
                src="/images/,.m., 1.png"
                alt="Built for Nigerian conditions"
                width={400}
                height={400}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "24px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
