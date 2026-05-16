'use client';

import React, { useEffect, useState } from 'react';
import { useJp } from '@/store/jpStore';
import type { JpTheme } from '@/store/jpStore';
import { getSubscription, type Subscription } from '@/lib/api';
import { UpgradeProButton } from '@/components/jp/UpgradeProButton';

interface AccountPageProps {
  theme: JpTheme;
  accent: string;
  frame?: 'desktop' | 'mobile';
}

const JP_DEVICES: { id: string; name: string; type: string; current: boolean; limitReached?: boolean }[] = [
  { id: 'd1', name: 'This device', type: 'Current', current: true },
];

type DownloadState = 'audio_ready' | 'generating' | 'queued';

const STORAGE_PERCENT = 42;

export function AccountPage({ theme: t, accent, frame = 'desktop' }: AccountPageProps) {
  const { user, docs } = useJp();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    getSubscription()
      .then(setSubscription)
      .catch(() => setSubscription(null));
  }, []);

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: frame === 'mobile' ? '16px 16px 100px' : 32,
        display: 'flex',
        flexDirection: frame === 'mobile' ? 'column' : 'row',
        gap: 24,
        fontFamily: "'Syne', sans-serif",
      }}
      className="jp-scroll"
    >
      {/* Left column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PlanCard t={t} accent={accent} user={user} subscription={subscription} />
        <DevicesSection t={t} accent={accent} />
        <DrmPanel t={t} accent={accent} />
      </div>

      {/* Right column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <StoragePanel t={t} accent={accent} docCount={docs.length} />
        <DownloadsPanel t={t} accent={accent} docs={docs} />
        <PlanCompare t={t} accent={accent} subscription={subscription} />
      </div>
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function formatRenewalDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-NG', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function PlanCard({
  t,
  accent,
  user,
  subscription,
}: {
  t: JpTheme;
  accent: string;
  user: import('@/store/jpStore').AppUser | null;
  subscription: Subscription | null;
}) {
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';
  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  const amount = subscription?.amount_ngn ?? 1000;

  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', background: `linear-gradient(135deg, #1B6EF3, #F5A623)`, padding: 24, color: '#fff' }}>
      {/* User info header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Fraunces', Georgia, serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.full_name || 'User'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || ''}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0 }}>
          {isPro ? 'PRO' : 'FREE'}
        </div>
      </div>
      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', opacity: 0.7, marginBottom: 4 }}>
        {isPro ? 'STUDENT PRO' : 'FREE PLAN'}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>
        {isPro ? `₦${amount.toLocaleString()}` : '₦0'}
        <span style={{ fontSize: 14, opacity: 0.7 }}>{isPro ? '/month' : ''}</span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: isPro ? 0 : 14 }}>
        {isPro
          ? `Renews ${formatRenewalDate(subscription?.expires_at ?? null)}`
          : 'Upgrade for unlimited uploads & offline audio'}
      </div>
      {!isPro && <UpgradeProButton theme={t} accent={accent} fullWidth compact />}
    </div>
  );
}

// ── Devices section ───────────────────────────────────────────────────────────

function DevicesSection({ t, accent }: { t: JpTheme; accent: string }) {
  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Devices</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>2 of 3 device slots used</div>
      </div>
      {JP_DEVICES.map((device, i) => (
        <div
          key={device.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            borderBottom: i < JP_DEVICES.length - 1 ? `1px solid ${t.border}` : 'none',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: t.inset,
              border: `1px solid ${t.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            {device.type === 'macOS' ? '💻' : '📱'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{device.name}</div>
              {device.current && (
                <div
                  style={{
                    fontSize: 9,
                    color: '#10B981',
                    background: '#10B98120',
                    border: '1px solid #10B98144',
                    padding: '2px 8px',
                    borderRadius: 100,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                >
                  THIS DEVICE
                </div>
              )}
              {device.limitReached && (
                <div
                  style={{
                    fontSize: 9,
                    color: '#EF4444',
                    background: '#EF444420',
                    border: '1px solid #EF444444',
                    padding: '2px 8px',
                    borderRadius: 100,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                  }}
                >
                  LIMIT REACHED
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
              {device.type}
            </div>
          </div>
          {!device.current && (
            <button
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'transparent',
                border: `1px solid ${t.border}`,
                color: t.muted,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          )}
        </div>
      ))}
      {/* Warning */}
      <div
        style={{
          margin: '0 16px 16px',
          padding: '10px 14px',
          borderRadius: 10,
          background: '#F5A62314',
          border: '1px solid #F5A62333',
          fontSize: 12,
          color: '#F5A623',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}
      >
        <span>⚠</span>
        <span>You have reached the 3-device limit on the Pro plan. Sign out of a device to add a new one.</span>
      </div>
    </div>
  );
}

// ── DRM panel ─────────────────────────────────────────────────────────────────

function DrmPanel({ t, accent }: { t: JpTheme; accent: string }) {
  const items = [
    { icon: '🔒', label: 'Encryption', value: 'AES-256', status: 'active' },
    { icon: '📤', label: 'File export', value: 'Blocked', status: 'blocked' },
    { icon: '📵', label: 'Screen recording', value: 'Blocked on Android', status: 'blocked' },
  ];
  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>DRM & Security</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Digital rights management settings</div>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none',
          }}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: t.ink }}>{item.label}</div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: item.status === 'active' ? '#10B981' : '#EF4444',
              background: item.status === 'active' ? '#10B98120' : '#EF444420',
              border: `1px solid ${item.status === 'active' ? '#10B98144' : '#EF444444'}`,
              padding: '3px 10px',
              borderRadius: 100,
              fontWeight: 600,
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Storage panel ─────────────────────────────────────────────────────────────

function StoragePanel({ t, accent, docCount }: { t: JpTheme; accent: string; docCount: number }) {
  const usedMb = docCount * 18;
  const totalMb = 2560;
  const pct = Math.min(99, Math.round((usedMb / totalMb) * 100));
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Offline storage</div>
        <div style={{ fontSize: 12, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>{pct}% used</div>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, #10B981)`, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
        <span>~{usedMb} MB used · {docCount} docs</span>
        <span>{Math.round((totalMb - usedMb) / 1024 * 10) / 10} GB free</span>
      </div>
    </div>
  );
}

// ── Downloads panel ───────────────────────────────────────────────────────────

function DownloadsPanel({ t, accent, docs }: { t: JpTheme; accent: string; docs: import('@/store/jpStore').JpDoc[] }) {
  if (docs.length === 0) {
    return (
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: t.muted }}>No documents yet. Upload a PDF to get started.</div>
      </div>
    );
  }
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Your Documents</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{docs.length} document{docs.length !== 1 ? 's' : ''}</div>
      </div>
      {docs.slice(0, 6).map((doc, i) => {
        const state = doc.audioReady ? 'audio_ready' : doc.apiStatus === 'generating' ? 'generating' : 'queued';
        return (
          <div key={doc.id} style={{ padding: '12px 20px', borderBottom: i < Math.min(docs.length, 6) - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace' " }}>{doc.course} · {doc.pages}p</div>
              </div>
              <div style={{
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
                padding: '3px 8px', borderRadius: 100, fontWeight: 600, flexShrink: 0,
                background: state === 'audio_ready' ? '#10B98120' : state === 'generating' ? `${accent}20` : t.inset,
                color: state === 'audio_ready' ? '#10B981' : state === 'generating' ? accent : t.muted,
                border: `1px solid ${state === 'audio_ready' ? '#10B98144' : state === 'generating' ? `${accent}44` : t.border}`,
              }}>
                {state === 'audio_ready' ? '✓ READY' : state === 'generating' ? 'GENERATING' : 'PENDING'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Plan compare ──────────────────────────────────────────────────────────────

function PlanCompare({
  t,
  accent,
  subscription,
}: {
  t: JpTheme;
  accent: string;
  subscription: Subscription | null;
}) {
  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  const features = [
    { feature: 'Monthly uploads', free: '5', pro: 'Unlimited' },
    { feature: 'Devices', free: '1', pro: '3' },
    { feature: 'Offline downloads', free: '5', pro: 'Unlimited' },
    { feature: 'AI study tools', free: '✗', pro: '✓' },
    { feature: 'Voice cloning', free: '✗', pro: '✓' },
  ];
  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ padding: '14px 16px', fontSize: 12, color: t.faded, fontFamily: "'JetBrains Mono', monospace" }}>FEATURE</div>
        <div style={{ padding: '14px 16px', fontSize: 12, color: t.muted, fontWeight: 600, textAlign: 'center' }}>Free</div>
        <div style={{ padding: '14px 16px', fontSize: 12, color: accent, fontWeight: 700, textAlign: 'center' }}>Pro</div>
      </div>
      {features.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: i < features.length - 1 ? `1px solid ${t.border}` : 'none',
          }}
        >
          <div style={{ padding: '10px 16px', fontSize: 12, color: t.ink2 }}>{row.feature}</div>
          <div style={{ padding: '10px 16px', fontSize: 12, color: row.free === '✗' ? '#EF4444' : t.muted, textAlign: 'center', fontWeight: 600 }}>{row.free}</div>
          <div style={{ padding: '10px 16px', fontSize: 12, color: row.pro === '✓' ? '#10B981' : t.ink, textAlign: 'center', fontWeight: 600 }}>{row.pro}</div>
        </div>
      ))}
      {!isPro && (
        <div style={{ padding: 16, borderTop: `1px solid ${t.border}` }}>
          <UpgradeProButton theme={t} accent={accent} fullWidth />
        </div>
      )}
    </div>
  );
}
