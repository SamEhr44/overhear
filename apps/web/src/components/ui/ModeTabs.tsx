'use client';

import Link from 'next/link';

const MODES = [
  { id: 'listen', label: 'Listen', href: '/' },
  { id: 'talk', label: 'Talk', href: '/talk' },
  { id: 'ride', label: 'Ride', href: '/ride' },
] as const;

export type ModeId = (typeof MODES)[number]['id'];

/**
 * Bottom mode switcher — raised track, white active card with soft shadow.
 * Listen is the hero mode and lives on the app root.
 */
export function ModeTabs({ active }: { active: ModeId }) {
  return (
    <nav aria-label="Modes" className="flex gap-1 rounded-control bg-raised p-[5px]">
      {MODES.map((mode) => {
        const isActive = mode.id === active;
        return (
          <Link
            key={mode.id}
            href={mode.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 rounded-card py-3.5 text-center text-[16px] leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isActive
                ? 'bg-card font-extrabold text-ink shadow-card'
                : 'font-bold text-ink-3 hover:text-ink-2'
            }`}
          >
            {mode.label}
          </Link>
        );
      })}
    </nav>
  );
}
