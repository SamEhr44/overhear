'use client';

import { useEffect, useState } from 'react';
import { Chip } from './ui/Chip';

/**
 * Honest offline-readiness chip: only turns green once the service worker is
 * actually controlling the page (app shell cached). Full phrase-pack offline
 * arrives in M4.
 */
export function OfflineReadyChip() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready ? (
    <Chip variant="positive" dot>
      Offline shell ready
    </Chip>
  ) : (
    <Chip dot>Offline pack · M4</Chip>
  );
}
