'use client';

import React, { useState, useEffect } from 'react';
import { Home, Library, FolderOpen, User, Plus, FileText, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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

interface MobileDockProps {
  type?: 'landing' | 'dashboard';
  onCenterAction?: () => void;
}

export function MobileDock({ type = 'landing', onCenterAction }: MobileDockProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('');
  const [mounted, setMounted] = useState(false);

  const navItems = type === 'landing' ? landingNavItems : dashboardNavItems;

  useEffect(() => {
    setMounted(true);
    const handleActiveTab = () => {
      const current = navItems.find(item => {
        if (item.href.startsWith('#')) {
          return window.location.hash === item.href;
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
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-[200]">
      <nav className="relative bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-[2.5rem] p-2 flex items-center justify-around h-16 px-4 overflow-visible">
        
        {/* Left Side Items */}
        <div className="flex items-center justify-start gap-1 flex-1">
          {navItems.slice(0, 2).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                  isActive ? "bg-[#2585C7] text-white shadow-lg shadow-[#2585C7]/30 -translate-y-1" : "text-[#02013D]/40 hover:bg-[#2585C7]/5"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
                )}
              </a>
            );
          })}
        </div>

        {/* Center Action Button */}
        <div className="relative -top-6">
          <button 
            onClick={() => {
              if (onCenterAction) {
                onCenterAction();
              } else if (type === 'landing') {
                const waitlistBtn = document.querySelector('[data-waitlist-btn]') as HTMLButtonElement;
                if (waitlistBtn) waitlistBtn.click();
              }
            }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-[#2585C7] rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            <div className="relative w-16 h-16 bg-[#2585C7] rounded-full flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(37,133,199,0.5)] border-4 border-white transition-all duration-300 hover:scale-110 active:scale-95 z-10">
              {type === 'landing' ? (
                <Plus className="h-8 w-8 text-white stroke-[3px]" />
              ) : (
                <CloudUpload className="h-7 w-7 text-white stroke-[2.5px]" />
              )}
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#02013D] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              {type === 'landing' ? 'Join Waitlist' : 'Upload'}
            </div>
          </button>
        </div>

        {/* Right Side Items */}
        <div className="flex items-center justify-end gap-1 flex-1">
          {navItems.slice(2, 4).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                  isActive ? "bg-[#2585C7] text-white shadow-lg shadow-[#2585C7]/30 -translate-y-1" : "text-[#02013D]/40 hover:bg-[#2585C7]/5"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
                )}
              </a>
            );
          })}
        </div>
      </nav>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/5 blur-xl -z-10 rounded-full" />
    </div>
  );
}
