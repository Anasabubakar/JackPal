'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';

export const AUDIO_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

interface AudioPlayerContextType {
  isPlaying: boolean;
  activeVoice: string | null;
  activeSrc: string | null;
  progress: number;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
  playVoice: (name: string, src: string) => void;
  togglePlay: () => void;
  seekToPercent: (percent: number) => void;
  skipBy: (seconds: number) => void;
  cyclePlaybackRate: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

const getAudioProgress = (audio: HTMLAudioElement) => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return 0;
  return Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100));
};

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resetAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.removeAttribute('src');
    audioRef.current.load();
    audioRef.current = null;
  }, []);

  const syncAudioState = useCallback((audio: HTMLAudioElement) => {
    setCurrentTime(audio.currentTime || 0);
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    setProgress(getAudioProgress(audio));
  }, []);

  const playVoice = useCallback((name: string, src: string) => {
    const currentAudio = audioRef.current;

    if (activeVoice === name && activeSrc === src && currentAudio) {
      if (currentAudio.paused) {
        setIsLoading(true);
        setError(null);
        currentAudio.play().catch(() => {
          setIsLoading(false);
          setIsPlaying(false);
          setError('Could not resume audio playback.');
        });
      } else {
        currentAudio.pause();
        setIsPlaying(false);
      }
      return;
    }

    resetAudio();

    const audio = new Audio(src);
    audio.preload = 'metadata';
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    setActiveVoice(name);
    setActiveSrc(src);
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    setError(null);
    setIsLoading(true);

    audio.onloadedmetadata = () => {
      setIsLoading(false);
      syncAudioState(audio);
    };
    audio.oncanplay = () => setIsLoading(false);
    audio.ontimeupdate = () => syncAudioState(audio);
    audio.onplay = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      syncAudioState(audio);
      setIsPlaying(false);
    };
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError(`Could not load ${name}. Make sure ${src} exists in public/audio.`);
    };

    audio.play().catch(() => {
      setIsLoading(false);
      setIsPlaying(false);
      setError(`Could not play ${name}. Make sure ${src} exists in public/audio.`);
    });
  }, [activeSrc, activeVoice, playbackRate, resetAudio, syncAudioState]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      setError(null);
      audioRef.current.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
        setError('Could not resume audio playback.');
      });
    }
  }, [isPlaying]);

  const seekToPercent = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const nextTime = (Math.min(100, Math.max(0, percent)) / 100) * audio.duration;
    audio.currentTime = nextTime;
    syncAudioState(audio);
  }, [syncAudioState]);

  const skipBy = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const maxTime = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + seconds;
    audio.currentTime = Math.max(0, Math.min(maxTime, audio.currentTime + seconds));
    syncAudioState(audio);
  }, [syncAudioState]);

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((currentRate) => {
      const currentIndex = AUDIO_SPEED_OPTIONS.indexOf(currentRate as typeof AUDIO_SPEED_OPTIONS[number]);
      const nextRate = AUDIO_SPEED_OPTIONS[(currentIndex + 1) % AUDIO_SPEED_OPTIONS.length];
      if (audioRef.current) audioRef.current.playbackRate = nextRate;
      return nextRate;
    });
  }, []);

  useEffect(() => () => resetAudio(), [resetAudio]);

  return (
    <AudioPlayerContext.Provider value={{
      isPlaying,
      activeVoice,
      activeSrc,
      progress,
      currentTime,
      duration,
      playbackRate,
      isLoading,
      error,
      playVoice,
      togglePlay,
      seekToPercent,
      skipBy,
      cyclePlaybackRate,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return context;
};
