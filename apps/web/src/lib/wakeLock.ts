'use client';

/**
 * Screen wake lock while a live session runs. Phones dim/lock mid-sentence,
 * which suspends JS and kills the WebSocket — the exact failure seen in the
 * field. Best-effort: silently unavailable on browsers without the API.
 */

let sentinel: WakeLockSentinel | null = null;
let wanted = false;

async function acquire() {
  if (!wanted || sentinel || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return;
  }
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
      // The OS releases the lock when the tab hides; retake on return.
      if (wanted && document.visibilityState === 'visible') void acquire();
    });
  } catch {
    sentinel = null;
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible') void acquire();
}

export function holdWakeLock() {
  if (wanted) return;
  wanted = true;
  document.addEventListener('visibilitychange', onVisibility);
  void acquire();
}

export function releaseWakeLock() {
  wanted = false;
  document.removeEventListener('visibilitychange', onVisibility);
  const s = sentinel;
  sentinel = null;
  if (s) void s.release().catch(() => {});
}
