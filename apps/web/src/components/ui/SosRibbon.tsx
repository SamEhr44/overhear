import Link from 'next/link';

/**
 * Quiet edge-tab SOS — pinned to the right edge of the app column on every
 * screen. Routes to the Essentials/SOS board (full board lands in M4).
 */
export function SosRibbon() {
  return (
    <Link
      href="/essentials"
      aria-label="Emergency — open essentials"
      className="absolute top-[41%] right-0 z-50 flex flex-col items-center gap-[3px] rounded-l-card bg-sos px-[7px] py-[15px] text-[12px] leading-none font-extrabold tracking-[0.06em] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span aria-hidden>S</span>
      <span aria-hidden>O</span>
      <span aria-hidden>S</span>
    </Link>
  );
}
