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
  Headset
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');

  const recentAudios = [
    { id: 1, title: "Biology 101: Cell Theory", chapter: "Chapter 4", progress: 75, duration: "18:30" },
    { id: 2, title: "Modern Physics: Quantum Mechanics", chapter: "Chapter 2", progress: 40, duration: "25:15" },
    { id: 3, title: "Introduction to Law", chapter: "Lesson 12", progress: 10, duration: "32:00" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] text-[#02013D] font-sans pb-32">
      {/* Top Bar */}
      <header className="sticky top-0 z-[100] bg-[#F7F7F7]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-[#EFEFEF]">
        <div className="flex items-center gap-2">
          <Image src="/images/logo.svg" alt="JackPal" width={32} height={32} />
          <span className="text-xl font-black italic tracking-tighter uppercase">JackPal</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-white p-2 rounded-full shadow-sm border border-[#EFEFEF]">
            <Search className="h-5 w-5 text-[#02013D]/60" />
          </button>
          <button className="bg-white p-2 rounded-full shadow-sm border border-[#EFEFEF] relative">
            <Bell className="h-5 w-5 text-[#02013D]/60" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#2585C7] rounded-full border-2 border-white" />
          </button>
        </div>
      </header>

      <main className="px-6 py-8 space-y-10">
        {/* Elite Streak Card */}
        <section className="bg-[#02013D] rounded-[2.5rem] p-8 text-white relative overflow-hidden border-b-8 border-[#2585C7] shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2585C7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#2585C7] font-black text-xs uppercase tracking-widest">
                <Flame className="h-4 w-4 fill-current" />
                Elite Study Streak
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter">14 DAYS</h2>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest">You're in the Top 1% this week!</p>
            </div>
            <div className="bg-white/10 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
               <div className="text-[10px] font-black uppercase text-[#2585C7] text-center mb-1">XP Level</div>
               <div className="text-2xl font-black text-center">450</div>
            </div>
          </div>
        </section>

        {/* Recently Listened */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tighter">Resume Learning</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-[#2585C7] flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4">
            {recentAudios.map((audio) => (
              <div key={audio.id} className="bg-white p-5 rounded-3xl border border-[#EFEFEF] shadow-sm flex items-center gap-4 group hover:border-[#2585C7] transition-all active:scale-[0.98]">
                <div className="h-14 w-14 bg-[#F7F7F7] rounded-2xl flex items-center justify-center text-[#2585C7] border border-[#EFEFEF] group-hover:bg-[#2585C7]/10 transition-colors">
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-black text-sm tracking-tight leading-none">{audio.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#02013D]/40 uppercase tracking-widest">
                    <span>{audio.chapter}</span>
                    <span className="h-1 w-1 bg-[#02013D]/10 rounded-full" />
                    <span>{audio.duration}</span>
                  </div>
                  <div className="w-full h-1 bg-[#F7F7F7] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#2585C7] rounded-full" style={{ width: `${audio.progress}%` }} />
                  </div>
                </div>
                <button className="p-2 text-[#02013D]/20 hover:text-[#02013D]">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Voice Focus (Regional Mention) */}
        <section className="bg-[#2585C7]/5 p-8 rounded-[2rem] border-2 border-[#2585C7]/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#2585C7] p-2 rounded-xl text-white">
              <Mic2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest">Active Voice Pack</h3>
          </div>
          <p className="text-sm font-bold text-[#02013D]/70 leading-relaxed">
            You're using the <span className="text-[#2585C7]">Standard Lagos Accent</span>. Students with this voice pack retain 40% more than foreign voices.
          </p>
        </section>
      </main>

      {/* Floating Bottom Navigation Bar (Dock) */}
      <nav className="fixed bottom-6 left-6 right-6 bg-[#02013D] text-white rounded-[2rem] p-3 shadow-2xl z-[200] flex items-end justify-between border-t border-white/10 shadow-[#2585C7]/20">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 group w-14 transition-all ${activeTab === 'home' ? 'text-[#2585C7]' : 'text-white/40'}`}
        >
          <Home className={`h-5 w-5 ${activeTab === 'home' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1 group w-14 transition-all ${activeTab === 'library' ? 'text-[#2585C7]' : 'text-white/40'}`}
        >
          <Library className={`h-5 w-5 ${activeTab === 'library' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Library</span>
        </button>

        {/* Center Action Button (Upload) */}
        <button className="flex flex-col items-center -mt-10 group relative">
          <div className="w-16 h-16 bg-[#2585C7] rounded-full flex items-center justify-center shadow-xl shadow-[#2585C7]/40 border-8 border-[#F7F7F7] transform transition-transform group-active:scale-90 z-[10]">
            <CloudUpload className="h-7 w-7 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter text-[#2585C7] mt-1">Upload</span>
        </button>

        <button 
          onClick={() => setActiveTab('files')}
          className={`flex flex-col items-center gap-1 group w-14 transition-all ${activeTab === 'files' ? 'text-[#2585C7]' : 'text-white/40'}`}
        >
          <FolderOpen className={`h-5 w-5 ${activeTab === 'files' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Files</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 group w-14 transition-all ${activeTab === 'profile' ? 'text-[#2585C7]' : 'text-white/40'}`}
        >
          <User className={`h-5 w-5 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </button>
      </nav>
    </div>
  );
}

// Adding missing Mic2 import as a proxy for a Lucide icon if not already handled
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
