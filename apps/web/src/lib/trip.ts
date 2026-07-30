'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { idbGet, idbSet } from './idb';

/**
 * Trip Context — the local, on-device traveler profile (PRD: never
 * uploaded). Single source of truth for Home, Ride's destination card, and
 * the Essentials board. Lives in IndexedDB.
 */
export interface TripData {
  city: string;
  lodgingName: string;
  lodgingAddress: string;
  flightCode: string;
  flightTime: string;
  initials: string;
  /** ISO date (yyyy-mm-dd) of arrival — drives "Day N". */
  arrivedOn: string;
}

const TRIP_KEY = 'trip.v1';
const SEEN_KEY = 'onboarding.seen.v1';
const LEGACY_DESTINATION_KEY = 'overhear.destination.v1';

interface TripState {
  /** undefined = still hydrating from IndexedDB. */
  trip: TripData | null | undefined;
  onboardingSeen: boolean;
}

let state: TripState = { trip: undefined, onboardingSeen: true };
const listeners = new Set<() => void>();
let hydrateStarted = false;

function notify() {
  for (const fn of listeners) fn();
}

async function hydrate() {
  if (hydrateStarted) return;
  hydrateStarted = true;
  let trip = (await idbGet<TripData>(TRIP_KEY)) ?? null;
  const seen = (await idbGet<boolean>(SEEN_KEY)) ?? false;

  // Migrate the M3 localStorage destination into the unified trip.
  if (!trip && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LEGACY_DESTINATION_KEY);
      if (raw) {
        const legacy = JSON.parse(raw) as { name?: string; address?: string };
        if (legacy?.name || legacy?.address) {
          trip = {
            city: '',
            lodgingName: legacy.name ?? '',
            lodgingAddress: legacy.address ?? '',
            flightCode: '',
            flightTime: '',
            initials: '',
            arrivedOn: '',
          };
          await idbSet(TRIP_KEY, trip);
        }
        localStorage.removeItem(LEGACY_DESTINATION_KEY);
      }
    } catch {
      // Migration is best-effort.
    }
  }

  state = { trip, onboardingSeen: seen };
  notify();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  void hydrate();
  return () => listeners.delete(fn);
}

function snapshot(): TripState {
  return state;
}

const SERVER_STATE: TripState = { trip: undefined, onboardingSeen: true };
function serverSnapshot(): TripState {
  return SERVER_STATE;
}

export function saveTripData(next: TripData | null) {
  state = { ...state, trip: next };
  void idbSet(TRIP_KEY, next);
  notify();
}

export function markOnboardingSeen() {
  state = { ...state, onboardingSeen: true };
  void idbSet(SEEN_KEY, true);
  notify();
}

/** Day 1 = arrival day. Null when no arrival date is set. */
export function dayOfTrip(trip: TripData | null | undefined, now = new Date()): number | null {
  if (!trip?.arrivedOn) return null;
  const arrived = new Date(`${trip.arrivedOn}T00:00:00`);
  if (Number.isNaN(arrived.getTime())) return null;
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((midnight.getTime() - arrived.getTime()) / 86_400_000) + 1;
  return days >= 1 ? days : null;
}

export function useTrip() {
  const { trip, onboardingSeen } = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const saveTrip = useCallback((next: TripData | null) => saveTripData(next), []);
  const dismissOnboarding = useCallback(() => markOnboardingSeen(), []);
  return {
    trip: trip ?? null,
    ready: trip !== undefined,
    onboardingSeen,
    saveTrip,
    dismissOnboarding,
  };
}
