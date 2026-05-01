import Image from "next/image";

const productLinks = ["How It Works", "Voices", "Features", "Pricing"];
const companyLinks = ["About", "Blog", "Career", "Contact"];
const legalLinks = ["Privacy Policy", "Terms of Use", "Cookie Policy"];

export function Footer() {
  return (
    <footer style={{ background: "#060C22", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "64px 0 32px" }}>
      <div className="section-container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr repeat(3, 1fr)",
            gap: "48px",
            marginBottom: "48px",
          }}
          className="lg:grid"
        >
          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Image
                src="/images/Jackpals Logo 3 1.png"
                alt="Jackpals"
                width={100}
                height={28}
                style={{ height: "24px", width: "auto" }}
              />
            </div>
            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                color: "#8B9BB4",
                lineHeight: 1.7,
                maxWidth: "260px",
              }}
            >
              Learn smarter, not harder. Built for Nigerian students, by Nigerian students.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Product
            </h4>
            <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", padding: 0, margin: 0 }}>
              {productLinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(" ", "-")}`}
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "14px",
                      color: "#8B9BB4",
                      textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB4")}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Company
            </h4>
            <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", padding: 0, margin: 0 }}>
              {companyLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "14px",
                      color: "#8B9BB4",
                      textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB4")}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "11px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Legal
            </h4>
            <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", padding: 0, margin: 0 }}>
              {legalLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "14px",
                      color: "#8B9BB4",
                      textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9BB4")}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "32px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <p style={{ fontFamily: "var(--font-syne)", fontSize: "12px", color: "#3A4D6B" }}>
            © 2026 Jackpals. All rights reserved. Built with ❤️ for Nigerian students.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {/* Twitter */}
            <a
              href="#"
              aria-label="Follow us on Twitter"
              style={{
                display: "flex",
                width: "36px",
                height: "36px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B9BB4" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="#"
              aria-label="Follow us on Instagram"
              style={{
                display: "flex",
                width: "36px",
                height: "36px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B9BB4" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="#"
              aria-label="Connect on LinkedIn"
              style={{
                display: "flex",
                width: "36px",
                height: "36px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B9BB4" strokeWidth="2">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
