'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface Pin {
  id: string;
  es: string;
  en: string;
  savedAt: number;
}

const STORAGE_KEY = 'overhear.pins.v1';
const SERVER_SNAPSHOT: Pin[] = [];

let cache: Pin[] | null = null;
const listeners = new Set<() => void>();

function loadPins(): Pin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Pin[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function snapshot(): Pin[] {
  if (cache === null) cache = loadPins();
  return cache;
}

function serverSnapshot(): Pin[] {
  return SERVER_SNAPSHOT;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit(next: Pin[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full/blocked — pins just don't persist beyond this session.
  }
  for (const fn of listeners) fn();
}

/** Saved captions/phrases. localStorage for M1; migrates to IndexedDB in M4. */
export function usePins() {
  const pins = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const addPin = useCallback((pin: Omit<Pin, 'id' | 'savedAt'>) => {
    const current = snapshot();
    if (current.some((p) => p.es === pin.es && p.en === pin.en)) return;
    commit([{ ...pin, id: crypto.randomUUID(), savedAt: Date.now() }, ...current].slice(0, 100));
  }, []);

  const removePin = useCallback((id: string) => {
    commit(snapshot().filter((p) => p.id !== id));
  }, []);

  return { pins, addPin, removePin };
}
