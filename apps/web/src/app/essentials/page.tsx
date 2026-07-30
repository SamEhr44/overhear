import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function EssentialsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-[18px] pt-3 pb-[18px]">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-chip py-2 pr-3 text-[14px] font-bold text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ‹ Home
        </Link>
      </div>

      <header className="flex flex-col gap-px">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          Essentials
        </h1>
        <p className="text-[14px] leading-tight font-semibold text-ink-3">SOS &amp; key phrases</p>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-3">
        <Card className="border-sos/30 px-[15px] py-[13px]">
          <p className="mb-1.5 text-[12px] leading-none font-extrabold text-sos uppercase">
            In a real emergency
          </p>
          <p className="text-[15px] leading-[1.45] font-medium text-ink-2">
            Call <a href="tel:911" className="font-extrabold text-sos underline">911</a> — Mexico&rsquo;s
            national emergency number. It works from any phone.
          </p>
        </Card>
        <Card className="px-[15px] py-[13px]">
          <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
            Coming in M4
          </p>
          <p className="text-[15px] leading-[1.45] font-medium text-ink-2">
            The full offline Essentials board: medical, police, and help phrases with tap-to-play
            Spanish audio, plus your key documents and address — all available without a
            connection.
          </p>
        </Card>
      </section>
    </main>
  );
}
