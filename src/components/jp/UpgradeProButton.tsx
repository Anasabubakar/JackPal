'use client';

import { useState } from 'react';
import { initializeProPayment } from '@/lib/api';
import type { JpTheme } from '@/store/jpStore';

const ALLOWED_CHECKOUT_HOSTS = new Set(['checkout.paystack.com', 'standard.paystack.com']);

function isSafePaystackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_CHECKOUT_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

type UpgradeProButtonProps = {
  theme: JpTheme;
  accent?: string;
  label?: string;
  fullWidth?: boolean;
  compact?: boolean;
};

export function UpgradeProButton({
  theme: t,
  accent = '#1B6EF3',
  label = 'Upgrade to Pro — ₦1,000/mo',
  fullWidth = false,
  compact = false,
}: UpgradeProButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const { authorization_url } = await initializeProPayment();
      if (!isSafePaystackUrl(authorization_url)) {
        throw new Error('Invalid checkout URL from server.');
      }
      window.location.href = authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: fullWidth ? '100%' : undefined }}>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          width: fullWidth ? '100%' : undefined,
          padding: compact ? '10px 18px' : '12px 22px',
          borderRadius: 100,
          border: 'none',
          background: `linear-gradient(135deg, ${accent}, #F5A623)`,
          color: '#fff',
          fontSize: compact ? 12 : 13,
          fontWeight: 800,
          letterSpacing: '0.04em',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.75 : 1,
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {loading ? 'Redirecting to Paystack…' : label}
      </button>
      {error && (
        <p style={{ marginTop: 8, fontSize: 11, color: '#EF4444', lineHeight: 1.4 }}>{error}</p>
      )}
      <p style={{ marginTop: 8, fontSize: 10, color: t.muted, lineHeight: 1.4 }}>
        Secure checkout via Paystack · Choose Card on the payment page (not Vault)
      </p>
    </div>
  );
}
