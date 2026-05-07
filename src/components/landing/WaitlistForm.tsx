"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "50px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "#FFFFFF",
  fontFamily: "var(--font-syne)",
  fontSize: "14px",
  padding: "0 16px",
  outline: "none",
  transition: "border-color 0.15s ease",
};

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Try again.");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setError("Network error. Check your connection.");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: compact ? "20px 24px" : "24px 28px",
          border: "1px solid rgba(27,110,243,0.4)",
          borderRadius: "14px",
          background: "rgba(27,110,243,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2
            style={{ width: "22px", height: "22px", color: "#1B6EF3", flexShrink: 0 }}
            strokeWidth={2}
          />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
            You&apos;re on the list.
          </p>
        </div>
        <p style={{ fontFamily: "var(--font-syne)", fontSize: "13px", color: "#8B9BB4", lineHeight: 1.7, paddingLeft: "32px" }}>
          We&apos;ll reach out to {email} as soon as we launch. Tell a classmate.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Name */}
        <div>
          <label htmlFor={`${id}-name`} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            Your name (optional)
          </label>
          <input
            id={`${id}-name`}
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            style={INPUT_STYLE}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#1B6EF3")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor={`${id}-email`} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            Email address
          </label>
          <input
            id={`${id}-email`}
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={INPUT_STYLE}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#1B6EF3")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
          />
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {status === "error" && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "12px",
              color: "#EF4444",
              paddingLeft: "4px",
            }}
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          display: "inline-flex",
          height: "52px",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          borderRadius: "10px",
          background: status === "loading" ? "rgba(255,255,255,0.06)" : "#F5A623",
          border: "none",
          color: status === "loading" ? "#3A4D6B" : "#FFFFFF",
          fontFamily: "var(--font-syne)",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          transition: "filter 0.15s ease, background 0.15s ease",
        }}
        onMouseEnter={(e) => { if (status !== "loading") e.currentTarget.style.filter = "brightness(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
      >
        {status === "loading" ? (
          <>
            <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
            Joining…
          </>
        ) : (
          <>
            Join the Waitlist
            <ArrowRight style={{ width: "16px", height: "16px" }} strokeWidth={2.5} />
          </>
        )}
      </button>

      <p style={{ fontFamily: "var(--font-syne)", fontSize: "11px", color: "#3A4D6B", letterSpacing: "0.03em", textAlign: "center" }}>
        Free during beta · No credit card · Launching Q2 2026
      </p>
    </form>
  );
}
