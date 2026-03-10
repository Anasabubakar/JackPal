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
    <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-auto min-w-[320px] max-w-[90vw] z-[200]">
      {/* Premium Glassmorphic Dock Container */}
      <nav className="relative flex items-center justify-between gap-4 bg-white/40 backdrop-blur-[30px] border border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-3 h-20 overflow-visible transition-all duration-500">
        
        {/* Left Side Group */}
        <div className="flex items-center justify-start gap-4">
          {navItems.slice(0, 2).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-500",
                  isActive 
                    ? "bg-[#02013D] text-white shadow-lg -translate-y-1 scale-110" 
                    : "text-[#02013D]/60 hover:bg-[#02013D]/5"
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

        {/* Prominent Center Action Button */}
        <div className="relative h-full flex items-center justify-center -mt-2">
          <button 
            onClick={() => {
              if (onCenterAction) {
                onCenterAction();
              } else if (type === 'landing') {
                const waitlistBtn = document.querySelector('[data-waitlist-btn]') as HTMLButtonElement;
                if (waitlistBtn) waitlistBtn.click();
              }
            }}
            className="relative group transition-all duration-500"
          >
            {/* Outer Glow / Halo */}
            <div className="absolute inset-0 bg-[#2585C7]/30 rounded-full blur-[20px] scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative w-16 h-16 bg-[#2585C7] rounded-[1.8rem] flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(37,133,199,0.5)] border-[5px] border-white/40 transition-all duration-500 hover:scale-110 hover:-translate-y-2 active:scale-95 active:translate-y-0 z-10">
              {type === 'landing' ? (
                <Plus className="h-9 w-9 text-white stroke-[3.5px]" />
              ) : (
                <CloudUpload className="h-8 w-8 text-white stroke-[2.5px]" />
              )}
            </div>
            
            {/* Context Label (Floating above) */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#02013D] text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl pointer-events-none -translate-y-2 group-hover:translate-y-0">
              {type === 'landing' ? 'Join Now' : 'Upload'}
            </div>
          </button>
        </div>

        {/* Right Side Group */}
        <div className="flex items-center justify-end gap-4">
          {navItems.slice(2, 4).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-500",
                  isActive 
                    ? "bg-[#02013D] text-white shadow-lg -translate-y-1 scale-110" 
                    : "text-[#02013D]/60 hover:bg-[#02013D]/5"
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
      
      {/* Subtle depth shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/[0.08] blur-[40px] -z-10 rounded-full" />
    </div>
  );
}
