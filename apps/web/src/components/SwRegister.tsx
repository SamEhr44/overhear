'use client';

import { useEffect } from 'react';

/**
 * Registers the minimal M0 service worker (app-shell + offline fallback).
 * M4 replaces this with full phrase-pack + Trip Context offline support.
 */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure is non-fatal; the app just isn't offline-capable.
    });
  }, []);
  return null;
}
