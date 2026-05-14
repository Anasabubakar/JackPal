"use client";

import React, { useState, useEffect } from 'react';

interface DockProps {
  onCenterAction?: () => void;
  onCenterClose?: () => void;
  onNavigate?: (id: string) => void;
  activeItem?: string;
  fabIsOpen?: boolean;
}

const navItems = [
  {
    id: 'imported',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none"
        stroke={active ? '#0f0f0f' : '#b0b0b8'}
        strokeWidth={active ? 2.3 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11.5L13 3l9 8.5V21a1.5 1.5 0 0 1-1.5 1.5H16v-5H10v5H5.5A1.5 1.5 0 0 1 4 21v-9.5z"/>
      </svg>
    ),
  },
  {
    id: 'podcasts',
    label: 'Podcast',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none"
        stroke={active ? '#0f0f0f' : '#b0b0b8'}
        strokeWidth={active ? 2.3 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13" cy="11" r="3"/>
        <path d="M8.5 7.5a6.5 6.5 0 0 0 0 7"/>
        <path d="M17.5 7.5a6.5 6.5 0 0 1 0 7"/>
        <path d="M5 4.5a11 11 0 0 0 0 13"/>
        <path d="M21 4.5a11 11 0 0 1 0 13"/>
        <line x1="13" y1="14" x2="13" y2="20"/>
        <line x1="10" y1="20" x2="16" y2="20"/>
      </svg>
    ),
  },
  {
    id: 'studio',
    label: 'Studio',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none"
        stroke={active ? '#0f0f0f' : '#b0b0b8'}
        strokeWidth={active ? 2.3 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="3" width="6" height="10" rx="3"/>
        <path d="M6 13a7 7 0 0 0 14 0"/>
        <line x1="13" y1="20" x2="13" y2="23"/>
        <line x1="10" y1="23" x2="16" y2="23"/>
      </svg>
    ),
  },
  {
    id: 'workspaces',
    label: 'Library',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none"
        stroke={active ? '#0f0f0f' : '#b0b0b8'}
        strokeWidth={active ? 2.3 : 1.8}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h11A2.5 2.5 0 0 1 21 5.5v17l-8-4.5-8 4.5V5.5z"/>
        <path d="M10 10.5h6"/>
      </svg>
    ),
  },
];

export function Dock({ onCenterAction, onCenterClose, onNavigate, activeItem = 'imported', fabIsOpen }: DockProps) {
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const [fabOpenLocal, setFabOpenLocal] = useState(false);
  const fabOpen = fabIsOpen !== undefined ? fabIsOpen : fabOpenLocal;

  const handleTabClick = (id: string) => {
    onNavigate?.(id);
    setBouncingId(id);
    setTimeout(() => setBouncingId(null), 220);
  };

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <>
      <style>{`
        @keyframes _dockNavIn {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes _dockFabIn {
          from { opacity: 0; transform: scale(0) rotate(-90deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        ._dock-nav { animation: _dockNavIn .55s cubic-bezier(.22,1,.36,1) both; }
        ._dock-fab { animation: _dockFabIn .6s cubic-bezier(.34,1.56,.64,1) .15s both; }
        ._dock-tab { transition: background .18s ease, transform .18s cubic-bezier(.34,1.56,.64,1); }
        ._dock-tab:hover { background: rgba(0,0,0,0.055); transform: translateY(-2px); }
        ._dock-tab:active { transform: scale(.93); }
        ._dock-tab:hover ._dock-icon { transform: scale(1.15); }
        ._dock-fab-btn:hover { transform: scale(1.1) translateY(-2px); box-shadow: 0 10px 36px rgba(78,90,220,0.65), 0 1px 0 rgba(255,255,255,0.3) inset !important; }
        ._dock-fab-btn:active { transform: scale(.9); box-shadow: 0 3px 14px rgba(78,90,220,0.4) !important; }
      `}</style>

      {/* Fixed centering wrapper; animation on inner nav so transform doesn't conflict */}
      <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 300 }}>
        <nav
          className="_dock-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.82)',
            border: '1.5px solid rgba(255,255,255,0.95)',
            borderRadius: 999,
            padding: '10px 18px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.10), 0 2px 0 rgba(255,255,255,0.9) inset',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {leftItems.map(item => (
            <Tab
              key={item.id}
              item={item}
              active={activeItem === item.id}
              bouncing={bouncingId === item.id}
              onClick={() => handleTabClick(item.id)}
            />
          ))}

          {/* FAB */}
          <div style={{ flexShrink: 0, width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-12px 6px', position: 'relative', zIndex: 3 }}>
            <button
              className="_dock-fab-btn _dock-fab"
              onClick={() => { const opening = !fabOpen; setFabOpenLocal(opening); if (opening) onCenterAction?.(); else onCenterClose?.(); }}
              style={{
                width: 54, height: 54, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                background: 'radial-gradient(circle at 35% 30%, #8b9fff 0%, #5e72eb 45%, #4451d6 100%)',
                boxShadow: '0 6px 28px rgba(78,90,220,0.55), 0 1px 0 rgba(255,255,255,0.28) inset',
                border: 'none',
                transition: 'transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease',
              }}
            >
              {/* Sheen */}
              <div style={{ position: 'absolute', top: '-40%', left: '-40%', width: '80%', height: '70%', background: 'rgba(255,255,255,0.18)', borderRadius: '50%', transform: 'rotate(-30deg)', pointerEvents: 'none' }}/>
              <svg
                style={{ transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)', transform: fabOpen ? 'rotate(135deg)' : 'rotate(0deg)' }}
                width="22" height="22" viewBox="0 0 22 22" fill="none"
              >
                <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {rightItems.map(item => (
            <Tab
              key={item.id}
              item={item}
              active={activeItem === item.id}
              bouncing={bouncingId === item.id}
              onClick={() => handleTabClick(item.id)}
            />
          ))}
        </nav>
      </div>
    </>
  );
}

function Tab({ item, active, bouncing, onClick }: {
  item: typeof navItems[number];
  active: boolean;
  bouncing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="_dock-tab"
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '6px 0', borderRadius: 999, cursor: 'pointer', position: 'relative',
        userSelect: 'none', minWidth: 56, border: 'none', background: 'transparent',
      }}
    >
      <div
        className="_dock-icon"
        style={{
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .22s cubic-bezier(.34,1.56,.64,1)',
          transform: bouncing ? 'scale(1.3)' : 'scale(1)',
        }}
      >
        {item.icon(active)}
      </div>
      <span style={{
        fontSize: 11, letterSpacing: '0.01em',
        color: active ? '#0f0f0f' : '#b0b0b8',
        fontWeight: active ? 800 : 500,
        transition: 'color .2s, font-weight .15s',
      }}>
        {item.label}
      </span>
      <span style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: active ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)',
        width: 4, height: 4, borderRadius: '50%', background: '#0f0f0f',
        opacity: active ? 1 : 0,
        transition: 'transform .28s cubic-bezier(.34,1.56,.64,1), opacity .28s',
      }}/>
    </button>
  );
}
