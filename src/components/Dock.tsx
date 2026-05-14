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
        className="flex items-center gap-6 p-2 pr-8 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 pointer-events-auto"
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
                  ? "bg-[#2585C7] text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-600"
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
