"use client";

import Image from "next/image";
import { Github, Globe, Linkedin, Twitter } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

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
          <div style={{ display: "flex", gap: "16px" }} aria-label="Social links">
            <a
              href={SOCIAL_LINKS.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="JackPals on X"
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
                color: "#8B9BB4",
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
              <Twitter size={16} strokeWidth={2} aria-hidden />
            </a>
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TeenovateX Labs on LinkedIn"
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
                color: "#8B9BB4",
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
              <Linkedin size={16} strokeWidth={2} aria-hidden />
            </a>
            <a
              href={SOCIAL_LINKS.site}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="JackPals website"
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
                color: "#8B9BB4",
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
              <Globe size={16} strokeWidth={2} aria-hidden />
            </a>
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="JackPals on GitHub"
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
                color: "#8B9BB4",
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
              <Github size={16} strokeWidth={2} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
