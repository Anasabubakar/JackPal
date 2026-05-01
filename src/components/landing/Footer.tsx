"use client";

import { BrandLogo } from "./BrandLogo";

const productLinks = ["How It Works", "Voices", "Features", "Pricing", "Waitlist"];
const companyLinks = ["About", "Blog", "Career", "Contact"];
const legalLinks = ["Privacy Policy", "Terms of Use", "Cookie Policy"];

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--lp-surface)",
        borderTop: "1px solid var(--lp-border)",
        padding: "64px 0 40px",
      }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div
          className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]"
          style={{
            borderBottom: "1px solid var(--lp-border)",
            paddingBottom: "40px",
          }}
        >
          <div>
            <BrandLogo className="h-10 w-10" />
            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                lineHeight: "1.7",
                color: "var(--lp-text-2)",
                marginTop: "16px",
                maxWidth: "28ch",
              }}
            >
              Learn in a way that actually works. Your notes, your voice, your pace.
            </p>
          </div>

          {[
            { label: "Product", links: productLinks },
            { label: "Company", links: companyLinks },
            { label: "Legal", links: legalLinks },
          ].map(({ label, links }) => (
            <nav key={label} aria-label={label}>
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: "var(--lp-text-3)",
                  marginBottom: "16px",
                }}
              >
                {label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {links.map((item) => (
                  <a
                    key={item}
                    href="#"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "13px",
                      color: "var(--lp-text-2)",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--lp-text-1)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--lp-text-2)")}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </nav>
          ))}
        </div>

        <div
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          style={{ marginTop: "24px" }}
        >
          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "11px",
              color: "var(--lp-text-3)",
            }}
          >
            © 2026 JackPal. All rights reserved. Built with love for Nigerian students.
          </p>
          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "11px",
              color: "var(--lp-text-3)",
            }}
          >
            X · Instagram · LinkedIn
          </p>
        </div>
      </div>
    </footer>
  );
}
