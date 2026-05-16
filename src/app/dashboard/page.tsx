'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';
import {
  JpStoreProvider,
  useJp,
  jpTheme,
  type DesktopRoute,
} from '@/store/jpStore';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Sidebar } from '@/components/jp/Sidebar';
import { DashboardBottomNav } from '@/components/jp/DashboardBottomNav';
import { Library } from '@/components/jp/Library';
import { PlayerView } from '@/components/jp/PlayerView';
import { MiniPlayer } from '@/components/jp/MiniPlayer';
import { UploadFlow } from '@/components/jp/UploadFlow';
import { Toast } from '@/components/jp/Toast';
import { PreviewPage } from '@/components/jp/preview/PreviewPage';
import { ArtifactStudio } from '@/components/jp/ArtifactStudio';
import { VoicesPage } from '@/components/jp/VoicesPage';
import { AccountPage } from '@/components/jp/AccountPage';
import { ReaderPage } from '@/components/jp/ReaderPage';
import { NotesPage } from '@/components/jp/NotesPage';

const ACCENT = '#1B6EF3';
const RADIUS = 18;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardInner() {
  const { route, setRoute, upload, user } = useJp();
  const [isDark, setIsDark] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const breakpoint = useBreakpoint();
  const t = jpTheme(isDark);

  const isMobile = breakpoint === 'mobile';
  const isCompactNav = breakpoint !== 'desktop';
  const frame = isMobile ? 'mobile' : 'desktop';

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const routeLabel: Record<DesktopRoute, string> = {
    library: '',
    player: 'Now Playing',
    preview: 'Preview Variants',
    artifact: 'Study Tools',
    voices: 'Voices',
    account: 'Account',
    reader: 'Reader',
    notes: 'Highlights & Notes',
  };

  const isLibrary = route.desktop === 'library';

  useEffect(() => {
    if (!isCompactNav) setNavOpen(false);
  }, [isCompactNav]);

  useEffect(() => {
    setNavOpen(false);
  }, [route.desktop]);

  return (
    <div
      className="jp-dashboard-root"
      style={{
        background: t.bg,
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {isCompactNav && navOpen && (
        <button
          type="button"
          className="jp-dashboard-sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      )}

      {isCompactNav ? (
        <Sidebar
          t={t}
          accent={ACCENT}
          radius={RADIUS}
          layout="drawer"
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
      ) : (
        <Sidebar t={t} accent={ACCENT} radius={RADIUS} layout="inline" />
      )}

      <div className="jp-dashboard-main">
        <header
          className="jp-dashboard-topbar"
          style={{
            borderBottom: `1px solid ${t.border}`,
            background: t.sidebar,
          }}
        >
          {isCompactNav && (
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: t.inset,
                border: `1px solid ${t.border}`,
                color: t.ink,
                fontSize: 18,
                cursor: 'pointer',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ☰
            </button>
          )}

          {isLibrary ? (
            <>
              <div
                className="jp-dashboard-topbar-greeting"
                style={{
                  color: t.ink,
                  fontFamily: "'Fraunces', Georgia, serif",
                }}
              >
                {getGreeting()}
                {firstName ? `, ${firstName}` : ''} 👋
              </div>
              <div
                className="jp-dashboard-topbar-search"
                style={{
                  background: t.inset,
                  border: `1px solid ${t.border}`,
                }}
              >
                <span style={{ fontSize: 14, color: t.muted }}>⌕</span>
                <span style={{ fontSize: 13, color: t.faded, fontFamily: "'Syne', sans-serif" }}>
                  Search library…
                </span>
              </div>
              {!isMobile && (
                <button
                  type="button"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: t.inset,
                    border: `1px solid ${t.border}`,
                    color: t.muted,
                    fontSize: 16,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  🔔
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRoute({ desktop: 'library' })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: t.muted,
                  fontSize: isMobile ? 12 : 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                ← {isMobile ? 'Back' : 'Back to library'}
              </button>
              <div
                style={{
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 600,
                  color: t.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {routeLabel[route.desktop]}
              </div>
              <div style={{ flex: 1 }} />
            </>
          )}

          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.muted,
              fontSize: 14,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Toggle theme"
          >
            {isDark ? '☀' : '🌙'}
          </button>
        </header>

        <div
          className={`jp-dashboard-content${isMobile ? ' jp-dashboard-content--mobile-nav' : ''}`}
        >
          {route.desktop === 'library' && <Library t={t} accent={ACCENT} radius={RADIUS} />}
          {route.desktop === 'player' && <PlayerView t={t} accent={ACCENT} radius={RADIUS} />}
          {route.desktop === 'preview' && <PreviewPage theme={t} accent={ACCENT} />}
          {route.desktop === 'artifact' && (
            <ArtifactStudio theme={t} accent={ACCENT} frame={frame} />
          )}
          {route.desktop === 'voices' && <VoicesPage theme={t} accent={ACCENT} frame={frame} />}
          {route.desktop === 'account' && <AccountPage theme={t} accent={ACCENT} frame={frame} />}
          {route.desktop === 'reader' && <ReaderPage theme={t} accent={ACCENT} frame={frame} />}
          {route.desktop === 'notes' && <NotesPage theme={t} accent={ACCENT} frame={frame} />}
        </div>

        <MiniPlayer t={t} accent={ACCENT} radius={RADIUS} />
      </div>

      {isMobile && <DashboardBottomNav t={t} accent={ACCENT} />}

      {upload && upload.originFrame === 'desktop' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 100,
            padding: isMobile ? 0 : 16,
          }}
        >
          <UploadFlow frame={frame} theme={t} accent={ACCENT} />
        </div>
      )}

      <Toast theme={t} />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          if (!data.session) {
            router.replace('/login');
          } else {
            setChecking(false);
          }
        }
      } catch {
        if (mounted) setChecking(false);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          width: '100%',
          height: '100dvh',
          background: '#060C22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1B6EF3, #F5A623)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'Fraunces', Georgia, serif",
              animation: 'jp-pulse 1.5s ease-in-out infinite',
            }}
          >
            J
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#8B9BB4',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.1em',
            }}
          >
            LOADING…
          </div>
        </div>
      </div>
    );
  }

  return (
    <JpStoreProvider>
      <DashboardInner />
    </JpStoreProvider>
  );
}
