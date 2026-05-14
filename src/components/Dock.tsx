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
    { id: 'imported', label: 'Home', icon: CloudUploadIcon },
    { id: 'podcasts', label: 'Library', icon: MicIcon },
    { id: 'studio', label: 'Files', icon: SparklesIcon },
    { id: 'workspaces', label: 'User', icon: LayoutGridIcon },
  ];

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-4 pointer-events-none">
      <div 
        className="flex items-center gap-6 p-2 pr-8 rounded-full pointer-events-auto transition-all duration-300"
        style={{
          background: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
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
                "flex items-center gap-3 transition-all duration-300 rounded-full px-5 py-3",
                isActive
                  ? "bg-[#2585C7] text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <Icon size={22} isAnimated={isActive} />
              {isActive && <span className="text-[14px] font-semibold">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onCenterAction?.()}
        className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#2585C7] to-[#61E3F0] text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95 pointer-events-auto"
        aria-label="Add"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
