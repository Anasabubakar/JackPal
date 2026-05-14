'use client';

import React, { useState, useEffect } from 'react';
import { Home, Library, FolderOpen, User, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const dashboardNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home, href: '/dashboard' },
  { id: 'library', label: 'Library', icon: Library, href: '/library' },
  { id: 'files', label: 'Files', icon: FolderOpen, href: '/files' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

interface DockProps {
  onCenterAction?: () => void;
  onNavigate?: (id: string) => void;
  activeItem?: string;
}

export function Dock({ onCenterAction, onNavigate, activeItem }: DockProps) {
  const navItems = [
    { id: 'imported', label: 'Imported' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'studio', label: 'Studio' },
    { id: 'workspaces', label: 'Workspaces' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center justify-center w-full px-6 pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-[rgba(255,255,255,0.08)] backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={cn(
                  "flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] outline-none cursor-pointer overflow-hidden rounded-full",
                  isActive
                    ? "bg-[var(--brand-blue)] px-5 py-3 shadow-[0_2px_12px_rgba(60,88,255,0.25)] text-white min-w-[120px]"
                    : "px-3.5 py-3 text-[var(--text-3)] hover:text-[var(--text-1)] min-w-[48px]"
                )}
              >
                <span className={cn("text-[15px] font-semibold tracking-tight whitespace-nowrap transition-all duration-300")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floating Action Button (Plus) */}
        <button
          onClick={() => {
            if (onCenterAction) {
              onCenterAction();
            }
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#2585C7] to-[#61E3F0] shadow-[0_8px_28px_rgba(37,133,199,0.48),0_2px_8px_rgba(37,133,199,0.28),inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform duration-150 hover:scale-[1.06] active:scale-[0.95] group relative"
          aria-label="Upload Content"
        >
          <Plus className="h-7 w-7 text-white stroke-[2.4px]" />
          
          {/* Label Tooltip */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#02013D] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none whitespace-nowrap">
            Upload
          </div>
        </button>
      </div>
    </div>
  );
}
