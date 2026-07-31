'use client';

import { Analytics } from '@vercel/analytics/react';
import { useEffect, useSyncExternalStore } from 'react';

/**
 * Privacy-safe telemetry, both halves honest:
 * - Vercel Web Analytics: cookieless page counts, opt-OUT via the toggle on
 *   the Essentials board (the brief's "privacy-safe, opt-out analytics").
 * - Sentry browser SDK: loaded lazily ONLY when NEXT_PUBLIC_SENTRY_DSN is
 *   configured; no PII, and never any captured audio or caption text.
 */

const OPT_OUT_KEY = 'overhear.analytics.optout.v1';
const listeners = new Set<() => void>();

function optedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAnalyticsOptOut(next: boolean) {
  try {
    if (next) localStorage.setItem(OPT_OUT_KEY, '1');
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // Storage blocked — treat as not persisted.
  }
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useAnalyticsOptOut() {
  const isOptedOut = useSyncExternalStore(subscribe, optedOut, () => false);
  return { optedOut: isOptedOut, setOptOut: setAnalyticsOptOut };
}

export function Telemetry() {
  const { optedOut: isOptedOut } = useAnalyticsOptOut();

  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    void import('@sentry/browser').then((Sentry) => {
      Sentry.init({ dsn, sendDefaultPii: false, tracesSampleRate: 0 });
    });
  }, []);

  if (isOptedOut) return null;
  return <Analytics />;
}
