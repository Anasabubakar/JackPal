'use client';

import React, { useRef } from 'react';
import { useJp, type JpTheme, type DesktopRoute } from '@/store/jpStore';

interface SidebarProps {
  t: JpTheme;
  accent: string;
  radius: number;
  layout?: 'inline' | 'drawer';
  open?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: DesktopRoute;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'library', label: 'Library', icon: '◫' },
  { id: 'player', label: 'Now Playing', icon: '◐' },
  { id: 'reader', label: 'Reader', icon: '◧' },
  { id: 'preview', label: 'Audio Preview', icon: '◑' },
  { id: 'artifact', label: 'Artifact Studio', icon: '◈' },
  { id: 'notes', label: 'Highlights', icon: '◇' },
  { id: 'voices', label: 'Voices', icon: '◍' },
  { id: 'account', label: 'Account', icon: '◯' },
];

export function Sidebar({
  t,
  accent,
  radius,
  layout = 'inline',
  open = false,
  onClose,
}: SidebarProps) {
  const { route, setRoute, isPlaying, startUpload, user } = useJp();
  const [hoveredNav, setHoveredNav] = React.useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const isDrawer = layout === 'drawer';

  const goTo = (id: DesktopRoute) => {
    setRoute({ desktop: id });
    onClose?.();
  };

  return (
    <aside
      className={
        isDrawer
          ? `jp-dashboard-sidebar-drawer${open ? ' jp-dashboard-sidebar-drawer--open' : ''}`
          : undefined
      }
      style={{
        width: 248,
        flexShrink: 0,
        background: t.sidebar,
        borderRight: `1px solid ${t.border}`,
        display: isDrawer && !open ? 'none' : 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) startUpload(file, 'desktop');
          e.target.value = '';
        }}
      />

      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: t.ink,
            fontFamily: "'Fraunces', Georgia, serif",
          }}
        >
          JackPals
        </div>
        {isDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: t.inset,
              color: t.muted,
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      <div style={{ padding: '0 16px 20px' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            height: 42,
            borderRadius: radius * 0.7,
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Upload PDF
        </button>
      </div>

      <nav style={{ padding: '0 10px', flex: 1, overflow: 'auto' }} className="jp-scroll">
        {NAV_ITEMS.map((item) => {
          const isActive = route.desktop === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setHoveredNav(item.id)}
              onMouseLeave={() => setHoveredNav(null)}
              onClick={() => goTo(item.id)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                background: isActive
                  ? `${accent}20`
                  : hoveredNav === item.id
                    ? t.isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.04)'
                    : 'transparent',
                border: 'none',
                color: isActive ? accent : t.muted,
                fontSize: 14,
                fontFamily: "'Syne', sans-serif",
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 12,
                marginBottom: 2,
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <span style={{ width: 18, fontSize: 16, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'player' && isPlaying && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10B981',
                    marginRight: 8,
                    animation: 'jp-pulse 1.5s ease-in-out infinite',
                    display: 'block',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 16, borderTop: `1px solid ${t.border}` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 12,
            background: t.inset,
            border: `1px solid ${t.border}`,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent}, #F5A623)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              fontFamily: "'Syne', sans-serif",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: t.ink,
                fontFamily: "'Syne', sans-serif",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: 10,
                color: t.muted,
                fontFamily: "'JetBrains Mono', monospace",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayEmail || 'PRO · ∞'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
