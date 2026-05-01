"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";
import { navLinks } from "./data";

const DARK = "#060C22";
const WHITE = "#FFFFFF";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: WHITE,
        borderBottom: scrolled ? "1px solid #E5E7EB" : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
          <JackpalsLogo variant="wordmark" priority className="h-[30px] w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden lg:flex"
          style={{ alignItems: "center", gap: "36px" }}
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#4B5563",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = DARK)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden lg:flex" style={{ alignItems: "center", gap: "24px" }}>
          <a
            href="/login"
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "14px",
              fontWeight: 500,
              color: "#4B5563",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
          >
            Login
          </a>
          <a
            href="#pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "40px",
              padding: "0 22px",
              borderRadius: "8px",
              background: DARK,
              color: WHITE,
              fontFamily: "var(--font-syne)",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0D1A40")}
            onMouseLeave={(e) => (e.currentTarget.style.background = DARK)}
          >
            Join The Waitlist
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden"
          aria-label="Toggle menu"
          style={{
            display: "inline-flex",
            width: "40px",
            height: "40px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            background: WHITE,
            color: DARK,
            cursor: "pointer",
          }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="lg:hidden"
          style={{
            borderTop: "1px solid #E5E7EB",
            background: WHITE,
            padding: "16px 24px 24px",
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "13px 16px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-syne)",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#374151",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </a>
            ))}
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <a
                href="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "46px",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  fontFamily: "var(--font-syne)",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#374151",
                  textDecoration: "none",
                }}
              >
                Login
              </a>
              <a
                href="#pricing"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "48px",
                  borderRadius: "8px",
                  background: DARK,
                  color: WHITE,
                  fontFamily: "var(--font-syne)",
                  fontSize: "15px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Join The Waitlist
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
