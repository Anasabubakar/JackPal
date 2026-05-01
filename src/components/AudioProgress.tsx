import React from 'react';
import { cn } from '@/lib/utils';

interface AudioProgressProps {
  progress: number;
  label: string;
}

export const AudioProgress: React.FC<AudioProgressProps> = ({ progress, label }) => {
  return (
    <div className="group relative w-full py-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-200/60">{label}</span>
        <span className="text-xs font-bold text-white tabular-nums">{Math.round(progress)}%</span>
      </div>
      
      {/* Container with depth */}
      <div className="relative h-2 w-full rounded-full bg-slate-900/40 backdrop-blur-sm border border-white/5 overflow-hidden shadow-inner">
        {/* Track layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
        
        {/* Progress fill with depth */}
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-[600ms] cubic-bezier(0.34, 1.56, 0.64, 1) bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          style={{ width: `${progress}%` }}
        />
        
        {/* Shine effect */}
        <div className="absolute inset-y-0 left-0 rounded-full w-full bg-gradient-to-b from-white/10 to-transparent opacity-50" />
      </div>

      {/* Interactive Handle */}
      <div 
        className="absolute top-[32px] -translate-y-1/2 -ml-2 w-4 h-4 transition-all duration-[600ms] cubic-bezier(0.34, 1.56, 0.64, 1)"
        style={{ left: `${progress}%` }}
      >
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-75 group-hover:scale-100 transition-transform duration-300" />
          <div className="absolute -inset-2 rounded-full border border-white/20 animate-[ripple_2s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
};
