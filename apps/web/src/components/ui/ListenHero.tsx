'use client';

import { useRouter } from 'next/navigation';
import { EqBars } from './EqBars';

/**
 * The Home hero — 264px accent square with pulse ring and EQ bars.
 * Tapping it enters Listen.
 */
export function ListenHero() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Start Listen — live English captions"
      onClick={() => router.push('/listen')}
      className="group relative size-[264px] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-hero"
    >
      <span aria-hidden className="absolute inset-0 rounded-hero bg-accent animate-oh-pulse" />
      <span className="relative flex size-full flex-col items-center justify-center gap-2.5 rounded-hero bg-accent shadow-hero transition-transform duration-150 group-active:scale-[0.98]">
        <EqBars />
        <span className="text-[46px] leading-none font-extrabold tracking-[-0.04em] text-white">
          Listen
        </span>
        <span className="text-[15px] leading-none font-bold text-accent-soft">
          Tap for English captions
        </span>
      </span>
    </button>
  );
}
