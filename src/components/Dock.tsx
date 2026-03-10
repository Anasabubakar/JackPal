'use client';

import React, { useState, useEffect } from 'react';
import { Home, Library, FolderOpen, User, Plus, FileText, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const landingNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'features', label: 'Features', icon: Library, href: '#features' },
  { id: 'pricing', label: 'Pricing', icon: FileText, href: '#pricing' },
  { id: 'login', label: 'Log in', icon: User, href: '/login' },
];

const dashboardNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home, href: '/dashboard' },
  { id: 'library', label: 'Library', icon: Library, href: '/library' },
  { id: 'files', label: 'Files', icon: FolderOpen, href: '/files' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

interface DockProps {
  type?: 'landing' | 'dashboard';
  onCenterAction?: () => void;
}

export function Dock({ type = 'landing', onCenterAction }: DockProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('');
  const [mounted, setMounted] = useState(false);

  const navItems = type === 'landing' ? landingNavItems : dashboardNavItems;

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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(href.substring(1));
      if (element) {
        const offset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        window.history.pushState(null, '', href);
        setActiveTab(navItems.find(item => item.href === href)?.id || '');
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center w-full px-6">
      <div className="flex items-center gap-4">
        {/* Glassmorphic Pill Navigation */}
        <div 
          className="flex items-center gap-1 p-1.5 rounded-full bg-white/70 backdrop-blur-[20px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={cn(
                  "flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] outline-none cursor-pointer overflow-hidden rounded-full",
                  isActive 
                    ? "bg-[#B1121B] px-5 py-3 shadow-lg text-white min-w-[120px]" 
                    : "px-3.5 py-3 text-[#111111]/60 hover:text-[#B1121B] min-w-[48px]"
                )}
              >
                <item.icon className={cn("h-[22px] w-[22px] flex-shrink-0", isActive ? "stroke-[2.2px]" : "stroke-[1.8px]")} />
                <span 
                  className={cn(
                    "text-[15px] font-medium tracking-tight whitespace-nowrap transition-all duration-300",
                    isActive ? "opacity-100 ml-2.5 w-auto" : "opacity-0 w-0 h-0"
                  )}
                >
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* Floating Brand Red FAB */}
        <button
          onClick={() => {
            if (onCenterAction) {
              onCenterAction();
            } else if (type === 'landing') {
              const waitlistBtn = document.querySelector('[data-waitlist-btn]') as HTMLButtonElement;
              if (waitlistBtn) waitlistBtn.click();
            }
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#B1121B] to-[#E10600] shadow-[0_8px_28px_rgba(177,18,27,0.4)] transition-transform duration-150 hover:scale-[1.06] active:scale-[0.95] group relative"
          aria-label={type === 'landing' ? "Join Waitlist" : "Upload Content"}
        >
          {type === 'landing' ? (
            <Plus className="h-7 w-7 text-white stroke-[2.4px]" />
          ) : (
            <CloudUpload className="h-6 w-6 text-white stroke-[2.4px]" />
          )}
          
          {/* Label Tooltip */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none whitespace-nowrap">
            {type === 'landing' ? 'Join Now' : 'Upload'}
          </div>
        </button>
      </div>
    </div>
  );
}
