import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AudioProgressProps {
  progress: number;
  label: string;
}

export const AudioProgress: React.FC<AudioProgressProps> = ({ progress, label }) => {
  // Generate 40 pseudo-random bars for the waveform
  const bars = useMemo(() => Array.from({ length: 40 }, () => Math.random() * 0.6 + 0.4), []);

  return (
    <div className="group relative w-full py-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</span>
        <span className="text-xs font-mono text-white/80">{Math.round(progress)}%</span>
      </div>

      <div className="relative flex items-center justify-between gap-1 h-12 px-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 shadow-2xl">
        {bars.map((height, i) => {
          const isActive = (i / bars.length) * 100 <= progress;
          return (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-t from-indigo-500 to-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" 
                  : "bg-white/10"
              )}
              style={{
                height: `${height * 100}%`,
                animation: isActive ? `wave-pulse 1.5s infinite ease-in-out ${i * 0.05}s` : 'none'
              }}
            />
          );
        })}
      </div>

      <style jsx>{`
        @keyframes wave-pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.7; }
          50% { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
