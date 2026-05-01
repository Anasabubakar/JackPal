"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";

type WaitlistCtx = {
  openWaitlist: () => void;
  closeWaitlist: () => void;
};

const WaitlistContext = createContext<WaitlistCtx | null>(null);

export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) {
    throw new Error("useWaitlist must be used within WaitlistProvider");
  }
  return ctx;
}

const LEVELS = [
  { value: "", label: "Select level" },
  { value: "100l", label: "100 Level" },
  { value: "200l", label: "200 Level" },
  { value: "300l", label: "300 Level" },
  { value: "400l", label: "400 Level / Final year" },
  { value: "pg", label: "Postgraduate" },
  { value: "jamb_waec", label: "JAMB / WAEC / Pre-university" },
  { value: "other", label: "Other" },
];

const USE_CASES = [
  { value: "", label: "What will you use Jackpals for most?" },
  { value: "commute", label: "Listening on commutes" },
  { value: "revision", label: "Exam revision & cram sessions" },
  { value: "offline", label: "Offline study (low data)" },
  { value: "accessibility", label: "Less screen time / eye strain" },
  { value: "seminar", label: "Private seminar–style explanations" },
  { value: "vision", label: "Scanning notes & handwritten pages" },
  { value: "other", label: "Something else" },
];

const REFERRALS = [
  { value: "", label: "How did you hear about us? (optional)" },
  { value: "friend", label: "Friend or classmate" },
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp / campus group" },
  { value: "search", label: "Google / search" },
  { value: "other", label: "Other" },
];

type FormStatus = "idle" | "loading" | "success" | "error";

function WaitlistModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [level, setLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [primaryUse, setPrimaryUse] = useState("");
  const [struggle, setStruggle] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [wantsNigerianVoices, setWantsNigerianVoices] = useState(true);

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setErrorMsg("");
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    }, 100);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;

    setErrorMsg("");
    if (!fullName.trim() || !email.trim() || !institution.trim() || !level || !fieldOfStudy.trim() || !primaryUse || !struggle.trim()) {
      setStatus("error");
      setErrorMsg("Please fill in every required field.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          institution: institution.trim(),
          level,
          fieldOfStudy: fieldOfStudy.trim(),
          primaryUse,
          struggle: struggle.trim(),
          referralSource: referralSource || undefined,
          wantsNigerianVoices,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong. Try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Check your connection.");
    }
  }

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="jp-wl"
          className="jp-wl-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="jp-wl-backdrop"
            aria-label="Close waitlist"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            className="jp-wl-panel"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="jp-wl-glow" aria-hidden />
            <button type="button" className="jp-wl-close" onClick={onClose} aria-label="Close">
              <X size={20} strokeWidth={2} />
            </button>

            {status === "success" ? (
              <motion.div
                className="jp-wl-success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="jp-wl-success-icon">
                  <CheckCircle2 size={44} strokeWidth={1.75} />
                </div>
                <h2 id={`${id}-title`}>You&apos;re in.</h2>
                <p>
                  You&apos;re on the list at <strong>{email}</strong>. We&apos;ll email you about launch and early access
                  when there&apos;s something worth your time.
                </p>
                <button type="button" className="jp-wl-done" onClick={onClose}>
                  Close
                </button>
              </motion.div>
            ) : (
              <>
                <div className="jp-wl-header">
                  <h2 id={`${id}-title`}>Join the Jackpals waitlist</h2>
                  <p>Tell us a bit about your study life — we use this to shape the product and your invite.</p>
                </div>

                <form className="jp-wl-form" onSubmit={handleSubmit} noValidate>
                  <div className="jp-wl-grid">
                    <div className="jp-wl-field jp-wl-span2">
                      <label htmlFor={`${id}-name`}>Full name *</label>
                      <input
                        id={`${id}-name`}
                        autoComplete="name"
                        placeholder="e.g. Chiamaka Okonkwo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="jp-wl-field">
                      <label htmlFor={`${id}-email`}>Email *</label>
                      <input
                        id={`${id}-email`}
                        type="email"
                        autoComplete="email"
                        placeholder="you@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="jp-wl-field">
                      <label htmlFor={`${id}-phone`}>Phone / WhatsApp <span className="jp-wl-opt">optional</span></label>
                      <input
                        id={`${id}-phone`}
                        type="tel"
                        autoComplete="tel"
                        placeholder="+234 …"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="jp-wl-field jp-wl-span2">
                      <label htmlFor={`${id}-school`}>School or university *</label>
                      <input
                        id={`${id}-school`}
                        placeholder="Where are you studying?"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                      />
                    </div>
                    <div className="jp-wl-field">
                      <label htmlFor={`${id}-level`}>Level *</label>
                      <select
                        id={`${id}-level`}
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        required
                      >
                        {LEVELS.map((o) => (
                          <option key={o.value || "empty"} value={o.value} disabled={o.value === ""}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="jp-wl-field">
                      <label htmlFor={`${id}-course`}>Field of study *</label>
                      <input
                        id={`${id}-course`}
                        placeholder="e.g. Pharmacy, Computer Science"
                        value={fieldOfStudy}
                        onChange={(e) => setFieldOfStudy(e.target.value)}
                      />
                    </div>
                    <div className="jp-wl-field jp-wl-span2">
                      <label htmlFor={`${id}-use`}>Primary use *</label>
                      <select
                        id={`${id}-use`}
                        value={primaryUse}
                        onChange={(e) => setPrimaryUse(e.target.value)}
                        required
                      >
                        {USE_CASES.map((o) => (
                          <option key={o.value || "u-empty"} value={o.value} disabled={o.value === ""}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="jp-wl-field jp-wl-span2">
                      <label htmlFor={`${id}-struggle`}>Biggest study struggle right now *</label>
                      <textarea
                        id={`${id}-struggle`}
                        rows={3}
                        placeholder="Long commutes, noisy hostels, foreign-sounding TTS, retention…?"
                        value={struggle}
                        onChange={(e) => setStruggle(e.target.value)}
                      />
                    </div>
                    <div className="jp-wl-field jp-wl-span2">
                      <label htmlFor={`${id}-ref`}>Discovery</label>
                      <select
                        id={`${id}-ref`}
                        value={referralSource}
                        onChange={(e) => setReferralSource(e.target.value)}
                      >
                        {REFERRALS.map((o) => (
                          <option key={o.value || "r-empty"} value={o.value} disabled={o.value === ""}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="jp-wl-check jp-wl-span2">
                      <input
                        type="checkbox"
                        checked={wantsNigerianVoices}
                        onChange={(e) => setWantsNigerianVoices(e.target.checked)}
                      />
                      <span>
                        I want early access to <strong>Nigerian AI voices</strong>, offline downloads, and launch
                        pricing for students.
                      </span>
                    </label>
                  </div>

                  {status === "error" && errorMsg && (
                    <p className="jp-wl-error" role="alert">
                      {errorMsg}
                    </p>
                  )}

                  <button type="submit" className="jp-wl-submit" disabled={status === "loading"}>
                    {status === "loading" ? (
                      <>
                        <Loader2 className="jp-wl-spin" size={18} aria-hidden />
                        Joining…
                      </>
                    ) : (
                      <>
                        Join the waitlist
                        <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
                      </>
                    )}
                  </button>
                  <p className="jp-wl-trust">
                    Free during beta · No credit card · We only email about launch and early access — no spam.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

export function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openWaitlist = useCallback(() => setOpen(true), []);
  const closeWaitlist = useCallback(() => setOpen(false), []);

  return (
    <WaitlistContext.Provider value={{ openWaitlist, closeWaitlist }}>
      {children}
      <WaitlistModal open={open} onClose={closeWaitlist} />
    </WaitlistContext.Provider>
  );
}
