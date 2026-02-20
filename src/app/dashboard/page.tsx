'use client';

import { 
  Home, 
  Library, 
  CloudUpload, 
  FolderOpen, 
  User, 
  Play, 
  Clock, 
  Search, 
  Bell, 
  MoreHorizontal,
  Flame,
  ChevronRight,
  LogOut,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const recentAudios = [
    { id: 1, title: "Biology 101: Cell Theory", chapter: "Chapter 4", progress: 75, duration: "18:30", color: "#2585C7" },
    { id: 2, title: "Modern Physics: Quantum Mechanics", chapter: "Chapter 2", progress: 40, duration: "25:15", color: "#61E3F0" },
    { id: 3, title: "Introduction to Law", chapter: "Lesson 12", progress: 10, duration: "32:00", color: "#02013D" },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-[#02013D] font-sans overflow-hidden">
      
      {/* ========================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION (md:flex)      */}
      {/* ========================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#02013D] text-white p-8 border-r-8 border-[#2585C7] h-full relative z-[150]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2585C7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <Link href="/" className="flex items-center gap-3 mb-16 group relative z-10">
          <Image src="/images/logo.svg" alt="JackPal" width={40} height={40} className="brightness-0 invert group-hover:rotate-12 transition-transform" />
          <span className="text-2xl font-black italic tracking-tighter uppercase">JackPal</span>
        </Link>

        <nav className="flex-1 space-y-2 relative z-10">
          {[
            { id: 'home', icon: Home, label: 'Dashboard' },
            { id: 'library', icon: Library, label: 'Audio Library' },
            { id: 'files', icon: FolderOpen, label: 'Study Materials' },
            { id: 'profile', icon: User, label: 'Account Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                  ? 'bg-[#2585C7] text-white shadow-xl shadow-[#2585C7]/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5 relative z-10">
          <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-[#61E3F0] transition-colors">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA                          */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* DESKTOP TOP BAR (md:flex) */}
        <header className="hidden md:flex items-center justify-between px-10 py-6 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#02013D]/20 group-focus-within:text-[#2585C7] transition-colors" />
            <input 
              type="text" 
              placeholder="Search your library..." 
              className="w-full bg-[#F7F7F7] border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 font-bold text-xs focus:outline-none focus:border-[#2585C7] focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
             <button className="relative bg-white p-2.5 rounded-xl border border-[#EFEFEF] hover:border-[#2585C7] transition-all">
                <Bell className="h-5 w-5 text-[#02013D]/60" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#2585C7] rounded-full border-2 border-white" />
             </button>
             <div className="h-10 w-[1px] bg-[#EFEFEF]" />
             <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-black uppercase tracking-tighter">Winner Adamu</div>
                  <div className="text-[10px] font-bold text-[#2585C7] uppercase">Elite Student</div>
                </div>
                <div className="h-10 w-10 bg-[#2585C7] rounded-xl flex items-center justify-center text-white font-black italic">WA</div>
             </div>
          </div>
        </header>

        {/* MOBILE TOP BAR (block md:hidden) */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
           <div className="flex items-center gap-2">
             <Image src="/images/logo.svg" alt="JackPal" width={28} height={28} />
             <span className="text-lg font-black italic tracking-tighter uppercase">JackPal</span>
           </div>
           <button className="bg-[#2585C7] p-2 rounded-xl text-white shadow-lg shadow-[#2585C7]/20">
              <Bell className="h-5 w-5" />
           </button>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 pb-32 md:pb-10">
            
            {/* HERO SECTION (Split Desktop/Mobile styles) */}
            <section className="bg-[#02013D] rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden border-b-8 border-[#2585C7] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2585C7]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#2585C7]/20 text-[#2585C7] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">
                   <TrendingUp className="h-3 w-3" />
                   Performance Peak
                </div>
                <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                  Welcome back, <br />
                  <span className="text-[#2585C7] underline decoration-[#2585C7]/20 decoration-8 underline-offset-8">Top 1% Winner.</span>
                </h1>
                <p className="text-sm md:text-lg text-white/50 font-bold max-w-lg leading-relaxed">
                  Your study consistency is higher than 95% of students in Nigeria this week. Keep winning.
                </p>
              </div>
              <div className="flex gap-4 relative z-10">
                 <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 text-center min-w-[120px]">
                    <div className="text-[10px] font-black uppercase text-[#2585C7] mb-2 tracking-widest">Streak</div>
                    <div className="text-4xl font-black italic leading-none">14</div>
                    <div className="text-[10px] font-bold text-white/30 uppercase mt-1">Days</div>
                 </div>
                 <div className="bg-[#2585C7] p-6 rounded-[2rem] text-center min-w-[120px] shadow-2xl shadow-[#2585C7]/20">
                    <div className="text-[10px] font-black uppercase text-white/60 mb-2 tracking-widest">XP Level</div>
                    <div className="text-4xl font-black italic leading-none">450</div>
                    <div className="text-[10px] font-bold text-white/60 uppercase mt-1">Season 1</div>
                 </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-[1fr_320px] gap-10">
               {/* MAIN FEED */}
               <div className="space-y-10">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                        <Clock className="h-5 w-5 text-[#2585C7]" />
                        Resume Learning
                      </h3>
                      <button className="text-[10px] font-black uppercase tracking-widest text-[#2585C7] flex items-center gap-1 hover:underline">
                        View History <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                       {recentAudios.map((audio) => (
                         <div key={audio.id} className="bg-white p-6 rounded-[2rem] border-2 border-[#EFEFEF] shadow-sm hover:border-[#2585C7] hover:shadow-xl hover:shadow-[#2585C7]/5 transition-all group active:scale-95 cursor-pointer flex flex-col justify-between min-h-[180px]">
                            <div className="flex items-start justify-between">
                               <div className="space-y-1">
                                  <h4 className="font-black text-base tracking-tight leading-none group-hover:text-[#2585C7] transition-colors">{audio.title}</h4>
                                  <div className="text-[10px] font-bold text-[#02013D]/40 uppercase tracking-widest">{audio.chapter}</div>
                               </div>
                               <div className="bg-[#F7F7F7] p-3 rounded-2xl text-[#2585C7] border border-[#EFEFEF] group-hover:bg-[#2585C7] group-hover:text-white transition-all">
                                  <Play className="h-5 w-5 fill-current" />
                               </div>
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-[#02013D]/40">
                                  <span>Progress</span>
                                  <span>{audio.progress}%</span>
                               </div>
                               <div className="w-full h-2 bg-[#F7F7F7] rounded-full overflow-hidden border border-[#EFEFEF]">
                                  <div 
                                    className="h-full bg-[#2585C7] rounded-full relative overflow-hidden" 
                                    style={{ width: `${audio.progress}%` }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ width: '200%' }} />
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* DESKTOP CONTENT ADDITIONS */}
                  <section className="hidden md:grid grid-cols-2 gap-6">
                      <div className="bg-[#02013D] text-white p-8 rounded-[2.5rem] border-b-8 border-[#61E3F0] relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-20 h-20 bg-[#61E3F0]/10 rounded-full blur-2xl" />
                         <CloudUpload className="h-8 w-8 text-[#61E3F0] mb-4 group-hover:scale-110 transition-transform" />
                         <h4 className="text-xl font-black uppercase tracking-tighter mb-2">New Import</h4>
                         <p className="text-xs text-white/40 font-bold leading-relaxed mb-6">Drop a PDF, Word doc, or paste text to generate high-quality Nigerian AI audio.</p>
                         <button className="bg-[#61E3F0] text-[#02013D] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">Upload Now</button>
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#EFEFEF] space-y-4">
                         <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-[#2585C7]" />
                            <h4 className="text-sm font-black uppercase tracking-widest">DRM Security</h4>
                         </div>
                         <p className="text-xs text-[#02013D]/60 font-bold leading-relaxed">Your library is encrypted and locked to this device. No file sharing, no piracy. Pure focus.</p>
                         <div className="flex items-center gap-2 text-[10px] font-black text-[#2585C7] uppercase">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active Protection
                         </div>
                      </div>
                  </section>
               </div>

               {/* RIGHT SIDEBAR (Desktop Only) */}
               <aside className="hidden lg:block space-y-10">
                  <section className="space-y-6">
                     <h3 className="text-sm font-black uppercase tracking-widest">Active Voice Pack</h3>
                     <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[#EFEFEF] space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#2585C7]/5 rounded-full blur-2xl" />
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 bg-[#2585C7] rounded-2xl flex items-center justify-center text-white font-black italic">NG</div>
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-[#2585C7]">Lagos — Standard</div>
                              <div className="text-xs font-black">Yoruba/English</div>
                           </div>
                        </div>
                        <p className="text-xs text-[#02013D]/60 font-bold leading-relaxed">
                           "Relatable accents for 10x better retention."
                        </p>
                        <button className="w-full bg-[#F7F7F7] text-[#02013D] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#EFEFEF] transition-colors">Switch Model</button>
                     </div>
                  </section>

                  <section className="space-y-6">
                     <h3 className="text-sm font-black uppercase tracking-widest">Elite News</h3>
                     <div className="space-y-4">
                        {[
                          "New Voice Models: Hausa & Igbo arriving Q2.",
                          "Annual Winner's Challenge starts Monday.",
                          "JackPal for Professional Exams now in Beta."
                        ].map((news, i) => (
                          <div key={i} className="flex gap-4 group cursor-pointer">
                             <div className="h-2 w-2 bg-[#2585C7] rounded-full mt-1.5 flex-shrink-0" />
                             <p className="text-[11px] font-bold text-[#02013D]/70 group-hover:text-[#2585C7] transition-colors">{news}</p>
                          </div>
                        ))}
                     </div>
                  </section>
               </aside>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* MOBILE FLOATING DOCK (md:hidden)          */}
        {/* ========================================== */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#02013D] text-white rounded-[2rem] p-3 shadow-2xl z-[200] flex items-end justify-between border-t border-white/10 shadow-[#2585C7]/20 transition-transform active:translate-y-1">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'library', icon: Library, label: 'Library' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 group w-14 transition-all ${activeTab === item.id ? 'text-[#2585C7]' : 'text-white/40'}`}
            >
              <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}

          {/* Center Action Button (Upload) */}
          <button className="flex flex-col items-center -mt-10 group relative">
            <div className="w-16 h-16 bg-[#2585C7] rounded-full flex items-center justify-center shadow-xl shadow-[#2585C7]/40 border-8 border-[#F7F7F7] transform transition-transform group-active:scale-90 z-[10]">
              <CloudUpload className="h-7 w-7 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-[#2585C7] mt-1">Upload</span>
          </button>

          {[
            { id: 'files', icon: FolderOpen, label: 'Files' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 group w-14 transition-all ${activeTab === item.id ? 'text-[#2585C7]' : 'text-white/40'}`}
            >
              <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #EFEFEF;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2585C7;
        }
      `}</style>
    </div>
  );
}

// Mic2 Proxy Icon
function Mic2({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
      <circle cx="17" cy="7" r="5" />
    </svg>
  );
}
