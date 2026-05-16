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
import { Sidebar } from '@/components/jp/Sidebar';
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

// ── Inner layout (needs store context) ───────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardInner() {
  const { route, setRoute, upload, docs, currentDocId, isPlaying, user } = useJp();
  const [isDark, setIsDark] = useState(true);
  const t = jpTheme(isDark);

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const currentDoc = docs.find(d => d.id === currentDocId) || docs[0];

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

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: t.bg,
        position: 'relative',
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* Sidebar */}
      <Sidebar t={t} accent={ACCENT} radius={RADIUS} />

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* TopBar */}
        <div
          style={{
            height: 58,
            borderBottom: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 12,
            flexShrink: 0,
            background: t.sidebar,
          }}
        >
          {isLibrary ? (
            <>
              <div
                style={{
                  flex: 1,
                  fontSize: 17,
                  fontWeight: 800,
                  color: t.ink,
                  fontFamily: "'Fraunces', Georgia, serif",
                }}
              >
                {getGreeting()}{firstName ? `, ${firstName}` : ''} 👋
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 10,
                  background: t.inset,
                  border: `1px solid ${t.border}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14, color: t.muted }}>⌕</span>
                <span style={{ fontSize: 13, color: t.faded, fontFamily: "'Syne', sans-serif" }}>
                  Search library…
                </span>
              </div>
              <button
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: t.inset,
                  border: `1px solid ${t.border}`,
                  color: t.muted,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                🔔
              </button>
              <button
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
                }}
                title="Toggle theme"
              >
                {isDark ? '☀' : '🌙'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setRoute({ desktop: 'library' })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: t.muted,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                }}
              >
                ← Back to library
              </button>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: t.ink,
                }}
              >
                {routeLabel[route.desktop]}
              </div>
              <div style={{ flex: 1 }} />
              <button
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
                }}
                title="Toggle theme"
              >
                {isDark ? '☀' : '🌙'}
              </button>
            </>
          )}
        </div>

        {/* Content area */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {route.desktop === 'library' && (
            <Library t={t} accent={ACCENT} radius={RADIUS} />
          )}
          {route.desktop === 'player' && (
            <PlayerView t={t} accent={ACCENT} radius={RADIUS} />
          )}
          {route.desktop === 'preview' && (
            <PreviewPage theme={t} accent={ACCENT} />
          )}
          {route.desktop === 'artifact' && (
            <ArtifactStudio theme={t} accent={ACCENT} frame="desktop" />
          )}
          {route.desktop === 'voices' && (
            <VoicesPage theme={t} accent={ACCENT} frame="desktop" />
          )}
          {route.desktop === 'account' && (
            <AccountPage theme={t} accent={ACCENT} frame="desktop" />
          )}
          {route.desktop === 'reader' && (
            <ReaderPage theme={t} accent={ACCENT} frame="desktop" />
          )}
          {route.desktop === 'notes' && (
            <NotesPage theme={t} accent={ACCENT} frame="desktop" />
          )}
        </div>

        {/* Mini player */}
        <MiniPlayer t={t} accent={ACCENT} radius={RADIUS} />
      </div>

      {/* Upload flow overlay */}
      {upload && upload.originFrame === 'desktop' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 100,
          }}
        >
          <UploadFlow frame="desktop" theme={t} accent={ACCENT} />
        </div>
      )}

      {/* Toast */}
      <Toast theme={t} />
    </div>
  );
}

// ── Auth wrapper ──────────────────────────────────────────────────────────────

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
    return () => { mounted = false; };
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
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
