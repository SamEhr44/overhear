import Link from 'next/link';
import { ALL_PACKS } from '@overhear/shared';
import { Card } from '@/components/ui/Card';
import { ModeTabs } from '@/components/ui/ModeTabs';

export default function TalkPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-[18px] pt-3 pb-[18px]">
      <header className="flex flex-col gap-px">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">Talk</h1>
        <p className="text-[14px] leading-tight font-semibold text-ink-3">
          Hand-to-a-stranger conversation · zero typing
        </p>
      </header>

      <section className="flex flex-1 flex-col gap-3">
        <Link
          href="/talk/general"
          className="rounded-card bg-accent px-[15px] py-4 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.99]"
        >
          <span className="block text-[17px] leading-tight font-extrabold tracking-[-0.02em] text-white">
            Just talk
          </span>
          <span className="mt-0.5 block text-[13px] leading-tight font-bold text-accent-soft">
            Free conversation — speak, hand over, reply
          </span>
        </Link>

        <p className="mt-1 text-[11px] font-bold tracking-[0.08em] text-ink-3 uppercase">
          Situations
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PACKS.map((pack) => (
            <Link
              key={pack.id}
              href={`/talk/${pack.id}`}
              className="rounded-card border border-line bg-card px-[15px] py-[13px] transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="block text-[16px] leading-tight font-extrabold text-ink">
                {pack.title.en}
              </span>
              <span className="mt-0.5 block text-[13px] leading-tight font-semibold text-ink-3">
                {pack.tagline.en}
              </span>
              <span lang="es" className="mt-2 block text-[12px] leading-tight font-bold text-accent">
                {pack.title.es}
              </span>
            </Link>
          ))}
        </div>

        <Card className="px-[15px] py-[13px]">
          <p className="text-[13px] leading-[1.45] font-medium text-ink-2">
            Every pack speaks warm, polite Spanish (<span lang="es">usted</span>) and plays out
            loud with one tap — no connection needed for the phrase decks.
          </p>
        </Card>
      </section>

      <ModeTabs active="talk" />
    </main>
  );
}
