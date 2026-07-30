'use client';

import { useEffect } from 'react';
import type { Pin } from '@/lib/pins';
import { Card } from './ui/Card';

/** Overlay listing pinned captions/phrases (▣ on the Listen screen). */
export function SavedSheet({
  pins,
  onRemove,
  onClose,
}: {
  pins: Pin[];
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Saved phrases"
      className="absolute inset-0 z-[60] flex flex-col justify-end bg-ink/40"
      onClick={onClose}
    >
      <div
        className="max-h-[70%] overflow-y-auto rounded-t-[20px] bg-surface p-[18px] pb-[calc(18px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] leading-none font-extrabold tracking-[-0.02em] text-ink">
            Saved
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-chip bg-raised px-3 py-2 text-[13px] leading-none font-bold text-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Close
          </button>
        </div>
        {pins.length === 0 ? (
          <p className="py-6 text-center text-[14px] font-medium text-ink-3">
            Nothing saved yet — tap Pin under a caption to keep it.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pins.map((pin) => (
              <li key={pin.id}>
                <Card className="flex items-start justify-between gap-3 px-[15px] py-[13px]">
                  <div className="min-w-0">
                    <p lang="es" className="text-[15px] leading-[1.35] font-bold text-ink">
                      {pin.es}
                    </p>
                    {pin.en && (
                      <p className="mt-0.5 text-[14px] leading-[1.35] font-medium text-ink-2">
                        {pin.en}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove "${pin.es}"`}
                    onClick={() => onRemove(pin.id)}
                    className="rounded-chip px-2 py-1 text-[16px] leading-none font-bold text-ink-3 hover:text-sos focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    ✕
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
