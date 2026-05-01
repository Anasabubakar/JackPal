"use client";

import React from 'react';
import { useAudioPlayer } from '@/lib/AudioPlayerContext';

interface AudioProgressProps {
  label: string;
  compact?: boolean;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export const AudioProgress: React.FC<AudioProgressProps> = ({ label, compact = false }) => {
  const { activeVoice, progress, currentTime, duration, isPlaying, isLoading, error, seekToPercent } = useAudioPlayer();
  const isActive = activeVoice === label;
  const displayProgress = isActive ? progress : 0;

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
    <div className="jp-progress-container" style={compact ? { margin: "18px 0 14px" } : undefined}>
      <div className="jp-progress-meta">
        <span>{isLoading && isActive ? "Loading voice" : label}</span>
        <span>{isActive ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "0:00 / 0:00"}</span>
      </div>
      <div
        className="jp-progress-bar"
        onPointerDown={seekFromPointer}
        role="slider"
        aria-label={`${label} audio progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayProgress)}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={seekFromKeyboard}
      >
        <div className="jp-progress-track" />
        <div className="jp-progress-fill" style={{ width: `${displayProgress}%` }}>
          <span className="jp-progress-glow" />
        </div>
        <div className="jp-progress-handle" style={{ left: `${displayProgress}%` }}>
          <span className="handle-inner" />
          {isActive && isPlaying ? <span className="handle-ripple" /> : null}
        </div>
      </div>
      {isActive && error ? <p className="jp-audio-error">{error}</p> : null}
    </div>
  );
};
