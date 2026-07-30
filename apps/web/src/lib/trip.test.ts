import { describe, expect, it } from 'vitest';
import { dayOfTrip, type TripData } from './trip';

function trip(arrivedOn: string): TripData {
  return {
    city: 'Puerto Vallarta',
    lodgingName: 'Casa Kimberly',
    lodgingAddress: '',
    flightCode: '',
    flightTime: '',
    initials: 'JR',
    arrivedOn,
  };
}

describe('dayOfTrip', () => {
  it('counts arrival day as day 1', () => {
    expect(dayOfTrip(trip('2026-07-30'), new Date(2026, 6, 30, 15, 0))).toBe(1);
  });

  it('counts subsequent days', () => {
    expect(dayOfTrip(trip('2026-07-28'), new Date(2026, 6, 30, 9, 0))).toBe(3);
  });

  it('is null before arrival, without a date, or with junk', () => {
    expect(dayOfTrip(trip('2026-08-02'), new Date(2026, 6, 30))).toBeNull();
    expect(dayOfTrip(trip(''))).toBeNull();
    expect(dayOfTrip(trip('not-a-date'))).toBeNull();
    expect(dayOfTrip(null)).toBeNull();
  });
});
