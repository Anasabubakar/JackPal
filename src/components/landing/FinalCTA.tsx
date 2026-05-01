"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { WaitlistForm } from "./WaitlistForm";

export function FinalCTA() {
  return (
    <section id="final-cta" style={{ background: "#060C22", padding: "96px 0 104px", position: "relative" }}>
      <div className="section-container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 0.9fr",
            gap: "64px",
            alignItems: "center",
          }}
          className="lg:grid"
        >
          {/* Left — text */}
          <div>
            <p
              className="uppercase"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "#F5A623",
                marginBottom: "20px",
              }}
            >
              Stop reading. Start listening.
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.025em",
                color: "#FFFFFF",
                marginBottom: "24px",
              }}
            >
              Your next exam deserves better than{" "}
              <span style={{ fontStyle: "italic", color: "#F5A623" }}>
                all-night reading sessions.
              </span>
            </h2>

            <p
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "15px",
                color: "#8B9BB4",
                lineHeight: 1.75,
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
                color: "#3A4D6B",
                letterSpacing: "0.04em",
                marginBottom: "28px",
              }}
            >
              Launching Q2 2026 · ₦1,000/month after launch
            </p>

            <WaitlistForm />
          </div>

          {/* Right — mascot visual */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="relative" style={{ width: "clamp(220px, 60vw, 320px)", height: "clamp(220px, 60vw, 320px)" }}>
              {/* Outermost glow */}
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.12, 0.22, 0.12] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #1B6EF3 0%, transparent 70%)",
                }}
              />

              {/* Middle ring */}
              <motion.div
                animate={{ scale: [1, 1.04, 1], opacity: [0.18, 0.32, 0.18] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                style={{
                  position: "absolute",
                  width: "220px",
                  height: "220px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #1B6EF3 0%, transparent 70%)",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />

              {/* Orb */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                style={{
                  position: "relative",
                  width: "180px",
                  height: "180px",
                  borderRadius: "36px",
                  background: "linear-gradient(145deg, rgba(27,110,243,0.15), rgba(13,22,53,0.8))",
                  border: "1px solid rgba(27,110,243,0.4)",
                  boxShadow: "0 0 60px rgba(27,110,243,0.35), 0 0 120px rgba(27,110,243,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "8px",
                  overflow: "hidden",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Corner glows */}
                <div
                  style={{
                    position: "absolute",
                    top: "-24px",
                    right: "-24px",
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "#1B6EF3",
                    opacity: 0.25,
                    filter: "blur(24px)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-20px",
                    left: "-20px",
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#1B6EF3",
                    opacity: 0.15,
                    filter: "blur(20px)",
                  }}
                />

                <Image
                  src="/images/JackPal 1.png"
                  alt="Jackpals mascot"
                  width={100}
                  height={100}
                  style={{ position: "relative", zIndex: 1, filter: "drop-shadow(0 4px 16px rgba(27,110,243,0.4))" }}
                  priority
                />
                <p
                  style={{
                    position: "relative",
                    zIndex: 1,
                    fontFamily: "var(--font-display)",
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Jackpals
                </p>
              </motion.div>

              {/* Rotating dashed ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                style={{
                  position: "absolute",
                  width: "240px",
                  height: "240px",
                  borderRadius: "50%",
                  border: "1px dashed rgba(27,110,243,0.3)",
                  opacity: 0.18,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none" as const,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
