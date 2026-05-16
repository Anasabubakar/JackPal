'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getToken, verifyPayment } from '@/lib/api';

const REFERENCE_PATTERN = /^jp_[a-f0-9]{24}$/;

function PaymentCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your payment…');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('Missing payment reference. If you were charged, contact support with your receipt.');
      return;
    }

    if (!REFERENCE_PATTERN.test(reference)) {
      setStatus('error');
      setMessage('Invalid payment reference.');
      return;
    }

    if (!getToken()) {
      setStatus('error');
      setMessage('Please sign in to confirm your payment.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await verifyPayment(reference);
        if (cancelled) return;
        if (result.status === 'success') {
          setStatus('success');
          setMessage(
            result.already_processed
              ? 'Your Pro plan is already active.'
              : 'Payment successful! JackPal Pro is now active on your account.',
          );
          setTimeout(() => router.replace('/dashboard?upgraded=1'), 2200);
        } else {
          setStatus('error');
          setMessage('Payment could not be confirmed. Please try again or contact support.');
        }
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Payment verification failed.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  const title =
    status === 'loading'
      ? 'Processing payment'
      : status === 'success'
        ? "You're on Pro"
        : 'Payment issue';

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#060C22',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {status === 'loading' && (
        
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
              marginBottom: 20,
            }}
          >
            J
          </div>
        
      )}
      {status === 'success' && (
        <div style={{ fontSize: 48, marginBottom: 16, color: '#10B981' }}>✓</div>
      )}
      {status === 'error' && (
        <div style={{ fontSize: 48, marginBottom: 16, color: '#F5A623' }}>!</div>
      )}

      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
          fontFamily: "'Fraunces', Georgia, serif",
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: '#8B9BB4',
          textAlign: 'center',
          maxWidth: 360,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        {message}
      </p>
      {status === 'error' && (
        
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href={getToken() ? '/dashboard' : `/login?next=${encodeURIComponent(`/payment/callback?reference=${reference}`)}`}
              style={{
                padding: '12px 24px',
                borderRadius: 100,
                background: '#1B6EF3',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {getToken() ? 'Back to dashboard' : 'Sign in to finish'}
            </Link>
            {!getToken() && (
              <Link
                href="/login"
                style={{
                  padding: '12px 24px',
                  borderRadius: 100,
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#8B9BB4',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
            )}
          </div>
        
      )}
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100vw',
            minHeight: '100vh',
            background: '#060C22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B9BB4',
            fontSize: 13,
          }}
        >
          Loading…
        </div>
      }
    >
      <PaymentCallbackInner />
    </Suspense>
  );
}
