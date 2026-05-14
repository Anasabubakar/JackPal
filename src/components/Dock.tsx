'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center justify-center w-full px-6 pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-1 p-2 rounded-full bg-[rgba(255,255,255,0.08)] backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={cn(
                  "flex items-center justify-center p-3 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-[var(--brand-blue)] text-white shadow-lg"
                    : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                )}
              >
                <Icon size={24} isAnimated={isActive} />
              </button>
            );
          })}
        </div>

        {/* Floating Action Button (Plus) */}
        <button
          onClick={() => onCenterAction?.()}
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#2585C7] to-[#61E3F0] shadow-[0_8px_28px_rgba(37,133,199,0.48),0_2px_8px_rgba(37,133,199,0.28),inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform duration-150 hover:scale-[1.06] active:scale-[0.95] group relative"
          aria-label="Upload Content"
        >
          <Plus className="h-7 w-7 text-white stroke-[2.4px]" />
          
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#02013D] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none whitespace-nowrap">
            Upload
          </div>
        </button>
      </div>
    </div>
  );
}
