"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DockProps {
  onCenterAction?: () => void;
  onNavigate?: (id: string) => void;
  activeItem?: string;
}

export function Dock({ onCenterAction, onNavigate, activeItem = 'inbox' }: DockProps) {
  const [active, setActive] = useState(activeItem);
  const [fabOpen, setFabOpen] = useState(false);

  const items = [
    { id: 'inbox', label: 'Inbox', icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="3" y="5.5" width="20" height="15" rx="3" stroke="currentColor"/>
        <path d="M3 10.5l10 6.5 10-6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'cal', label: 'Calendar', icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="3" y="5" width="20" height="18" rx="3" stroke="currentColor"/>
        <path d="M3 11h20" stroke="currentColor" strokeLinecap="round"/>
        <path d="M9 3v4M17 3v4" stroke="currentColor" strokeLinecap="round"/>
        <rect x="8" y="14" width="3.5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    )},
    { id: 'saved', label: 'Saved', icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h11A2.5 2.5 0 0 1 21 5.5v17l-8-4.5-8 4.5V5.5z" stroke="currentColor" strokeLinejoin="round"/>
        <path d="M10 10.5h6" stroke="currentColor" strokeLinecap="round"/>
      </svg>
    )},
    { id: 'notes', label: 'Notes', icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="4" y="3" width="18" height="20" rx="3" stroke="currentColor"/>
        <path d="M4 17h13" stroke="currentColor" strokeLinecap="round"/>
        <path d="M17 17v6" stroke="currentColor" strokeLinecap="round"/>
        <path d="M8.5 8.5h9M8.5 12.5h6" stroke="currentColor" strokeLinecap="round"/>
      </svg>
    )},
  ];

  return (
    <nav 
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center bg-[rgba(255,255,255,0.82)] border-[1.5px] border-[rgba(255,255,255,0.95)] rounded-[999px] px-[18px] py-[10px] shadow-[0_12px_48px_rgba(0,0,0,0.10),0_2px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-[20px]"
    >
      {items.slice(0, 2).map(item => (
        <button
          key={item.id}
          onClick={() => { setActive(item.id); onNavigate?.(item.id); }}
          className={cn(
            "flex-1 flex flex-col items-center gap-[5px] p-[6px_0] rounded-[999px] cursor-pointer transition-[background,transform] duration-180 ease-out relative select-none",
            active === item.id ? "active" : ""
          )}
        >
          <div className="w-[30px] h-[30px] flex items-center justify-center transition-transform duration-220 ease-[cubic-bezier(.34,1.56,.64,1)]">
            <div className={cn(
              "transition-[stroke,stroke-width] duration-200",
              active === item.id ? "stroke-[#0f0f0f] stroke-[2.3]" : "stroke-[#b0b0b8] stroke-[1.8]"
            )}>
              {item.icon}
            </div>
          </div>
          <span className={cn(
            "text-[11px] tracking-[0.01em] transition-[color,font-weight] duration-[.2s,.15s] font-['DM_Sans',sans-serif]",
            active === item.id ? "text-[#0f0f0f] font-[800]" : "text-[#b0b0b8] font-[500]"
          )}>{item.label}</span>
          {active === item.id && <div className="absolute bottom-0 w-[4px] h-[4px] rounded-full bg-[#0f0f0f]" />}
        </button>
      ))}

      <div className="flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center -my-[12px] mx-[6px] relative z-[3]">
        <button 
          onClick={() => { setFabOpen(!fabOpen); onCenterAction?.(); }}
          className={cn(
            "w-[54px] h-[54px] rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden transition-[transform,box-shadow] duration-250 ease-[cubic-bezier(.34,1.56,.64,1)]",
            "bg-[radial-gradient(circle_at_35%_30%,#8b9fff_0%,#5e72eb_45%,#4451d6_100%)]",
            "shadow-[0_6px_28px_rgba(78,90,220,0.55),0_1px_0_rgba(255,255,255,0.28)_inset]",
            fabOpen ? "open" : ""
          )}
        >
          <div className="absolute -top-[40%] -left-[40%] w-[80%] h-[70%] bg-[rgba(255,255,255,0.18)] rounded-full rotate-[-30deg]" />
          <svg className={cn("transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]", fabOpen ? "rotate-[135deg]" : "")} width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {items.slice(2).map(item => (
        <button
          key={item.id}
          onClick={() => { setActive(item.id); onNavigate?.(item.id); }}
          className={cn(
            "flex-1 flex flex-col items-center gap-[5px] p-[6px_0] rounded-[999px] cursor-pointer transition-[background,transform] duration-180 ease-out relative select-none",
            active === item.id ? "active" : ""
          )}
        >
          <div className="w-[30px] h-[30px] flex items-center justify-center transition-transform duration-220 ease-[cubic-bezier(.34,1.56,.64,1)]">
            <div className={cn(
              "transition-[stroke,stroke-width] duration-200",
              active === item.id ? "stroke-[#0f0f0f] stroke-[2.3]" : "stroke-[#b0b0b8] stroke-[1.8]"
            )}>
              {item.icon}
            </div>
          </div>
          <span className={cn(
            "text-[11px] tracking-[0.01em] transition-[color,font-weight] duration-[.2s,.15s] font-['DM_Sans',sans-serif]",
            active === item.id ? "text-[#0f0f0f] font-[800]" : "text-[#b0b0b8] font-[500]"
          )}>{item.label}</span>
          {active === item.id && <div className="absolute bottom-0 w-[4px] h-[4px] rounded-full bg-[#0f0f0f]" />}
        </button>
      ))}
    </nav>
  );
}
