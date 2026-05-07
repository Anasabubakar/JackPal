'use client';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Mic2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { saveSession } from "@/lib/api";
import { getSupabase } from "@/lib/supabase-browser";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";

export default function ResetPasswordClient() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [linkStatus, setLinkStatus] = useState<"checking" | "ready" | "error">("checking");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getSupabase();
        const { error: initError } = await supabase.auth.initialize();
        if (cancelled) return;
        if (initError) {
          setLinkStatus("error");
          setLinkError(initError.message);
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (cancelled) return;
        if (sessionError) {
          setLinkStatus("error");
          setLinkError(sessionError.message);
          return;
        }
        if (!session) {
          setLinkStatus("error");
          setLinkError(
            "This reset link is invalid or has expired. Request a new one from the login page.",
          );
          return;
        }

        setLinkStatus("ready");

        if (typeof window !== "undefined") {
          const { hash, search } = window.location;
          if (
            hash ||
            (search &&
              (search.includes("code=") ||
                search.includes("access_token=") ||
                search.includes("type=")))
          ) {
            window.history.replaceState(null, "", "/reset-password");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLinkStatus("error");
          setLinkError(e instanceof Error ? e.message : "Could not verify reset link.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        saveSession(session.access_token, {
          id: session.user.id,
          email: session.user.email!,
          full_name:
            (session.user.user_metadata?.full_name as string | undefined) ?? "",
        });
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col lg:flex-row bg-[#F7F7F7] text-[#02013D] font-sans overflow-x-hidden">
      <Link
        href="/login"
        className="fixed z-50 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#02013D]/60 hover:text-[#2585C7] transition-colors group"
        style={{
          top: "max(1.5rem, env(safe-area-inset-top))",
          left: "max(1.5rem, env(safe-area-inset-left))",
        }}
      >
        <div className="bg-white p-2 rounded-full shadow-lg border border-[#EFEFEF] group-hover:-translate-x-1 transition-transform">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span>Back to Login</span>
      </Link>

      <div className="hidden lg:flex lg:w-1/2 bg-[#02013D] relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white border-r-8 border-[#2585C7] lg:min-h-screen">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2585C7]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#61E3F0]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <Link href="/" className="inline-block mb-10 group">
            <JackpalsLogo
              variant="wordmark"
              priority
              className="h-9 w-auto drop-shadow-sm group-hover:opacity-95 transition-opacity"
            />
          </Link>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-black leading-tight uppercase tracking-tighter">
              Secure Your
              <br />
              <span className="text-[#2585C7] italic underline decoration-8 decoration-[#2585C7]/20">
                New Access.
              </span>
            </h1>
            <p className="text-lg text-white/60 font-medium leading-relaxed">
              Create a strong new password to protect your library. Remember: winners take security
              seriously.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <ShieldCheck className="h-5 w-5 text-[#2585C7]" />
              <div className="text-xs font-black uppercase tracking-widest">DRM Secured</div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter leading-relaxed">
                Encrypted local storage for your studies.
              </p>
            </div>
            <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <Mic2 className="h-5 w-5 text-[#61E3F0]" />
              <div className="text-xs font-black uppercase tracking-widest">Local Voices</div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter leading-relaxed">
                AI tuned for Nigerian students.
              </p>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
            <span>&copy; 2026 JackPal Audio</span>
            <span>Account Recovery</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 relative flex-1 min-h-0 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-10">
          {submitted ? (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="bg-[#2585C7]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-[#2585C7]">
                <CheckCircle2 className="h-10 w-10 text-[#2585C7]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
                  Password Updated
                </h2>
                <p className="text-xs text-[#02013D]/50 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                  Your password has been reset successfully. You can go to the dashboard or log in
                  again anytime.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="bg-[#02013D] text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#02013D]/10 hover:bg-[#2585C7] transition-all inline-block"
              >
                Continue to Dashboard
              </Link>
            </div>
          ) : linkStatus === "checking" ? (
            <div className="text-center space-y-6 py-16">
              <Loader2 className="h-10 w-10 text-[#2585C7] animate-spin mx-auto" aria-hidden />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#02013D]/50">
                Verifying your reset link…
              </p>
            </div>
          ) : linkStatus === "error" ? (
            <div className="text-center space-y-6">
              <div className="lg:hidden flex justify-center mb-6">
                <JackpalsLogo variant="wordmark" priority className="h-10 w-auto" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase">Link problem</h2>
              <p className="text-xs text-[#02013D]/60 font-medium leading-relaxed">{linkError}</p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#2585C7] hover:underline"
              >
                Request a new link <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left space-y-2">
                <div className="lg:hidden flex justify-center mb-6">
                  <JackpalsLogo variant="wordmark" priority className="h-10 w-auto" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
                  New Password
                </h2>
                <p className="text-[10px] md:text-xs text-[#02013D]/50 font-bold uppercase tracking-[0.2em]">
                  Update your credentials for secure access
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/40 px-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#02013D]/30 group-focus-within:text-[#2585C7] transition-colors" />
                    </div>
                    <input
                      required
                      minLength={8}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full bg-white border-2 border-[#EFEFEF] rounded-xl py-3.5 pl-11 pr-4 font-bold text-xs text-[#02013D] placeholder-[#02013D]/20 focus:outline-none focus:border-[#2585C7] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/40 px-1">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#02013D]/30 group-focus-within:text-[#2585C7] transition-colors" />
                    </div>
                    <input
                      required
                      minLength={8}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full bg-white border-2 border-[#EFEFEF] rounded-xl py-3.5 pl-11 pr-4 font-bold text-xs text-[#02013D] placeholder-[#02013D]/20 focus:outline-none focus:border-[#2585C7] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-[#02013D] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#02013D]/10 hover:bg-[#2585C7] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Updating Access...
                    </>
                  ) : (
                    <>
                      Reset My Password <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
