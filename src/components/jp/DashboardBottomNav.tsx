'use client';

import { useRef } from 'react';
import { useJp, type DesktopRoute, type JpTheme } from '@/store/jpStore';

const NAV: { id: DesktopRoute; label: string; icon: string }[] = [
  { id: 'library', label: 'Library', icon: '◫' },
  { id: 'player', label: 'Listen', icon: '◐' },
  { id: 'account', label: 'Account', icon: '◯' },
];

export function DashboardBottomNav({ t, accent }: { t: JpTheme; accent: string }) {
  const { route, setRoute, startUpload, isPlaying } = useJp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) startUpload(file, 'desktop');
          e.target.value = '';
        }}
      />
      <nav
        className="jp-dashboard-bottom-nav"
        style={{
          borderTop: `1px solid ${t.border}`,
          background: t.sidebar,
        }}
        aria-label="Main navigation"
      >
        {NAV.map((item) => {
          const active = route.desktop === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setRoute({ desktop: item.id })}
              className="jp-dashboard-bottom-nav-btn"
              style={{ color: active ? accent : t.muted }}
              aria-current={active ? 'page' : undefined}
            >
              <span className="jp-dashboard-bottom-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'player' && isPlaying && (
                <span
                  className="jp-dashboard-bottom-nav-live"
                  style={{ background: '#10B981' }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="jp-dashboard-bottom-nav-btn"
          style={{ color: t.muted }}
        >
          <span className="jp-dashboard-bottom-nav-icon">+</span>
          <span>Upload</span>
        </button>
      </nav>
    </>
  );
}
