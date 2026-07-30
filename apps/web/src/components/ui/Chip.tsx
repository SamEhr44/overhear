import type { ReactNode } from 'react';

/**
 * Status chip from the Home header row — pill, 13px bold.
 * `positive` renders the online-tinted variant with a status dot.
 */
export function Chip({
  children,
  variant = 'neutral',
  dot = false,
}: {
  children: ReactNode;
  variant?: 'neutral' | 'positive';
  dot?: boolean;
}) {
  const palette =
    variant === 'positive' ? 'bg-online-tint text-online-deep' : 'bg-raised text-ink-2';
  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-full px-[13px] py-[9px] text-[13px] leading-none font-bold ${palette}`}
    >
      {dot && (
        <span
          aria-hidden
          className={`size-2 rounded-full ${variant === 'positive' ? 'bg-online' : 'bg-ink-3'}`}
        />
      )}
      {children}
    </span>
  );
}
