import { Card } from '@/components/ui/Card';
import { ModeTabs } from '@/components/ui/ModeTabs';

export default function RidePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-[18px] pt-3 pb-[18px]">
      <header className="flex flex-col gap-px">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">Ride</h1>
        <p className="text-[14px] leading-tight font-semibold text-ink-3">Driver comms</p>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-3">
        <Card className="px-[15px] py-[13px]">
          <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
            Coming in M3
          </p>
          <p className="text-[15px] leading-[1.45] font-medium text-ink-2">
            A destination card in Spanish from your Trip Context, a tap-to-play phrase deck for the
            driver, paste or screenshot → translate, and a &ldquo;speaker + Listen&rdquo; flow for
            calls.
          </p>
        </Card>
      </section>

      <ModeTabs active="ride" />
    </main>
  );
}
