"use client";

import React, { useId } from 'react';
import { useAudioPlayer } from '@/lib/AudioPlayerContext';

interface AudioProgressProps {
  label: string;
  compact?: boolean;
}

const progressPath =
  "M4 24 C10 24 12 17 18 24 S28 31 34 24 S44 17 50 24 S60 31 66 24 S76 17 82 24 S92 31 98 24 S108 17 114 24 S124 31 130 24 S140 17 146 24 S156 31 162 24 S172 17 178 24 S188 31 194 24 S204 17 210 24 S220 31 226 24 L516 24";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export const AudioProgress: React.FC<AudioProgressProps> = ({ label, compact = false }) => {
  const id = useId().replace(/:/g, "");
  const { activeVoice, progress, currentTime, duration, isPlaying, isLoading, error, seekToPercent } = useAudioPlayer();
  const isActive = activeVoice === label;
  const displayProgress = isActive ? progress : 0;
  const gradientId = `jp-audio-gradient-${id}`;

  const seekFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width) * 100;
    seekToPercent(percent);
  };

  const seekFromKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isActive) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekToPercent(displayProgress - 5);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekToPercent(displayProgress + 5);
    }
    if (event.key === "Home") {
      event.preventDefault();
      seekToPercent(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      seekToPercent(100);
    }
  };

  return (
    <div className="jp-audio-progress" style={compact ? { margin: "18px 0 14px" } : undefined}>
      <div
        className="jp-audio-wave-rail"
        onPointerDown={seekFromPointer}
        role="slider"
        aria-label={`${label} audio progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayProgress)}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={seekFromKeyboard}
      >
        <svg viewBox="0 0 520 48" aria-hidden="true" preserveAspectRatio="none">
          <path d={progressPath} pathLength={100} />
        </svg>
        <div className="jp-audio-wave-fill" style={{ width: `${displayProgress}%` }}>
          <svg viewBox="0 0 520 48" aria-hidden="true" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#2d6bff" />
                <stop offset="38%" stopColor="#0095ff" />
                <stop offset="72%" stopColor="#24d4f5" />
                <stop offset="100%" stopColor="#9dfbff" />
              </linearGradient>
            </defs>
            <path d={progressPath} pathLength={100} stroke={`url(#${gradientId})`} />
          </svg>
        </div>
        <span
          className="jp-audio-wave-thumb"
          style={{
            left: `${displayProgress}%`,
            animation: isActive && isPlaying ? "pulse-ring 2.2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite" : "none",
          }}
        />
      </div>
      <div className="jp-audio-progress-meta">
        <span>{isLoading && isActive ? "Loading voice" : label}</span>
        <span>{isActive ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "0:00 / 0:00"}</span>
      </div>
      {isActive && error ? <p className="jp-audio-error">{error}</p> : null}
    </div>
  );
};
