'use client';

import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  ShieldCheck,
  Mic2,
  Loader2 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    // Simulate Supabase password update delay
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-[#02013D] font-sans overflow-hidden">
      {/* Back Button */}
      <Link 
        href="/login" 
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#02013D]/60 hover:text-[#2585C7] transition-colors group"
      >
        <div className="bg-white p-2 rounded-full shadow-lg border border-[#EFEFEF] group-hover:-translate-x-1 transition-transform">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span>Back to Login</span>
      </Link>

      {/* Left Column: Brand & Visual (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#02013D] relative overflow-hidden flex-col justify-between p-16 text-white border-r-8 border-[#2585C7] h-full">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2585C7]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#61E3F0]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-10 group">
            <Image 
              src="/images/logo.svg" 
              alt="JackPal Logo" 
              width={40} 
              height={40} 
              className="group-hover:rotate-12 transition-transform"
            />
            <span className="text-2xl font-black tracking-tighter uppercase italic">JackPal</span>
          </Link>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-black leading-tight uppercase tracking-tighter">
              Secure Your<br />
              <span className="text-[#2585C7] italic underline decoration-8 decoration-[#2585C7]/20">New Access.</span>
            </h1>
            <p className="text-lg text-white/60 font-medium leading-relaxed">
              Create a strong new password to protect your library. Remember: winners take security seriously.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <ShieldCheck className="h-5 w-5 text-[#2585C7]" />
              <div className="text-xs font-black uppercase tracking-widest">DRM Secured</div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter leading-relaxed">Encrypted local storage for your studies.</p>
            </div>
            <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <Mic2 className="h-5 w-5 text-[#61E3F0]" />
              <div className="text-xs font-black uppercase tracking-widest">Local Voices</div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter leading-relaxed">AI tuned for Nigerian students.</p>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
             <span>&copy; 2026 JackPal Audio</span>
             <span>Account Recovery</span>
          </div>
        </div>
      </div>

      {/* Right Column: Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 relative h-full overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-10">
          {submitted ? (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="bg-[#2585C7]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-[#2585C7]">
                  <CheckCircle2 className="h-10 w-10 text-[#2585C7]" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Password Updated</h2>
                  <p className="text-xs text-[#02013D]/50 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                    Your password has been reset successfully. You can now use your new credentials to log in.
                  </p>
               </div>
               <Link 
                href="/login" 
                className="bg-[#02013D] text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#02013D]/10 hover:bg-[#2585C7] transition-all inline-block"
               >
                 Go to Login
               </Link>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left space-y-2">
                <div className="lg:hidden flex justify-center mb-6">
                  <Image src="/images/logo.svg" alt="JackPal Logo" width={48} height={48} />
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">New Password</h2>
                <p className="text-[10px] md:text-xs text-[#02013D]/50 font-bold uppercase tracking-[0.2em]">Update your credentials for secure access</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/40 px-1">New Password</label>
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

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#02013D]/40 px-1">Confirm New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#02013D]/30 group-focus-within:text-[#2585C7] transition-colors" />
                    </div>
                    <input 
                      required
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
