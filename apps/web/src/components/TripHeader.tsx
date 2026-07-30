'use client';

import Link from 'next/link';
import { Chip } from '@/components/ui/Chip';
import { OfflineReadyChip } from '@/components/OfflineReadyChip';
import { dayOfTrip, useTrip } from '@/lib/trip';

/**
 * Home header + status chips driven by the real Trip Context. The avatar
 * opens trip setup; a prompt card appears until a trip exists.
 */
export function TripHeader() {
  const { trip, ready, onboardingSeen } = useTrip();
  const day = dayOfTrip(trip);

  const title = trip?.city || (trip?.lodgingName ? trip.lodgingName : 'Overhear');
  const subtitleParts = [
    day ? `Day ${day}` : null,
    trip?.city && trip.lodgingName ? trip.lodgingName : null,
  ].filter(Boolean);
  const subtitle = subtitleParts.length
    ? subtitleParts.join(' · ')
    : trip
      ? 'Your travel cockpit'
      : 'English ⇄ Spanish, hands-on';

  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-px">
          <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
            {title}
          </h1>
          <p className="text-[14px] leading-tight font-semibold text-ink-3">{subtitle}</p>
        </div>
        <Link
          href="/onboarding"
          aria-label="Trip settings"
          className="grid size-11 place-items-center rounded-full bg-raised text-[15px] font-extrabold text-ink-2 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {trip?.initials || '⌂'}
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        <OfflineReadyChip />
        {trip?.flightCode && (
          <Chip>
            {trip.flightCode}
            {trip.flightTime ? ` · ${trip.flightTime}` : ''}
          </Chip>
        )}
      </div>

      {ready && !trip && !onboardingSeen && (
        <Link
          href="/onboarding"
          className="rounded-card bg-accent px-[15px] py-[13px] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.99]"
        >
          <span className="block text-[15px] leading-tight font-extrabold text-white">
            Set up your trip — 30 seconds
          </span>
          <span className="mt-0.5 block text-[13px] leading-tight font-bold text-accent-soft">
            City, hotel and flight power the driver card and SOS board
          </span>
        </Link>
      )}
    </>
  );
}
