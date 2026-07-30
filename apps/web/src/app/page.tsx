import { DEMO_TRIP } from '@overhear/shared';
import { OfflineReadyChip } from '@/components/OfflineReadyChip';
import { PinnedRow } from '@/components/PinnedRow';
import { Chip } from '@/components/ui/Chip';
import { ListenHero } from '@/components/ui/ListenHero';
import { ModeTabs } from '@/components/ui/ModeTabs';

export default function HomePage() {
  const trip = DEMO_TRIP;
  return (
    <main className="flex flex-1 flex-col gap-4 px-[18px] pt-3 pb-[18px]">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-px">
          <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
            {trip.destinationCity}
          </h1>
          <p className="text-[14px] leading-tight font-semibold text-ink-3">
            Day {trip.dayOfTrip}
            {trip.lodging ? ` · ${trip.lodging.name}` : ''}
          </p>
        </div>
        <div
          aria-label="Trip profile"
          className="grid size-11 place-items-center rounded-full bg-raised text-[15px] font-extrabold text-ink-2"
        >
          {trip.initials}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <OfflineReadyChip />
        {trip.flight && (
          <Chip>
            {trip.flight.code} · {trip.flight.departureTime}
          </Chip>
        )}
      </div>

      <section className="flex flex-1 flex-col items-center justify-center gap-5">
        <ListenHero />
        <p className="max-w-[250px] text-center text-[15px] leading-[1.45] font-medium text-ink-3">
          Aim at whoever&rsquo;s speaking. No typing, ever.
        </p>
      </section>

      <PinnedRow />

      <ModeTabs active="listen" />
    </main>
  );
}
