"use client";

import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { navLinks } from "./data";

function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("jp-theme");
    const isDark = saved !== "light";
    setDark(isDark);
    // sync DOM in case the anti-flash script already set it
    if (!document.documentElement.getAttribute("data-theme")) {
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("jp-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: "1px solid var(--lp-border)",
        background: "var(--lp-surface)",
        color: "var(--lp-text-2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--lp-amber)";
        e.currentTarget.style.color = "var(--lp-amber)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--lp-border)";
        e.currentTarget.style.color = "var(--lp-text-2)";
      }}
    >
      {dark ? <Sun size={14} strokeWidth={1.75} /> : <Moon size={14} strokeWidth={1.75} />}
    </button>
  );
}

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
        background: scrolled ? "color-mix(in srgb, var(--lp-bg) 92%, transparent)" : "color-mix(in srgb, var(--lp-bg) 70%, transparent)",
        borderBottom: scrolled ? "1px solid var(--lp-border)" : "1px solid transparent",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
    >
      <div
        className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8"
        style={{ height: "64px" }}
      >
        <Link href="/" className="inline-flex items-center" aria-label="JackPal home">
          <BrandLogo className="h-10 w-10 sm:h-11 sm:w-11" priority />
        </Link>

        <nav
          className="hidden items-center gap-8 lg:flex"
          style={{ fontFamily: "var(--font-syne)", fontSize: "13px", fontWeight: 500, color: "var(--lp-text-2)" }}
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{ transition: "color 0.15s ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--lp-text-1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--lp-text-2)")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <a
            href="#final-cta"
            style={{
              display: "inline-flex", height: "38px", alignItems: "center", justifyContent: "center",
              borderRadius: "8px", background: "var(--lp-amber)", color: "#fff",
              fontFamily: "var(--font-syne)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
              padding: "0 18px", transition: "filter 0.15s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.12)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
          >
            Join the Waitlist
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            style={{
              display: "inline-flex", width: "38px", height: "38px",
              alignItems: "center", justifyContent: "center",
              borderRadius: "8px", border: "1px solid var(--lp-border)",
              background: "var(--lp-surface)", color: "var(--lp-text-1)", cursor: "pointer",
            }}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          style={{ borderTop: "1px solid var(--lp-border)", background: "var(--lp-bg)", padding: "16px" }}
          className="lg:hidden"
        >
          <nav className="mx-auto flex w-full max-w-[1200px] flex-col gap-1">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  borderRadius: "8px", border: "1px solid var(--lp-border)",
                  padding: "11px 14px", fontFamily: "var(--font-syne)", fontSize: "14px",
                  color: "var(--lp-text-2)",
                }}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#final-cta"
              onClick={() => setMenuOpen(false)}
              style={{
                marginTop: "6px", display: "inline-flex", height: "46px",
                alignItems: "center", justifyContent: "center",
                borderRadius: "10px", background: "var(--lp-amber)", color: "#fff",
                fontFamily: "var(--font-syne)", fontSize: "14px", fontWeight: 700,
              }}
            >
              Join the Waitlist
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
