import type { HTMLAttributes } from 'react';

/** White card on the surface — 14px radius, hairline border. */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-card border border-line bg-card ${className}`} {...props} />
  );
}
