'use client';

import type { ButtonHTMLAttributes } from 'react';

/** Small bordered action under a caption — "Explain that", "Pin", "Replay". */
export function ActionChip({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-chip border border-line bg-card px-[13px] py-2.5 text-[14px] leading-none font-bold text-ink transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-raised ${className}`}
      {...props}
    />
  );
}
