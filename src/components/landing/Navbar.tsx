"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { navLinks } from "./data";

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
      className={[
        "sticky top-0 z-50 transition",
        scrolled
          ? "border-b border-white/10 bg-[#020A2A]/85 backdrop-blur-xl"
          : "border-b border-transparent bg-[#020A2A]/55 backdrop-blur-md",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center" aria-label="Jackpals home">
          <BrandLogo className="h-10 w-10 sm:h-11 sm:w-11" priority />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[#C6DAFF] lg:flex">
          {navLinks.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/login" className="text-sm text-[#D3E2FF] transition hover:text-white">
            Login
          </Link>
          <a
            href="#final-cta"
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#2F7CFF] to-[#37C2FF] px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(42,156,255,0.4)] transition hover:brightness-110"
          >
            Join The Waitlist
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#020A2A]/98 px-4 py-6 lg:hidden">
          <nav className="mx-auto flex w-full max-w-[1200px] flex-col gap-2">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-[#D6E5FF]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-[#D6E5FF]"
            >
              Login
            </Link>
            <a
              href="#final-cta"
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#2F7CFF] to-[#37C2FF] px-4 text-base font-semibold text-white"
            >
              Join The Waitlist
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
