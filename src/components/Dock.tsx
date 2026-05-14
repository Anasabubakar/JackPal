"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Library, 
  LayoutGrid, 
  FolderOpen, 
  FileText,
  Plus
} from 'lucide-react';

interface DockProps {
  onCenterAction?: () => void;
  onNavigate?: (id: string) => void;
  activeItem?: string;
}

export function Dock({ onCenterAction, onNavigate, activeItem = 'library' }: DockProps) {
  const [active, setActive] = useState(activeItem);
  const [fabOpen, setFabOpen] = useState(false);

  const items = [
    { id: 'library', label: 'Library', icon: Library },
    { id: 'workspace', label: 'Notebooks', icon: LayoutGrid },
    { id: 'saved', label: 'Saved', icon: FolderOpen },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center bg-[rgba(255,255,255,0.82)] border-[1.5px] border-[rgba(255,255,255,0.95)] rounded-[999px] px-[18px] py-[10px] shadow-[0_12px_48px_rgba(0,0,0,0.10),0_2px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-[20px]">
      
      {items.slice(0, 2).map((item) => (
        <button
          key={item.id}
          onClick={() => { setActive(item.id); onNavigate?.(item.id); }}
          className={cn(
            "flex-1 flex flex-col items-center gap-[5px] p-[6px_12px] rounded-[999px] cursor-pointer transition-[background,transform] duration-180 ease-out relative select-none hover:bg-[rgba(0,0,0,0.055)] hover:translate-y-[-2px] active:scale-[0.93]",
            active === item.id ? "active" : ""
          )}
        >
          <div className="w-[30px] h-[30px] flex items-center justify-center transition-transform duration-220 ease-[cubic-bezier(.34,1.56,.64,1)]">
            <item.icon 
              className={cn(
                "transition-[stroke,stroke-width] duration-200",
                active === item.id ? "stroke-[#0f0f0f] stroke-[2.3]" : "stroke-[#b0b0b8] stroke-[1.8]"
              )}
              size={26}
              strokeWidth={active === item.id ? 2.3 : 1.8}
            />
          </div>
          <span className={cn(
            "text-[11px] tracking-[0.01em] transition-[color,font-weight] duration-[.2s,.15s] font-sans",
            active === item.id ? "text-[#0f0f0f] font-[800]" : "text-[#b0b0b8] font-[500]"
          )}>{item.label}</span>
          {active === item.id && <div className="absolute bottom-1 w-[4px] h-[4px] rounded-full bg-[#0f0f0f]" />}
        </button>
      ))}

      <div className="flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center -my-[12px] mx-[6px] relative z-[3]">
        <button 
          onClick={() => { setFabOpen(!fabOpen); onCenterAction?.(); }}
          className={cn(
            "w-[54px] h-[54px] rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden transition-[transform,box-shadow] duration-250 ease-[cubic-bezier(.34,1.56,.64,1)]",
            "bg-[radial-gradient(circle_at_35%_30%,#8b9fff_0%,#5e72eb_45%,#4451d6_100%)]",
            "shadow-[0_6px_28px_rgba(78,90,220,0.55),0_1px_0_rgba(255,255,255,0.28)_inset]",
            "hover:scale-[1.1] hover:-translate-y-[2px] hover:shadow-[0_10px_36px_rgba(78,90,220,0.65),0_1px_0_rgba(255,255,255,0.3)_inset]",
            fabOpen ? "open" : ""
          )}
        >
          <div className="absolute -top-[40%] -left-[40%] w-[80%] h-[70%] bg-[rgba(255,255,255,0.18)] rounded-full rotate-[-30deg]" />
          <Plus className={cn("transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]", fabOpen ? "rotate-[135deg]" : "")} size={28} stroke="white" strokeWidth={2.8} />
        </button>
      </div>

      {items.slice(2).map((item) => (
        <button
          key={item.id}
          onClick={() => { setActive(item.id); onNavigate?.(item.id); }}
          className={cn(
            "flex-1 flex flex-col items-center gap-[5px] p-[6px_12px] rounded-[999px] cursor-pointer transition-[background,transform] duration-180 ease-out relative select-none hover:bg-[rgba(0,0,0,0.055)] hover:translate-y-[-2px] active:scale-[0.93]",
            active === item.id ? "active" : ""
          )}
        >
          <div className="w-[30px] h-[30px] flex items-center justify-center transition-transform duration-220 ease-[cubic-bezier(.34,1.56,.64,1)]">
            <item.icon 
              className={cn(
                "transition-[stroke,stroke-width] duration-200",
                active === item.id ? "stroke-[#0f0f0f] stroke-[2.3]" : "stroke-[#b0b0b8] stroke-[1.8]"
              )}
              size={26}
              strokeWidth={active === item.id ? 2.3 : 1.8}
            />
          </div>
          <span className={cn(
            "text-[11px] tracking-[0.01em] transition-[color,font-weight] duration-[.2s,.15s] font-sans",
            active === item.id ? "text-[#0f0f0f] font-[800]" : "text-[#b0b0b8] font-[500]"
          )}>{item.label}</span>
          {active === item.id && <div className="absolute bottom-1 w-[4px] h-[4px] rounded-full bg-[#0f0f0f]" />}
        </button>
      ))}
    </nav>
  );
}
