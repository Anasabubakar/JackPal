'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
  onCitationClick?: (index: number) => void;
}

export function Markdown({ content, className, onCitationClick }: MarkdownProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  const renderInline = (text: string): React.ReactNode => {
    // 1. Handle citations like [1], [2], etc.
    // 2. bold, italic, code
    const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    
    return parts.map((part, idx) => {
      // Citation chip [N]
      const citationMatch = part.match(/^\[(\d+)\]$/);
      if (citationMatch) {
        const num = parseInt(citationMatch[1], 10);
        return (
          <button
            key={idx}
            onClick={() => onCitationClick?.(num)}
            className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 mx-0.5 rounded text-[9px] font-bold transition-transform hover:scale-110 active:scale-95"
            style={{ 
              background: 'var(--blue-dim)', 
              color: 'var(--blue)', 
              border: '1px solid rgba(44,123,229,0.2)' 
            }}
            title={`Source ${num}`}
          >
            {num}
          </button>
        );
      }
      
      // Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      
      // Inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1 py-0.5 rounded text-[0.9em] font-mono"
            style={{ background: 'var(--surface-3)', color: 'var(--text-1)' }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      
      // Italic
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      
      return part;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-[1.4em] font-bold mt-4 mb-2" style={{ color: 'var(--text-1)' }}>
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-[1.2em] font-bold mt-4 mb-2" style={{ color: 'var(--text-1)' }}>
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-[1.1em] font-bold mt-3 mb-1.5" style={{ color: 'var(--text-1)' }}>
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(
          <li key={i} className="ml-4 list-disc pl-1">
            {renderInline(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 my-2">
          {items}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="ml-4 list-decimal pl-1">
            {renderInline(lines[i].replace(/^\d+\.\s/, ''))}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1 my-2">
          {items}
        </ol>
      );
      continue;
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 pl-3 py-1 my-2 italic" style={{ borderColor: 'var(--blue)', color: 'var(--text-3)' }}>
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="leading-relaxed mb-2">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className={cn("text-[13px] text-[var(--text-2)]", className)}>{elements}</div>;
}
