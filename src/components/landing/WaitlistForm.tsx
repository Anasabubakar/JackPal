"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "48px",
  borderRadius: "10px",
  border: "1px solid var(--lp-border)",
  background: "var(--lp-surface-2)",
  color: "var(--lp-text-1)",
  fontFamily: "var(--font-syne)",
  fontSize: "13px",
  padding: "0 16px",
  outline: "none",
  transition: "border-color 0.15s ease",
};

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [email, setEmail]   = useState("");
  const [name,  setName]    = useState("");
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
          border: "1px solid var(--lp-amber)",
          borderRadius: "14px",
          background: "var(--lp-amber-dim)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2
            style={{ width: "22px", height: "22px", color: "var(--lp-amber)", flexShrink: 0 }}
            strokeWidth={2}
          />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--lp-text-1)", lineHeight: 1.2 }}>
            You&apos;re on the list.
          </p>
        </div>
        <p style={{ fontFamily: "var(--font-syne)", fontSize: "13px", color: "var(--lp-text-2)", lineHeight: 1.7, paddingLeft: "32px" }}>
          We&apos;ll reach out to {email} as soon as we launch. Tell a classmate.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
            onChange={e => setName(e.target.value)}
            autoComplete="name"
            style={INPUT_STYLE}
            onFocus={e  => (e.currentTarget.style.borderColor = "var(--lp-amber)")}
            onBlur={e   => (e.currentTarget.style.borderColor = "var(--lp-border)")}
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
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={INPUT_STYLE}
            onFocus={e  => (e.currentTarget.style.borderColor = "var(--lp-amber)")}
            onBlur={e   => (e.currentTarget.style.borderColor = "var(--lp-border)")}
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
              color: "#E05252",
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
          height: "50px",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          borderRadius: "10px",
          background: status === "loading" ? "var(--lp-surface-2)" : "var(--lp-amber)",
          border: status === "loading" ? "1px solid var(--lp-border)" : "none",
          color: status === "loading" ? "var(--lp-text-3)" : "#fff",
          fontFamily: "var(--font-syne)",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          transition: "filter 0.15s ease, background 0.15s ease",
        }}
        onMouseEnter={e => { if (status !== "loading") e.currentTarget.style.filter = "brightness(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}
      >
        {status === "loading" ? (
          <>
            <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />
            Joining…
          </>
        ) : (
          <>
            Join the Waitlist
            <ArrowRight style={{ width: "15px", height: "15px" }} strokeWidth={2.5} />
          </>
        )}
      </button>

      <p style={{ fontFamily: "var(--font-syne)", fontSize: "11px", color: "var(--lp-text-3)", letterSpacing: "0.03em", textAlign: "center" }}>
        Free during beta · No credit card · Launching Q2 2026
      </p>
    </form>
  );
}
