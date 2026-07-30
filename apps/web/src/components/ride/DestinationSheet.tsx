'use client';

import { useEffect, useState } from 'react';
import type { Destination } from '@/lib/destination';

/** One-time destination setup — becomes the card you show any driver. */
export function DestinationSheet({
  initial,
  onSave,
  onClose,
}: {
  initial: Destination | null;
  onSave: (d: Destination | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');

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
      aria-label="Set destination"
      className="absolute inset-0 z-[60] flex flex-col justify-end bg-ink/40"
      onClick={onClose}
    >
      <div
        className="rounded-t-[20px] bg-surface p-[18px] pb-[calc(18px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-[18px] leading-none font-extrabold tracking-[-0.02em] text-ink">
          Where are you staying?
        </h2>
        <p className="mb-3 text-[13px] leading-[1.45] font-medium text-ink-3">
          Stays on this phone only. Type it once — it becomes a card you can show any driver.
        </p>
        <label className="mb-2 block">
          <span className="mb-1 block text-[12px] font-bold tracking-[0.06em] text-ink-3 uppercase">
            Place name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Casa Kimberly"
            className="w-full rounded-chip border border-line bg-card px-[13px] py-3 text-[16px] font-semibold text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-accent"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-[12px] font-bold tracking-[0.06em] text-ink-3 uppercase">
            Address
          </span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Calle Zaragoza 445, Centro"
            className="w-full rounded-chip border border-line bg-card px-[13px] py-3 text-[16px] font-semibold text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-accent"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-chip bg-raised px-4 py-3 text-[14px] leading-none font-bold text-ink-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(name.trim() || address.trim() ? { name: name.trim(), address: address.trim() } : null);
              onClose();
            }}
            className="flex-1 rounded-chip bg-accent px-4 py-3 text-[15px] leading-none font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Save destination
          </button>
        </div>
      </div>
    </div>
  );
}
