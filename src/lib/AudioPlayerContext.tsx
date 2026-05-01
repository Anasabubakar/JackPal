'use client';

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface AudioPlayerContextType {
  isPlaying: boolean;
  activeVoice: string | null;
  progress: number;
  playVoice: (name: string, src: string) => void;
  togglePlay: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playVoice = (name: string, src: string) => {
    if (activeVoice === name) {
      togglePlay();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.ontimeupdate = () => setProgress((audio.currentTime / audio.duration) * 100);
      audio.onended = () => { setIsPlaying(false); setProgress(0); };
      audio.play();
      setActiveVoice(name);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  return (
    <AudioPlayerContext.Provider value={{ isPlaying, activeVoice, progress, playVoice, togglePlay }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return context;
};
