import { PinnedRow } from '@/components/PinnedRow';
import { TripHeader } from '@/components/TripHeader';
import { ListenHero } from '@/components/ui/ListenHero';
import { ModeTabs } from '@/components/ui/ModeTabs';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-[18px] pt-3 pb-[18px]">
      <TripHeader />

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
