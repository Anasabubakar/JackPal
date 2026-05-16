'use client';

import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Mic2,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabase-browser";

const GOOGLE_LOGIN_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const needsConfirm = searchParams.get("confirm") === "1";
  const nextPath = searchParams.get("next");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      // signInWithGoogle redirects — no further action needed
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(email, password);
      const dest = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";
      router.push(dest);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col lg:flex-row bg-[#F7F7F7] text-[#02013D] font-sans overflow-x-hidden">
      {/* Back Button */}
      <Link
        href="/"
        className="fixed z-50 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#02013D]/60 hover:text-[#2585C7] transition-colors group"
        style={{
          top: "max(1.5rem, env(safe-area-inset-top))",
          left: "max(1.5rem, env(safe-area-inset-left))",
        }}
      >
        <div className="bg-white p-2 rounded-full shadow-lg border border-[#EFEFEF] group-hover:-translate-x-1 transition-transform">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span>Back to Home</span>
      </Link>

      {/* Left Column: Brand & Visual (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#02013D] relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white border-r-8 border-[#2585C7] lg:min-h-screen">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2585C7]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#61E3F0]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <Link href="/" className="inline-block mb-10 group">
            <JackpalsLogo
              variant="footer"
              priority
              className="h-11 w-auto max-w-[220px] drop-shadow-sm group-hover:opacity-95 transition-opacity"
            />
          </Link>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-black leading-tight uppercase tracking-tighter">
              Welcome Back,<br />
              <span className="text-[#2585C7] italic underline decoration-8 decoration-[#2585C7]/20">Winner.</span>
            </h1>
            <p className="text-lg text-white/60 font-medium leading-relaxed">
              Log in to access your secure audio library and continue your journey to the Top 1%.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <Mic2 className="h-5 w-5 text-[#2585C7]" />
              <div className="text-xs font-black uppercase tracking-widest">Nigerian Voices</div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter leading-relaxed">Relatable accents for 10x better retention.</p>
            </div>
            <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <ShieldCheck className="h-5 w-5 text-[#61E3F0]" />
              <div className="text-xs font-black uppercase tracking-widest">DRM Secured</div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter leading-relaxed">Your library is encrypted and offline-ready.</p>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
             <span>&copy; 2026 JackPal Audio</span>
             <span>Built for the Elite</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 relative flex-1 min-h-0 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-10">
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center mb-6">
              <JackpalsLogo variant="footer" priority className="h-11 w-auto max-w-[200px]" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Account Login</h2>
            <p className="text-[10px] md:text-xs text-[#02013D]/50 font-bold uppercase tracking-[0.2em]">Enter your credentials to proceed</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {needsConfirm && !error && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Account created — check your email to confirm, then log in here.</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/40 px-1">Student Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#02013D]/30 group-focus-within:text-[#2585C7] transition-colors" />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-white border-2 border-[#EFEFEF] rounded-xl py-3.5 pl-11 pr-4 font-bold text-xs text-[#02013D] placeholder-[#02013D]/20 focus:outline-none focus:border-[#2585C7] transition-all"
                  placeholder="winner@student.edu.ng"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/40">Password</label>
                <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2585C7] hover:underline">Forgot?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#02013D]/30 group-focus-within:text-[#2585C7] transition-colors" />
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-white border-2 border-[#EFEFEF] rounded-xl py-3.5 pl-11 pr-4 font-bold text-xs text-[#02013D] placeholder-[#02013D]/20 focus:outline-none focus:border-[#2585C7] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-1">
              <input
                id="remember"
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-[#EFEFEF] text-[#2585C7] focus:ring-[#2585C7] cursor-pointer"
              />
              <label htmlFor="remember" className="text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/60 cursor-pointer">Remember device</label>
            </div>

            <button
              disabled={loading}
              className="w-full bg-[#02013D] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#02013D]/10 hover:bg-[#2585C7] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Log in Now <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#EFEFEF]"></div>
            <span className="flex-shrink mx-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/20">Social Access</span>
            <div className="flex-grow border-t border-[#EFEFEF]"></div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={GOOGLE_LOGIN_ENABLED ? handleGoogleLogin : undefined}
              disabled={!GOOGLE_LOGIN_ENABLED || googleLoading || loading}
              aria-disabled={!GOOGLE_LOGIN_ENABLED}
              tabIndex={GOOGLE_LOGIN_ENABLED ? 0 : -1}
              className={`w-full bg-white border-2 border-[#EFEFEF] text-[#02013D] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 select-none ${
                GOOGLE_LOGIN_ENABLED
                  ? "hover:bg-[#F7F7F7] hover:border-[#02013D]/10 disabled:opacity-60 disabled:pointer-events-none"
                  : "blur-[3px] opacity-50 pointer-events-none cursor-not-allowed"
              }`}
            >
            {googleLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-[#02013D]/20 border-t-[#02013D] rounded-full animate-spin" />
            ) : (
              <Image src="https://www.google.com/favicon.ico" alt="" width={14} height={14} unoptimized aria-hidden />
            )}
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>
            {!GOOGLE_LOGIN_ENABLED && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-[#F7F7F7]/75 backdrop-blur-[2px] px-4 text-center"
                role="status"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#02013D]/70">
                  Invite-only during beta
                </p>
                <p className="text-[8px] font-bold uppercase tracking-wider text-[#02013D]/45 max-w-[240px] leading-relaxed">
                  Google sign-in is for approved beta testers. Use email and password, or{" "}
                  <Link href="/" className="text-[#2585C7] hover:underline">
                    join the waitlist
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          <div className="text-center pt-4">
            <p className="text-[10px] font-bold text-[#02013D]/40 uppercase tracking-[0.2em]">
              <Link href="/forgot-password" className="text-[#02013D]/40 hover:text-[#2585C7] font-black hover:underline">Forgot password?</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
