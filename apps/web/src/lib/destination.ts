'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface Destination {
  /** "Casa Kimberly" */
  name: string;
  /** Street address as the driver should read it. */
  address: string;
}

const STORAGE_KEY = 'overhear.destination.v1';
const SERVER_SNAPSHOT: Destination | null = null;

let cache: Destination | null | undefined;
const listeners = new Set<() => void>();

function load(): Destination | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Destination;
    return parsed && typeof parsed.name === 'string' && typeof parsed.address === 'string'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function snapshot(): Destination | null {
  if (cache === undefined) cache = load();
  return cache;
}

function serverSnapshot(): Destination | null {
  return SERVER_SNAPSHOT;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit(next: Destination | null) {
  cache = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked — destination just doesn't persist.
  }
  for (const fn of listeners) fn();
}

/**
 * Where you're going — set once, shown to any driver. Local-only (Trip
 * Context principle: never uploaded). Migrates to IndexedDB in M4.
 */
export function useDestination() {
  const destination = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const setDestination = useCallback((next: Destination | null) => {
    commit(next && (next.name.trim() || next.address.trim()) ? next : null);
  }, []);

  return { destination, setDestination };
}
