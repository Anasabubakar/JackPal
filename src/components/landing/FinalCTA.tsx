"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });
  const textY = useTransform(smooth, [0, 0.5, 1], [36, 0, -24]);
  const textOpacity = useTransform(smooth, [0, 0.15, 0.85, 1], [0.3, 1, 1, 0.6]);
  const visualScale = useTransform(smooth, [0, 0.4, 0.8, 1], [0.92, 1, 1, 0.97]);

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      style={{
        background: "var(--lp-bg)",
        borderTop: "1px solid var(--lp-border)",
        padding: "96px 0 104px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="relative mx-auto grid w-full max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">

        {/* Left — text */}
        <motion.div style={{ y: textY, opacity: textOpacity }}>
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "var(--lp-amber)",
              marginBottom: "20px",
            }}
          >
            Stop reading. Start listening.
          </p>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)",
              fontWeight: 800,
              lineHeight: "0.95",
              letterSpacing: "-0.025em",
              color: "var(--lp-text-1)",
              marginBottom: "24px",
              maxWidth: "22ch",
            }}
          >
            Your next exam deserves better than{" "}
            <em style={{ fontStyle: "italic", color: "var(--lp-amber)" }}>
              all-night reading sessions.
            </em>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "15px",
              color: "var(--lp-text-2)",
              lineHeight: "1.75",
              marginBottom: "16px",
              maxWidth: "52ch",
            }}
          >
            Join Nigerian students already on the waitlist. Free during beta. No credit card needed.
          </p>

          <p
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "11px",
              color: "var(--lp-text-3)",
              letterSpacing: "0.04em",
              marginBottom: "36px",
            }}
          >
            Launching Q2 2026 · ₦1,000/month after launch
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href="#"
              style={{
                display: "inline-flex",
                height: "50px",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "10px",
                background: "var(--lp-amber)",
                color: "#fff",
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "0 28px",
                transition: "filter 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
            >
              Join the Waitlist
            </a>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                height: "50px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                border: "1px solid var(--lp-border)",
                color: "var(--lp-text-1)",
                fontFamily: "var(--font-syne)",
                fontSize: "13px",
                fontWeight: 600,
                padding: "0 28px",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--lp-amber)";
                e.currentTarget.style.color = "var(--lp-amber)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--lp-border)";
                e.currentTarget.style.color = "var(--lp-text-1)";
              }}
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Right — mascot visual */}
        <motion.div
          style={{ scale: visualScale }}
          className="flex items-center justify-center"
        >
          <div className="relative mx-auto flex items-center justify-center" style={{ width: "clamp(220px, 80vw, 340px)", height: "clamp(220px, 80vw, 340px)" }}>

            {/* Outermost ambient glow ring */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.12, 0.22, 0.12] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, var(--lp-amber) 0%, transparent 70%)" }}
            />

            {/* Middle ring */}
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.18, 0.32, 0.18] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
              className="absolute rounded-full"
              style={{
                width: "240px",
                height: "240px",
                background: "radial-gradient(circle, var(--lp-amber) 0%, transparent 70%)",
              }}
            />

            {/* Orb container */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              style={{
                position: "relative",
                width: "200px",
                height: "200px",
                borderRadius: "40px",
                background: "linear-gradient(145deg, var(--lp-amber-dim), var(--lp-surface-2))",
                border: "1px solid var(--lp-amber)",
                boxShadow: "0 0 60px rgba(44,123,229,0.35), 0 0 120px rgba(44,123,229,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "8px",
                overflow: "hidden",
              }}
            >
              {/* Inner corner glows */}
              <div
                className="pointer-events-none absolute -top-6 -right-6"
                style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--lp-amber)", opacity: 0.25, filter: "blur(24px)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-6 -left-6"
                style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--lp-amber)", opacity: 0.15, filter: "blur(20px)" }}
              />

              <Image
                src="/images/JackPal 1.png"
                alt="JackPal AI study companion"
                width={110}
                height={110}
                style={{ position: "relative", zIndex: 1, filter: "drop-shadow(0 4px 16px rgba(44,123,229,0.4))" }}
                priority
              />
              <p
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--lp-text-1)",
                  letterSpacing: "-0.01em",
                }}
              >
                JackPal
              </p>
            </motion.div>

            {/* Rotating ring decoration */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: "260px",
                height: "260px",
                border: "1px dashed var(--lp-amber)",
                opacity: 0.18,
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
