'use client';

import React from 'react';
import { useJp, type JpTheme } from '@/store/jpStore';

interface ToastProps {
  theme: JpTheme;
}

export function Toast({ theme: t }: ToastProps) {
  const { toast } = useJp();
  if (!toast) return null;

  const isWarn = toast.kind === 'warn';

  return (
    <div
      key={toast.id}
      style={{
        position: 'fixed',
        bottom: 96,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: isWarn
          ? 'linear-gradient(135deg, #F5A623, #E6940F)'
          : t.isDark
          ? '#1A2748'
          : '#fff',
        border: `1px solid ${isWarn ? '#F5A623' : t.border}`,
        borderRadius: 14,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: isWarn
          ? '0 8px 32px rgba(245,166,35,0.4)'
          : `0 8px 32px ${t.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
        animation: 'jp-slide-up 0.3s ease both',
        maxWidth: 420,
        minWidth: 240,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 18 }}>{isWarn ? '⚠' : '✓'}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isWarn ? '#1a0a00' : t.ink,
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {toast.msg}
      </span>
    </div>
  );
}
