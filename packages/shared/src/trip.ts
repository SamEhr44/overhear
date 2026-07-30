/**
 * Trip Context — the local, on-device traveler profile.
 * Lives in IndexedDB on the client (M4); never uploaded. The API is stateless
 * with respect to trips.
 */
export interface TripContext {
  destinationCity: string;
  /** 1-based day of the trip, shown as "Day 2". */
  dayOfTrip: number;
  lodging?: {
    name: string;
    address?: string;
  };
  flight?: {
    code: string;
    /** Local departure time, e.g. "18:20". */
    departureTime: string;
  };
  /** Traveler initials for the avatar. */
  initials: string;
}

export const DEMO_TRIP: TripContext = {
  destinationCity: 'Puerto Vallarta',
  dayOfTrip: 2,
  lodging: { name: 'Casa Kimberly' },
  flight: { code: 'AM 674', departureTime: '18:20' },
  initials: 'JR',
};
