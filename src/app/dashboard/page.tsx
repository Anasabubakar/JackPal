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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [mounted, setMounted] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isOthersModalOpen, setIsOthersModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mainUploadOptions = [
    { label: "File (PDF, Docx)", icon: FileText, color: "#2585C7" },
    { label: "Link/URL", icon: Link2, color: "#61E3F0" },
    { label: "Google Drive", icon: Cloud, color: "#0F1774" },
  ];

  const allUploadOptions = [
    { label: "File (PDF, Docx)", icon: FileText, color: "#2585C7", desc: "Upload PDFs, Word, or TXT" },
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
    <div className="flex h-screen bg-[#F7F7F7] text-[#02013D] font-sans overflow-hidden">
      
      {/* ========================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION (md:flex)      */}
      {/* ========================================== */}
      <aside className="hidden md:flex flex-col w-60 bg-[#02013D] text-white p-6 border-r-4 border-[#2585C7] h-full relative z-[150]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2585C7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <Link href="/" className="flex items-center gap-3 mb-12 group relative z-10">
          <Image src="/images/logo.svg" alt="JackPal" width={32} height={32} className="brightness-0 invert group-hover:rotate-12 transition-transform" />
          <span className="text-xl font-black italic tracking-tighter uppercase">JackPal</span>
        </Link>

        <nav className="flex-1 space-y-1 relative z-10">
          {[
            { id: 'home', icon: Home, label: 'Dashboard' },
            { id: 'library', icon: Library, label: 'Audio Library' },
            { id: 'files', icon: FolderOpen, label: 'Study Materials' },
            { id: 'profile', icon: User, label: 'Account Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                  ? 'bg-[#2585C7] text-white shadow-lg shadow-[#2585C7]/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 relative z-10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#61E3F0] transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA                          */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* DESKTOP TOP BAR (md:flex) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
          <div className="relative w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#02013D]/20 group-focus-within:text-[#2585C7] transition-colors" />
            <input 
              type="text" 
              placeholder="Search your library..." 
              className="w-full bg-[#F7F7F7] border-2 border-transparent rounded-xl py-2 pl-10 pr-4 font-bold text-[10px] focus:outline-none focus:border-[#2585C7] focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
             <button className="relative bg-white p-2 rounded-lg border border-[#EFEFEF] hover:border-[#2585C7] transition-all">
                <Bell className="h-4 w-4 text-[#02013D]/60" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#2585C7] rounded-full border-2 border-white" />
             </button>
             <div className="h-8 w-[1px] bg-[#EFEFEF]" />
             <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-tighter">Winner Adamu</div>
                  <div className="text-[9px] font-bold text-[#2585C7] uppercase">Elite Member</div>
                </div>
                <div className="h-8 w-8 bg-[#2585C7] rounded-lg flex items-center justify-center text-white font-black italic text-xs">WA</div>
             </div>
          </div>
        </header>

        {/* MOBILE TOP BAR (block md:hidden) */}
        <header className="md:hidden flex items-center justify-between px-6 py-3 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
           <div className="flex items-center gap-2">
             <Image src="/images/logo.svg" alt="JackPal" width={24} height={24} />
             <span className="text-base font-black italic tracking-tighter uppercase">JackPal</span>
           </div>
           <button className="bg-[#2585C7] p-2 rounded-lg text-white shadow-lg shadow-[#2585C7]/20">
              <Bell className="h-4 w-4" />
           </button>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-32 md:pb-8">
            
            {/* HERO SECTION (Split Desktop/Mobile styles) */}
            <section className="bg-[#02013D] rounded-3xl md:rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden border-b-4 border-[#2585C7] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2585C7]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#2585C7]/20 text-[#2585C7] px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">
                   <TrendingUp className="h-3 w-3" />
                   Performance Peak
                </div>
                <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">
                  Welcome back, <br />
                  <span className="text-[#2585C7] underline decoration-[#2585C7]/20 decoration-4 underline-offset-4">Top 1% Winner.</span>
                </h1>
                <p className="text-xs md:text-base text-white/50 font-bold max-w-md leading-relaxed">
                  Your study consistency is higher than 95% of users in Nigeria this week. Keep winning.
                </p>
              </div>
              <div className="flex gap-3 relative z-10">
                 <div className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                    <div className="text-[9px] font-black uppercase text-[#2585C7] mb-1 tracking-widest">Streak</div>
                    <div className="text-3xl font-black italic leading-none">14</div>
                    <div className="text-[9px] font-bold text-white/30 uppercase mt-1">Days</div>
                 </div>
                 <div className="bg-[#2585C7] p-4 rounded-2xl text-center min-w-[100px] shadow-xl shadow-[#2585C7]/20">
                    <div className="text-[9px] font-black uppercase text-white/60 mb-1 tracking-widest">XP Level</div>
                    <div className="text-3xl font-black italic leading-none">450</div>
                    <div className="text-[9px] font-bold text-white/60 uppercase mt-1">Season 1</div>
                 </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-[1fr_280px] gap-8">
               {/* MAIN FEED */}
               <div className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#2585C7]" />
                        Resume Learning
                      </h3>
                      <button className="text-[9px] font-black uppercase tracking-widest text-[#2585C7] flex items-center gap-1 hover:underline">
                        View History <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                       {recentAudios.map((audio) => (
                         <div key={audio.id} className="bg-white p-5 rounded-2xl border-2 border-[#EFEFEF] shadow-sm hover:border-[#2585C7] hover:shadow-lg transition-all group active:scale-95 cursor-pointer flex flex-col justify-between min-h-[150px]">
                            <div className="flex items-start justify-between gap-2">
                               <div className="space-y-1">
                                  <h4 className="font-black text-sm tracking-tight leading-tight group-hover:text-[#2585C7] transition-colors line-clamp-2">{audio.title}</h4>
                                  <div className="text-[9px] font-bold text-[#02013D]/40 uppercase tracking-widest">{audio.chapter}</div>
                               </div>
                               <div className="bg-[#F7F7F7] p-2.5 rounded-xl text-[#2585C7] border border-[#EFEFEF] group-hover:bg-[#2585C7] group-hover:text-white transition-all shrink-0">
                                  <Play className="h-4 w-4 fill-current" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-[#02013D]/40">
                                  <span>Progress</span>
                                  <span>{audio.progress}%</span>
                               </div>
                               <div className="w-full h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden border border-[#EFEFEF]">
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
                  <section className="hidden md:grid grid-cols-2 gap-4">
                      <div className="bg-[#02013D] text-white p-6 rounded-2xl border-b-4 border-[#61E3F0] relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-16 h-16 bg-[#61E3F0]/10 rounded-full blur-2xl" />
                         <CloudUpload className="h-6 w-6 text-[#61E3F0] mb-3 group-hover:scale-110 transition-transform" />
                         <h4 className="text-lg font-black uppercase tracking-tighter mb-1">New Import</h4>
                         <p className="text-[10px] text-white/40 font-bold leading-relaxed mb-4">Drop a PDF, Word doc, or paste text to generate high-quality AI audio.</p>
                         <button className="bg-[#61E3F0] text-[#02013D] px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">Upload Now</button>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border-2 border-[#EFEFEF] space-y-3">
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-[#2585C7]" />
                            <h4 className="text-xs font-black uppercase tracking-widest">DRM Security</h4>
                         </div>
                         <p className="text-[10px] text-[#02013D]/60 font-bold leading-relaxed">Your library is encrypted and locked to this device. No file sharing, no piracy. Pure focus.</p>
                         <div className="flex items-center gap-2 text-[9px] font-black text-[#2585C7] uppercase">
                            <CheckCircle2 className="h-3 w-3" />
                            Active Protection
                         </div>
                      </div>
                  </section>
               </div>

               {/* RIGHT SIDEBAR (Desktop Only) */}
               <aside className="hidden lg:block space-y-8">
                  <section className="space-y-4">
                     <h3 className="text-xs font-black uppercase tracking-widest text-[#02013D]/40">Active Voice Pack</h3>
                     <div className="bg-white p-5 rounded-2xl border-2 border-[#EFEFEF] space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#2585C7]/5 rounded-full blur-2xl" />
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-[#2585C7] rounded-xl flex items-center justify-center text-white font-black italic text-xs">NG</div>
                           <div>
                              <div className="text-[9px] font-black uppercase tracking-widest text-[#2585C7]">Lagos — Standard</div>
                              <div className="text-[10px] font-black">Yoruba/English</div>
                           </div>
                        </div>
                        <p className="text-[10px] text-[#02013D]/60 font-bold leading-relaxed">
                           "Relatable accents for 10x better retention."
                        </p>
                        <button className="w-full bg-[#F7F7F7] text-[#02013D] py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#EFEFEF] transition-colors">Switch Model</button>
                     </div>
                  </section>

                  <section className="space-y-4">
                     <h3 className="text-xs font-black uppercase tracking-widest text-[#02013D]/40">Elite News</h3>
                     <div className="space-y-3">
                        {[
                          "New Voice Models: Hausa & Igbo arriving Q2.",
                          "Annual Winner's Challenge starts Monday.",
                          "JackPal for Pro Exams now in Beta."
                        ].map((news, i) => (
                          <div key={i} className="flex gap-3 group cursor-pointer">
                             <div className="h-1.5 w-1.5 bg-[#2585C7] rounded-full mt-1.5 flex-shrink-0" />
                             <p className="text-[10px] font-bold text-[#02013D]/70 group-hover:text-[#2585C7] transition-colors">{news}</p>
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

        {/* ========================================== */}
        {/* DESKTOP FLOATING ACTION BUTTON (FAB)      */}
        {/* ========================================== */}
        <div className="hidden md:block fixed bottom-10 right-10 z-[300]">
          <div className="relative">
            {/* Animated Menu */}
            <div className={`absolute bottom-20 right-0 space-y-4 transition-all duration-300 origin-bottom ${isAddMenuOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'}`}>
              {mainUploadOptions.map((option, index) => (
                <button
                  key={option.label}
                  className="flex items-center gap-4 group"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <span className="bg-[#02013D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10">
                    {option.label}
                  </span>
                  <div 
                    className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white"
                    style={{ backgroundColor: option.color }}
                  >
                    <option.icon className="h-6 w-6" />
                  </div>
                </button>
              ))}
              
              {/* Others Button */}
              <button
                onClick={() => {
                  setIsOthersModalOpen(true);
                  setIsAddMenuOpen(false);
                }}
                className="flex items-center gap-4 group"
                style={{ transitionDelay: `150ms` }}
              >
                <span className="bg-[#02013D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10">
                  More Options
                </span>
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white text-[#02013D] shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-[#02013D]">
                  <LayoutGrid className="h-6 w-6" />
                </div>
              </button>
            </div>

            {/* Main FAB Button */}
            <button 
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className={`h-20 w-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-[#2585C7]/40 border-4 border-white transition-all duration-500 transform ${isAddMenuOpen ? 'bg-[#02013D] rotate-[135deg]' : 'bg-[#2585C7] hover:scale-105 active:scale-95'}`}
            >
              {isAddMenuOpen ? <Plus className="h-10 w-10 text-[#61E3F0]" /> : <Plus className="h-10 w-10 text-white" />}
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* OTHERS UPLOAD MODAL (Bouncy)              */}
        {/* ========================================== */}
        {isOthersModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <div 
              className="absolute inset-0 bg-[#02013D]/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setIsOthersModalOpen(false)}
            />
            <div className="bg-[#F7F7F7] w-full max-w-2xl rounded-[3rem] border-8 border-[#02013D] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in spin-in-1 duration-500 hover:scale-[1.01] transition-transform">
              <div className="p-10 md:p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic">Import Library</h3>
                    <p className="text-xs font-bold text-[#02013D]/40 uppercase tracking-widest">Select your source to begin learning</p>
                  </div>
                  <button 
                    onClick={() => setIsOthersModalOpen(false)}
                    className="bg-[#02013D] text-white p-3 rounded-2xl hover:bg-[#2585C7] transition-colors active:scale-90"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {allUploadOptions.map((option) => (
                    <button
                      key={option.label}
                      className="bg-white p-6 rounded-[2rem] border-2 border-[#EFEFEF] hover:border-[#2585C7] hover:shadow-2xl hover:shadow-[#2585C7]/10 transition-all group text-left space-y-4"
                    >
                      <div 
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: option.color }}
                      >
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-tighter group-hover:text-[#2585C7] transition-colors">{option.label}</div>
                        <p className="text-[9px] font-bold text-[#02013D]/40 uppercase leading-none">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#EFEFEF] flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#02013D]/20">
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
          background: #2585C7;
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
