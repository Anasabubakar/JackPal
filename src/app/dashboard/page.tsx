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
  Grid,
  Mic2,
  ArrowRight
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
    { label: "File", icon: FileText, color: "#2585C7", desc: "Upload PDFs, Word, or TXT" },
    { label: "Link/URL", icon: Link2, color: "#61E3F0", desc: "Import from any website" },
    { label: "Google Drive", icon: Cloud, color: "#0F1774", desc: "Connect your cloud library" },
    { label: "Web/External", icon: Globe, color: "#2261B9", desc: "External cloud platforms" },
    { label: "Image/Note", icon: ImageIcon, color: "#02013D", desc: "OCR for images and notes" },
    { label: "Video", icon: Video, color: "#2585C7", desc: "Extract audio from videos" },
  ];

  const recentAudios = [
    { id: 1, title: "Biology 101: Cell Theory", chapter: "Chapter 4", progress: 75, duration: "18:30", color: "#2585C7" },
    { id: 2, title: "Modern Physics: Quantum Mechanics", chapter: "Chapter 2", progress: 40, duration: "25:15", color: "#61E3F0" },
    { id: 3, title: "Introduction to Law", chapter: "Lesson 12", progress: 10, duration: "32:00", color: "#02013D" },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-[#02013D] font-sans overflow-hidden relative selection:bg-[#2585C7] selection:text-white">
      
      {/* Abstract Background Elements for Premium Look */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#2585C7]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#61E3F0]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ========================================== */}
      {/* MAIN CONTENT AREA                          */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
        
        {/* TOP BAR - Glassmorphic */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 bg-white/40 backdrop-blur-2xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] supports-[backdrop-filter]:bg-white/30">
          <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
               <Image src="/images/logo.svg" alt="JackPal" fill className="object-contain" />
            </div>
            <span className="text-lg sm:text-xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-[#2585C7] to-[#02013D] bg-clip-text text-transparent transform origin-left transition-transform duration-300 group-hover:scale-105">JackPal</span>
          </Link>
          
          {/* SEARCH (Hidden on very small mobile, expandable on tablet/desktop) */}
          <div className="hidden sm:block relative w-64 lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#02013D]/40 group-focus-within:text-[#2585C7] transition-colors z-10" />
            <input 
              type="text" 
              placeholder="Search your library..." 
              className="w-full bg-white/60 border border-white/80 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-semibold text-[#02013D] placeholder:text-[#02013D]/40 focus:outline-none focus:ring-2 focus:ring-[#2585C7]/30 focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all backdrop-blur-md"
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
             <button className="relative bg-white/50 backdrop-blur-md p-2.5 rounded-xl border border-white/60 hover:bg-white hover:shadow-md hover:scale-105 transition-all text-[#02013D]/70 hover:text-[#2585C7] group">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-tr from-[#2585C7] to-[#61E3F0] rounded-full border-2 border-white shadow-sm" />
             </button>
             
             <div className="hidden lg:block h-8 w-[1px] bg-[#02013D]/10" />
             
             <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl border border-white/50 hover:bg-white/60 transition-colors cursor-pointer group">
                <div className="hidden lg:block text-right">
                  <div className="text-[11px] font-black uppercase tracking-tighter text-[#02013D]">Winner Adamu</div>
                  <div className="text-[9px] font-bold text-[#2585C7] uppercase tracking-wider flex items-center justify-end gap-1">
                     <Flame className="w-2.5 h-2.5" /> Elite Member
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gradient-to-br from-[#2585C7] to-[#0F1774] rounded-xl flex items-center justify-center text-white font-black italic text-xs shadow-lg shadow-[#2585C7]/30 border border-white/20 group-hover:scale-105 transition-transform overflow-hidden relative">
                   <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                   WA
                </div>
             </div>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-40">
           <div className="mx-auto space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
             
             {/* STATS GRID - Responsive & Glassmorphic */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
               {[
                 { label: "Study Streak", value: "12 Days", icon: Flame, color: "#2585C7", gradient: "from-[#2585C7]/10 to-transparent" },
                 { label: "Hours Listened", value: "48.5h", icon: Clock, color: "#61E3F0", gradient: "from-[#61E3F0]/10 to-transparent" },
                 { label: "Retention", value: "92%", icon: TrendingUp, color: "#0F1774", gradient: "from-[#0F1774]/10 to-transparent" },
                 { label: "Materials", value: "24", icon: Library, color: "#2261B9", gradient: "from-[#2261B9]/10 to-transparent" },
               ].map((stat, i) => (
                 <div key={stat.label} 
                      className="bg-white/60 backdrop-blur-xl p-4 sm:p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(37,133,199,0.08)] transition-all group overflow-hidden relative flex flex-col justify-between min-h-[110px] sm:min-h-[130px] lg:min-h-[150px]"
                      style={{ animationDelay: `${i * 100}ms` }}
                 >
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.gradient} rounded-full blur-2xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500`} />
                   
                   <div className="flex items-start justify-between relative z-10 w-full">
                     <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border border-white/50 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: stat.color }} />
                     </div>
                     <span className="bg-white/80 backdrop-blur text-[9px] sm:text-[10px] font-bold text-[#02013D]/60 uppercase tracking-widest px-2 py-1 rounded-lg border border-white/50">
                        Top 5%
                     </span>
                   </div>
                   
                   <div className="flex flex-col gap-0.5 sm:gap-1 relative z-10 mt-4 sm:mt-6">
                      <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-[#02013D]/50 uppercase tracking-widest">{stat.label}</span>
                      <span className="text-xl sm:text-2xl lg:text-3xl font-black italic tracking-tighter uppercase text-[#02013D] group-hover:text-[#2585C7] transition-colors">{stat.value}</span>
                   </div>
                 </div>
               ))}
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-10">
                {/* Left Column: Hero & Recents */}
                <div className="xl:col-span-2 space-y-8 lg:space-y-10">
                   
                   {/* PREMIUM HERO SECTION */}
                   <section className="relative overflow-hidden bg-[#02013D] rounded-[2rem] lg:rounded-[3rem] p-6 sm:p-8 lg:p-12 shadow-[0_20px_40px_rgba(2,1,61,0.2)] group border border-white/10">
                      {/* Abstract Background for Hero */}
                      <div className="absolute top-0 right-0 w-full h-full bg-[url('/images/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                      <div className="absolute -top-[50%] -right-[20%] w-[100%] h-[150%] bg-gradient-to-b from-[#2585C7]/40 to-transparent blur-[100px] rounded-full group-hover:scale-105 group-hover:opacity-80 transition-all duration-700 ease-in-out pointer-events-none" />
                      <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-[#61E3F0]/20 blur-[80px] rounded-full group-hover:translate-x-10 transition-transform duration-1000 ease-in-out pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
                         <div className="space-y-4 sm:space-y-6 text-center md:text-left flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-fit mx-auto md:mx-0">
                               <span className="w-2 h-2 rounded-full bg-[#61E3F0] animate-pulse" />
                               <span className="text-[10px] font-bold text-white uppercase tracking-widest">Personalized Session</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-[1.1] text-white">
                               Master your <br className="hidden md:block" />
                               <span className="bg-gradient-to-r from-[#61E3F0] to-[#2585C7] bg-clip-text text-transparent">next lesson</span>
                            </h2>
                            <p className="text-white/70 text-xs sm:text-sm font-medium max-w-sm mx-auto md:mx-0 leading-relaxed">
                               We've curated a high-yield audio study session based on your weakness in Cellular Biology.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                               <button className="w-full sm:w-auto bg-gradient-to-r from-[#2585C7] to-[#2261B9] hover:from-[#61E3F0] hover:to-[#2585C7] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:shadow-[0_10px_20px_rgba(37,133,199,0.3)] hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2">
                                  <Play className="w-4 h-4 fill-white" /> Start Listening
                               </button>
                               <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Est. 25 Mins</span>
                            </div>
                         </div>
                         
                         {/* 3D-like Floating Element */}
                         <div className="hidden sm:flex relative w-48 h-48 lg:w-56 lg:h-56 items-center justify-center">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 rotate-12 group-hover:rotate-[15deg] transition-transform duration-700 ease-out" />
                            <div className="absolute inset-0 bg-gradient-to-br from-[#2585C7] to-transparent opacity-20 rounded-[3rem] -rotate-6 group-hover:-rotate-12 transition-transform duration-700 ease-out" />
                            <Mic2 className="w-20 h-20 text-[#61E3F0] relative z-10 filter drop-shadow-[0_0_15px_rgba(97,227,240,0.5)] group-hover:scale-110 transition-transform duration-500 delay-100" />
                         </div>
                      </div>
                   </section>

                   {/* RECENT AUDIOS */}
                   <section className="space-y-5 sm:space-y-6">
                      <div className="flex items-end justify-between">
                         <div>
                            <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-[#02013D]">Continue Learning</h2>
                            <p className="text-[10px] sm:text-xs font-bold text-[#02013D]/40 uppercase tracking-widest mt-1">Pick up where you left off</p>
                         </div>
                         <button className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#2585C7] flex items-center gap-1 hover:gap-2 transition-all p-2 bg-white/50 backdrop-blur-md rounded-xl border border-white/60 hover:bg-white hover:shadow-sm">
                            View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                         </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentAudios.map((audio, i) => (
                           <div key={audio.id} 
                                className="bg-white/60 backdrop-blur-xl group p-4 sm:p-5 rounded-[2rem] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(37,133,199,0.08)] hover:bg-white transition-all duration-300 flex items-center gap-4 cursor-pointer relative overflow-hidden"
                                style={{ animationDelay: `${(i + 4) * 100}ms` }}
                           >
                             <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#2585C7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                             
                             <div 
                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center text-white flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 border border-black/5 shadow-inner"
                                style={{ backgroundColor: audio.color }}
                             >
                                <Play className="h-6 w-6 sm:h-8 sm:w-8 fill-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                                {/* Subtle internal shine */}
                                <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
                             </div>
                             
                             <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex items-center justify-between">
                                   <div className="text-[9px] sm:text-[10px] font-bold text-[#2585C7] bg-[#2585C7]/10 px-2 py-0.5 rounded-md uppercase tracking-widest">{audio.chapter}</div>
                                   <span className="text-[9px] sm:text-[10px] font-bold text-[#02013D]/40 uppercase flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {audio.duration}
                                   </span>
                                </div>
                                <h4 className="text-sm sm:text-base font-black uppercase tracking-tighter text-[#02013D] truncate group-hover:text-[#2585C7] transition-colors">{audio.title}</h4>
                                <div className="flex items-center gap-3 pt-1">
                                   <div className="flex-1 h-2 bg-[#EFEFEF] rounded-full overflow-hidden shadow-inner">
                                      <div className="h-full bg-gradient-to-r from-[#2585C7] to-[#61E3F0] rounded-full relative" style={{ width: `${audio.progress}%` }}>
                                         <div className="absolute inset-0 bg-[#02013D]/10 mix-blend-overlay opacity-20" />
                                      </div>
                                   </div>
                                   <span className="text-[9px] sm:text-[10px] font-black text-[#02013D]/60 min-w-[30px]">{audio.progress}%</span>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                   </section>
                </div>

                {/* Right Column: Progress & Updates */}
                <aside className="space-y-6 lg:space-y-8">
                   
                   {/* DETAILED PROGRESS */}
                   <section className="bg-white/70 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-6 relative overflow-hidden group">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2585C7]/5 rounded-full blur-[40px] group-hover:bg-[#2585C7]/10 transition-colors" />
                      
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-[#02013D]/5 rounded-xl border border-[#02013D]/10">
                            <TrendingUp className="h-5 w-5 text-[#02013D]" />
                         </div>
                         <h3 className="text-sm sm:text-base font-black uppercase tracking-tighter text-[#02013D]">Weekly Overview</h3>
                      </div>
                      
                      <div className="space-y-5">
                         {[
                           { label: "Daily Goal", progress: 65, color: "#2585C7" },
                           { label: "Exam Readiness", progress: 82, color: "#61E3F0" },
                           { label: "Memory Retention", progress: 45, color: "#0F1774" },
                         ].map((p, i) => (
                           <div key={p.label} className="space-y-2" style={{ animationDelay: `${i * 150}ms` }}>
                             <div className="flex justify-between items-center px-1">
                               <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#02013D]/60">{p.label}</span>
                               <span className="text-[10px] sm:text-xs font-black text-[#02013D]">{p.progress}%</span>
                             </div>
                             <div className="h-2.5 bg-[#02013D]/5 rounded-full overflow-hidden border border-[#02013D]/5">
                               <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${p.progress}%`, backgroundColor: p.color }}>
                                  <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-[2px]" />
                               </div>
                             </div>
                           </div>
                         ))}
                      </div>
                      
                      <button className="w-full py-4 rounded-xl bg-gradient-to-b from-white to-[#F7F7F7] border border-[#EFEFEF] hover:border-[#2585C7]/30 hover:shadow-md transition-all text-[10px] font-black uppercase tracking-widest text-[#02013D] group/btn flex items-center justify-center gap-2">
                         Full Analytics Report <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </section>

                   {/* STUDENT UPDATES */}
                   <section className="bg-gradient-to-br from-[#2585C7]/5 to-[#61E3F0]/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/50 shadow-inner space-y-5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm">
                           <CheckCircle2 className="h-3.5 w-3.5 text-[#2585C7]" />
                        </div>
                        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-[#02013D]/70">Student Hub</h3>
                      </div>
                      <div className="space-y-3 pt-2">
                         {[
                           { text: "New Yorùbá voice model now available", tag: "New" },
                           { text: "Beta: AI Summary for Medical Students", tag: "Beta" },
                           { text: "Refer a friend and get 1 month Premium", tag: "Promo" },
                         ].map((news, i) => (
                           <div key={i} className="flex gap-3 items-start group cursor-pointer p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-white/80">
                              <div className="h-1.5 w-1.5 bg-[#2585C7] rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_5px_rgba(37,133,199,0.5)] group-hover:scale-150 transition-transform" />
                              <div className="space-y-1 mt-[-2px]">
                                 <p className="text-[10px] sm:text-xs font-bold text-[#02013D]/80 group-hover:text-[#2585C7] transition-colors leading-snug">{news.text}</p>
                                 <span className="inline-block text-[8px] font-black uppercase tracking-widest text-[#2585C7]/60 bg-[#2585C7]/10 px-1.5 py-0.5 rounded">{news.tag}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>

                </aside>
             </div>
           </div>
        </div>

        {/* DOCK WILL NEVER BE TOUCHED */}
        <Dock onCenterAction={() => setIsOthersModalOpen(true)} />

        {/* ========================================== */}
        {/* OTHERS UPLOAD MODAL (Intact logic, UI tweaked for glassmorphism) */}
        {/* ========================================== */}
        {isOthersModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-[#02013D]/40 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setIsOthersModalOpen(false)}
            />
            <div className="flex flex-col bg-white/80 backdrop-blur-3xl w-full max-w-2xl border border-white/60 shadow-[0_40px_80px_rgba(0,0,0,0.2)] relative z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 ease-out rounded-t-[2.5rem] rounded-b-none sm:rounded-[3rem] mt-auto sm:mt-0 mb-0 sm:mb-auto max-h-[90vh]">
              
              <div className="flex items-center justify-between p-6 sm:p-10 md:p-12 pb-2 sm:pb-6">
                <div className="space-y-1.5">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase italic text-[#02013D] flex items-center gap-3">
                     <CloudUpload className="h-7 w-7 sm:h-8 sm:w-8 text-[#2585C7]" />
                     Import 
                  </h3>
                  <p className="text-[10px] sm:text-xs font-bold text-[#02013D]/50 uppercase tracking-widest">Select source to generate audio</p>
                </div>
                <button 
                  onClick={() => setIsOthersModalOpen(false)}
                  className="bg-[#F0F2F5] hover:bg-[#EFEFEF] text-[#02013D] p-3 rounded-2xl transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-[#02013D]/10"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="p-6 sm:p-10 md:p-12 pt-2 sm:pt-4 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                  {allUploadOptions.map((option) => (
                    <button
                      key={option.label}
                      className="bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white hover:border-[#2585C7]/30 shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(37,133,199,0.1)] hover:-translate-y-1 transition-all duration-300 group text-left space-y-3 sm:space-y-4"
                    >
                      <div 
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: option.color }}
                      >
                        <option.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] sm:text-xs font-black uppercase tracking-tighter text-[#02013D] group-hover:text-[#2585C7] transition-colors">{option.label}</div>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[#02013D]/40 uppercase leading-snug">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#02013D]/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#02013D]/40">
                   <span className="bg-[#02013D]/5 px-3 py-1.5 rounded-lg">JackPal Secure Import</span>
                   <div className="flex items-center gap-2 text-[#2585C7]">
                      <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(2, 1, 61, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(37, 133, 199, 0.5);
        }
      ` }} />
    </div>
  );
}
