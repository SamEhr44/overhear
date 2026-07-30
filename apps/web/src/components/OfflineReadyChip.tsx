'use client';

import { useEffect, useState } from 'react';
import { Chip } from './ui/Chip';

/**
 * Honest offline-readiness chip: only turns green once the service worker
 * actually controls the page — at that point the app shell, phrase packs,
 * and the SOS board are cached for offline use.
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
      Offline ready
    </Chip>
  ) : (
    <Chip dot>Getting offline ready…</Chip>
  );
}
