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
  CheckCircle2,
  Plus,
  FileText,
  Video,
  Link2,
  Image as ImageIcon,
  X,
  Cloud,
  Globe,
  LayoutGrid,
  Grid
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Dock } from "@/components/Dock";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [mounted, setMounted] = useState(false);
  const [isOthersModalOpen, setIsOthersModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allUploadOptions = [
    { label: "File", icon: FileText, color: "#B1121B", desc: "Upload PDFs, Word, or TXT" },
    { label: "Link/URL", icon: Link2, color: "#E10600", desc: "Import from any website" },
    { label: "Google Drive", icon: Cloud, color: "#111111", desc: "Connect your cloud library" },
    { label: "Web/External", icon: Globe, color: "#B1121B", desc: "External cloud platforms" },
    { label: "Image/Note", icon: ImageIcon, color: "#111111", desc: "OCR for images and notes" },
    { label: "Video", icon: Video, color: "#E10600", desc: "Extract audio from videos" },
  ];

  const recentAudios = [
    { id: 1, title: "Biology 101: Cell Theory", chapter: "Chapter 4", progress: 75, duration: "18:30", color: "#B1121B" },
    { id: 2, title: "Modern Physics: Quantum Mechanics", chapter: "Chapter 2", progress: 40, duration: "25:15", color: "#E10600" },
    { id: 3, title: "Introduction to Law", chapter: "Lesson 12", progress: 10, duration: "32:00", color: "#111111" },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-[#111111] font-sans overflow-hidden">
      
      {/* ========================================== */}
      {/* MAIN CONTENT AREA                          */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* DESKTOP TOP BAR */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt="JackPal" width={28} height={28} />
            <span className="text-xl font-black italic tracking-tighter uppercase text-[#B1121B]">JackPal</span>
          </Link>
          <div className="relative w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#111111]/20 group-focus-within:text-[#B1121B] transition-colors" />
            <input 
              type="text" 
              placeholder="Search your library..." 
              className="w-full bg-[#EFEFEF] border-2 border-transparent rounded-xl py-2 pl-10 pr-4 font-medium text-[12px] focus:outline-none focus:border-[#B1121B] focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
             <button className="relative bg-white p-2 rounded-lg border border-[#EFEFEF] hover:border-[#B1121B] transition-all">
                <Bell className="h-4 w-4 text-[#111111]/60" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#B1121B] rounded-full border-2 border-white" />
             </button>
             <div className="h-8 w-[1px] bg-[#EFEFEF]" />
             <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-tighter">Winner Adamu</div>
                  <div className="text-[9px] font-medium text-[#B1121B] uppercase">Elite Member</div>
                </div>
                <div className="h-8 w-8 bg-[#B1121B] rounded-lg flex items-center justify-center text-white font-black italic text-xs">WA</div>
             </div>
          </div>
        </header>

        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex items-center justify-between px-6 py-3 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
           <div className="flex items-center gap-2">
             <Image src="/images/logo.svg" alt="JackPal" width={24} height={24} />
             <span className="text-base font-black italic tracking-tighter uppercase text-[#B1121B]">JackPal</span>
           </div>
           <div className="flex items-center gap-3">
              <button className="relative bg-white p-2 rounded-lg border border-[#EFEFEF]">
                 <Bell className="h-4 w-4 text-[#111111]/60" />
                 <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#B1121B] rounded-full border-2 border-white" />
              </button>
              <div className="h-8 w-8 bg-[#B1121B] rounded-lg flex items-center justify-center text-white font-black italic text-xs shadow-lg shadow-[#B1121B]/20">WA</div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
           <div className="max-w-6xl mx-auto space-y-10">
             
             {/* Header Stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Study Streak", value: "12 Days", icon: Flame, color: "#B1121B" },
                 { label: "Hours Listened", value: "48.5h", icon: Clock, color: "#E10600" },
                 { label: "Knowledge retained", value: "92%", icon: TrendingUp, color: "#111111" },
                 { label: "Materials", value: "24", icon: Library, color: "#B1121B" },
               ].map((stat) => (
                 <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-[#EFEFEF] shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] group-hover:scale-150 transition-transform">
                      <stat.icon className="w-full h-full" style={{ color: stat.color }} />
                   </div>
                   <div className="flex flex-col gap-1 relative z-10">
                      <span className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-widest">{stat.label}</span>
                      <span className="text-2xl font-black italic tracking-tighter uppercase">{stat.value}</span>
                   </div>
                 </div>
               ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Col: Recents & Progress */}
                <div className="lg:col-span-2 space-y-10">
                   <section className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h2 className="text-2xl font-black italic tracking-tighter uppercase">Continue Learning</h2>
                         <button className="text-[10px] font-black uppercase tracking-widest text-[#B1121B] flex items-center gap-1 hover:gap-2 transition-all">
                            View Full Library <ChevronRight className="h-3 w-3" />
                         </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentAudios.map((audio) => (
                          <div key={audio.id} className="bg-white group p-5 rounded-[2.5rem] border border-[#EFEFEF] hover:border-[#B1121B] transition-all flex items-center gap-5 cursor-pointer relative overflow-hidden">
                             <div 
                                className="h-20 w-20 rounded-[1.5rem] flex items-center justify-center text-white flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform"
                                style={{ backgroundColor: audio.color }}
                             >
                                <Play className="h-8 w-8 fill-white" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                             </div>
                             <div className="flex-1 space-y-1.5">
                                <div className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-widest">{audio.chapter}</div>
                                <h4 className="text-sm font-black uppercase tracking-tighter line-clamp-1">{audio.title}</h4>
                                <div className="flex items-center gap-3">
                                   <div className="flex-1 h-1.5 bg-[#EFEFEF] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#B1121B] rounded-full" style={{ width: `${audio.progress}%` }} />
                                   </div>
                                   <span className="text-[9px] font-bold text-[#111111]/60">{audio.progress}%</span>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                   </section>

                   <section className="bg-[#111111] text-white p-10 rounded-[3rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#B1121B]/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#B1121B]/30 transition-colors" />
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                         <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Ready for your<br />next lesson?</h2>
                            <p className="text-white/60 text-sm font-medium max-w-sm">We've prepared a personalized study session based on your recent activity.</p>
                            <button className="bg-[#B1121B] hover:bg-[#E10600] text-white px-8 py-4 rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#B1121B]/20">
                               Start Now
                            </button>
                         </div>
                         <div className="h-40 w-40 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center p-8 group-hover:rotate-6 transition-transform">
                            <Mic2 className="w-full h-full text-[#B1121B]" />
                         </div>
                      </div>
                   </section>
                </div>

                {/* Right Col: Quick Actions & News */}
                <aside className="space-y-6">
                   <section className="bg-white p-8 rounded-[3rem] border border-[#EFEFEF] space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-tighter">Your Progress</h3>
                      <div className="space-y-6">
                         {[
                           { label: "Daily Goal", progress: 65, color: "#B1121B" },
                           { label: "Exam Readiness", progress: 82, color: "#E10600" },
                           { label: "Memory Retention", progress: 45, color: "#111111" },
                         ].map((p) => (
                           <div key={p.label} className="space-y-2">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                               <span className="text-[#111111]/40">{p.label}</span>
                               <span className="text-[#111111]">{p.progress}%</span>
                             </div>
                             <div className="h-2 bg-[#EFEFEF] rounded-full overflow-hidden">
                               <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                             </div>
                           </div>
                         ))}
                      </div>
                      <button className="w-full py-4 rounded-2xl bg-[#EFEFEF] hover:bg-[#B1121B] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group">
                         Detailed Analytics <ArrowRight className="inline-block h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                   </section>

                   <section className="bg-[#EFEFEF]/50 p-8 rounded-[3rem] border border-[#EFEFEF] space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#B1121B]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]/60">Student Updates</h3>
                      </div>
                      <div className="space-y-4">
                         {[
                           "New Yorùbá voice model now available",
                           "Beta: AI Summary for Medical Students",
                           "Refer a friend and get 1 month Premium",
                         ].map((news, i) => (
                           <div key={i} className="flex gap-3 group cursor-pointer">
                              <div className="h-1.5 w-1.5 bg-[#B1121B] rounded-full mt-1.5 flex-shrink-0" />
                              <p className="text-[10px] font-bold text-[#111111]/70 group-hover:text-[#B1121B] transition-colors">{news}</p>
                           </div>
                         ))}
                      </div>
                   </section>
                </aside>
             </div>
           </div>
        </div>

        <Dock type="dashboard" onCenterAction={() => setIsOthersModalOpen(true)} />

        {/* ========================================== */}
        {/* OTHERS UPLOAD MODAL (Glassmorphic)         */}
        {/* ========================================== */}
        {isOthersModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <div 
              className="absolute inset-0 bg-[#111111]/40 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setIsOthersModalOpen(false)}
            />
            <div className="bg-white/80 backdrop-blur-2xl w-full max-w-2xl rounded-[3rem] border border-white/50 shadow-2xl relative z-10 overflow-hidden animate-in zoom-in spin-in-1 duration-500">
              <div className="p-10 md:p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic">Import Library</h3>
                    <p className="text-xs font-bold text-[#111111]/40 uppercase tracking-widest">Select your source to begin learning</p>
                  </div>
                  <button 
                    onClick={() => setIsOthersModalOpen(false)}
                    className="bg-[#111111] text-white p-3 rounded-2xl hover:bg-[#B1121B] transition-colors active:scale-90"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {allUploadOptions.map((option) => (
                    <button
                      key={option.label}
                      className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-[#EFEFEF] hover:border-[#B1121B] hover:shadow-2xl hover:shadow-[#B1121B]/10 transition-all group text-left space-y-4"
                    >
                      <div 
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: option.color }}
                      >
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-tighter group-hover:text-[#B1121B] transition-colors">{option.label}</div>
                        <p className="text-[9px] font-bold text-[#111111]/40 uppercase leading-none">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#EFEFEF] flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]/20">
                   <span>JackPal Secure Import</span>
                   <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Military-grade Encryption</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
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
          background: #B1121B;
        }
      ` }} />
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

function ArrowRight({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
