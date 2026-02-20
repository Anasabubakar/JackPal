'use client';

import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Mic2, 
  ShieldCheck 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-[#02013D] font-sans overflow-hidden">
      {/* Back Button */}
      <Link 
        href="/" 
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#02013D]/60 hover:text-[#2585C7] transition-colors group"
      >
        <div className="bg-white p-2 rounded-full shadow-lg border border-[#EFEFEF] group-hover:-translate-x-1 transition-transform">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span>Back to Home</span>
      </Link>

      {/* Left Column: Brand & Visual (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#02013D] relative overflow-hidden flex-col justify-between p-16 text-white border-r-8 border-[#2585C7] h-full">
        {/* Background Patterns */}
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 relative h-full overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-10">
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center mb-6">
               <Image src="/images/logo.svg" alt="JackPal Logo" width={48} height={48} />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Account Login</h2>
            <p className="text-[10px] md:text-xs text-[#02013D]/50 font-bold uppercase tracking-[0.2em]">Enter your credentials to proceed</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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

          <button className="w-full bg-white border-2 border-[#EFEFEF] text-[#02013D] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#F7F7F7] hover:border-[#02013D]/10 transition-all flex items-center justify-center gap-3">
             <Image src="https://www.google.com/favicon.ico" alt="Google" width={14} height={14} />
             Continue with Google
          </button>

          <div className="text-center pt-4">
            <p className="text-[10px] font-bold text-[#02013D]/40 uppercase tracking-[0.2em]">
              New to the Elite? <Link href="/#waitlist" className="text-[#2585C7] font-black hover:underline">Join the Waitlist</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
