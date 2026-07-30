'use client';

import { usePins } from '@/lib/pins';

/** Demo pins matching the design mock, shown until the user pins real ones. */
const DEMO_PINNED = ['Sin cilantro, por favor', 'La cuenta'];

export function PinnedRow() {
  const { pins } = usePins();
  const items = pins.length > 0 ? pins.slice(0, 8).map((p) => p.es) : DEMO_PINNED;
  return (
    <section aria-label="Pinned phrases" className="flex gap-2 overflow-x-auto">
      {items.map((phrase) => (
        <span
          key={phrase}
          lang="es"
          className="flex-none rounded-card border border-line bg-card px-[13px] py-[11px] text-[14px] leading-none font-bold text-ink"
        >
          {phrase}
        </span>
      ))}
    </section>
  );
}
