'use client';

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";
import { acceptWorkspaceInvitation, getToken } from "@/lib/api";

function InviteAcceptInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qpToken = (searchParams.get("invite") || "").trim();

  const [tokenInput, setTokenInput] = useState(qpToken);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (qpToken) setTokenInput(qpToken);
  }, [qpToken]);

  const signedIn = mounted && !!getToken();

  async function accept(token: string) {
    const t = token.trim();
    if (!t) {
      setError("Enter an invitation token or open an invite link.");
      return;
    }
    if (!getToken()) {
      const next = `/dashboard/invite?invite=${encodeURIComponent(t)}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await acceptWorkspaceInvitation(t);
      const id = res.notebook?.id;
      if (id) {
        router.replace(`/dashboard?tab=workspace&notebook=${encodeURIComponent(id)}`);
      } else {
        router.replace("/dashboard?tab=workspace");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not accept invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio min-h-[100dvh] flex flex-col" style={{ background: "var(--ink)", color: "var(--text-1)" }}>
      <header
        className="studio studio-glass-chrome flex items-center justify-between gap-4 px-5 py-4 border-b"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] rounded-lg px-2 py-1"
          style={{ color: "var(--text-3)" }}
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <JackpalsLogo variant="wordmark" className="h-7 w-auto opacity-90" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="studio studio-glass studio-glass-interactive w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>
            <ShieldCheck size={22} strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold" style={{ fontFamily: "var(--font-syne)", color: "var(--text-1)" }}>
              Accept notebook invite
            </h1>
            <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-2)" }}>
              Join a shared JackPal notebook using the secure token from your invite link or email.
            </p>
          </div>

          {!signedIn && (
            <p className="text-[12px] rounded-xl px-3 py-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              You’ll be asked to sign in, then returned here to finish accepting.
            </p>
          )}

          <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Invite token
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              rows={3}
              placeholder="Paste token…"
              className="rounded-xl px-3 py-2 text-[13px] font-mono outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              autoComplete="off"
            />
          </label>

          {error && (
            <div className="rounded-xl px-3 py-2 text-[12px]" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.35)", color: "#fecaca" }} role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void accept(tokenInput)}
            className="w-full min-h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
            style={{ background: "var(--blue)" }}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            {busy ? "Accepting…" : signedIn ? "Accept & open notebook" : "Sign in & accept"}
          </button>

          <p className="text-[11px] text-center" style={{ color: "var(--text-3)" }}>
            Links look like{" "}
            <span className="font-mono text-[10px]" style={{ color: "var(--text-2)" }}>
              …/dashboard/invite?invite=…
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DashboardInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="studio min-h-[100dvh] flex items-center justify-center" style={{ background: "var(--ink)", color: "var(--text-2)" }}>
          <Loader2 className="animate-spin" size={28} aria-hidden />
        </div>
      }
    >
      <InviteAcceptInner />
    </Suspense>
  );
}
