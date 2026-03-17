'use client';

import React from 'react';
import { Home, Library, FolderOpen, User, Plus } from 'lucide-react';

const tabs = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'files', label: 'Materials', icon: FolderOpen },
  { id: 'profile', label: 'Profile', icon: User },
];

interface DockProps {
  active: string;
  setActive: (id: string) => void;
  onCenterAction?: () => void;
}

export function Dock({ active, setActive, onCenterAction }: DockProps) {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center pointer-events-none w-full px-6">
      <div className="flex items-center gap-5 pointer-events-auto">
        {/* Glassmorphic Pill Navigation */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 6px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow:
              "0 12px 40px rgba(160,160,180,0.22), 0 2px 8px rgba(160,160,180,0.14), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isActive ? 10 : 0,
                  padding: isActive ? "12px 22px" : "12px 16px",
                  borderRadius: 999,
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.34,1.2,0.64,1)",
                  background: isActive
                    ? "rgba(37, 133, 199, 0.12)"
                    : "transparent",
                  boxShadow: isActive
                    ? "0 2px 12px rgba(37, 133, 199, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)"
                    : "none",
                  color: isActive ? "#2585C7" : "#bbbbc8",
                  minWidth: isActive ? 130 : 52,
                }}
                aria-label={tab.label}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {isActive && (
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Floating Action Button (Plus) */}
        <button
          onClick={onCenterAction}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "none",
            outline: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "linear-gradient(145deg, #2585C7, #61E3F0)",
            boxShadow:
              "0 8px 28px rgba(37,133,199,0.48), 0 2px 8px rgba(37,133,199,0.28), inset 0 1px 0 rgba(255,255,255,0.4)",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1.06)")}
          aria-label="Upload Content"
        >
          <Plus size={26} strokeWidth={2.4} color="white" />
        </button>
      </div>
    </div>
  );
}
