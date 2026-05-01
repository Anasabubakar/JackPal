import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from '@/lib/AudioPlayerContext';

interface AudioProgressProps {
  label: string;
}

export const AudioProgress: React.FC<AudioProgressProps> = ({ label }) => {
  const { activeVoice, progress, isPlaying } = useAudioPlayer();
  const isActive = activeVoice === label;
  
  // Use a stable key for animation to prevent jitter during updates
  const bars = useMemo(() => Array.from({ length: 40 }, () => Math.random() * 0.6 + 0.4), []);

  return (
    <div className="group relative w-full py-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</span>
        <span className="text-xs font-mono text-white/80">{Math.round(isActive ? progress : 0)}%</span>
      </div>

      <div className="relative flex items-center justify-between gap-1 h-12 px-2">
        {bars.map((height, i) => {
          const isPlayed = isActive && (i / bars.length) * 100 <= progress;
          return (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                isPlayed 
                  ? "bg-gradient-to-t from-indigo-500 to-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" 
                  : "bg-white/10"
              )}
              style={{
                height: `${height * 100}%`,
                // Animation is persistent for the visualizer effect, speed/opacity reacts to playback
                animation: `wave-pulse 1.5s infinite ease-in-out ${i * 0.05}s`,
                animationPlayState: isPlaying && isActive ? 'running' : 'paused',
                opacity: (isPlaying && isActive) ? 1 : 0.6
              }}
            />
          );
        })}
      </div>

      <style jsx>{`
        @keyframes wave-pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.8); }
        }
      `}</style>
    </div>
  );
};
