'use client';

import { useCallback } from 'react';
import { saveTripData, useTrip } from './trip';

export interface Destination {
  name: string;
  address: string;
}

/**
 * Ride's view of the Trip Context lodging — same store, narrower lens.
 * (M3 kept this in localStorage; M4 unified it into the IndexedDB trip and
 * migrates old values automatically.)
 */
export function useDestination() {
  const { trip } = useTrip();

  const destination: Destination | null =
    trip && (trip.lodgingName || trip.lodgingAddress)
      ? { name: trip.lodgingName, address: trip.lodgingAddress }
      : null;

  const setDestination = useCallback(
    (next: Destination | null) => {
      const base = trip ?? {
        city: '',
        lodgingName: '',
        lodgingAddress: '',
        flightCode: '',
        flightTime: '',
        initials: '',
        arrivedOn: '',
      };
      saveTripData({
        ...base,
        lodgingName: next?.name.trim() ?? '',
        lodgingAddress: next?.address.trim() ?? '',
      });
    },
    [trip],
  );

  return { destination, setDestination };
}
