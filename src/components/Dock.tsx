'use client';

import React, { useState, useEffect } from 'react';
import { Home, Library, FolderOpen, User, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
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
}

export function Dock({ onCenterAction }: DockProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('');
  const [mounted, setMounted] = useState(false);

  const navItems = dashboardNavItems;

  useEffect(() => {
    setMounted(true);
    const handleActiveTab = () => {
      const current = navItems.find(item => {
        if (item.href.startsWith('#')) {
          return typeof window !== 'undefined' && window.location.hash === item.href;
        }
        return pathname === item.href;
      });
      if (current) {
        setActiveTab(current.id);
      }
    };

    handleActiveTab();
    window.addEventListener('hashchange', handleActiveTab);
    return () => window.removeEventListener('hashchange', handleActiveTab);
  }, [pathname, navItems]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center w-full px-6">
      <div className="flex items-center gap-4">
        {/* Glassmorphic Pill Navigation */}
        <div 
          className="flex items-center gap-1 p-1.5 rounded-full bg-white/72 backdrop-blur-[24px] border border-white/90 shadow-[0_12px_40px_rgba(160,160,180,0.22),0_2px_8px_rgba(160,160,180,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] outline-none cursor-pointer overflow-hidden rounded-full",
                  isActive 
                    ? "bg-[#2585C7]/85 px-5 py-3 shadow-[0_2px_12px_rgba(37,133,199,0.13),inset_0_1px_0_rgba(255,255,255,0.8)] text-white min-w-[120px]" 
                    : "px-3.5 py-3 text-[#02013D]/40 hover:text-[#2585C7] min-w-[48px]"
                )}
              >
                <item.icon className={cn("h-[22px] w-[22px] flex-shrink-0", isActive ? "stroke-[2.2px]" : "stroke-[1.8px]")} />
                <span 
                  className={cn(
                    "text-[15px] font-semibold tracking-tight whitespace-nowrap transition-all duration-300",
                    isActive ? "opacity-100 ml-2.5 w-auto" : "opacity-0 w-0 h-0"
                  )}
                >
                  {item.label}
                </span>
              </a>
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
