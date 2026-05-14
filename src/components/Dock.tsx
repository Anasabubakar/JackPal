'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CloudUploadIcon,
  MicIcon,
  SparklesIcon,
  LayoutGridIcon,
} from "@animateicons/react/lucide";

interface DockProps {
  onCenterAction?: () => void;
  onNavigate?: (id: string) => void;
  activeItem?: string;
}

export function Dock({ onCenterAction, onNavigate, activeItem }: DockProps) {
  const navItems = [
    { id: 'imported', label: 'Imported', icon: CloudUploadIcon },
    { id: 'podcasts', label: 'Podcasts', icon: MicIcon },
    { id: 'studio', label: 'Studio', icon: SparklesIcon },
    { id: 'workspaces', label: 'Workspaces', icon: LayoutGridIcon },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-4 pointer-events-none">
      <div 
        className="flex items-center gap-1 p-2 rounded-[2rem] pointer-events-auto transition-all duration-300"
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                "flex items-center gap-3 transition-all duration-300 rounded-[1.5rem] px-5 py-3.5",
                isActive
                  ? "bg-white/20 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon size={24} isAnimated={isActive} />
              {isActive && <span className="text-[14px] font-medium">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onCenterAction?.()}
        className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/40 transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-90 pointer-events-auto border border-white/20"
        aria-label="Add"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>
    </div>
  );
}
