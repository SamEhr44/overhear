'use client';

/**
 * Listen sub-mode switcher — raised track, ink-filled active segment.
 * (From the Listen mock: Announcements / Around me / One person.)
 */
export function SegmentedTabs({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1.5 rounded-card bg-raised p-1">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex-1 rounded-[10px] py-[11px] text-center text-[13px] leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active ? 'bg-ink font-extrabold text-surface' : 'font-bold text-ink-2 hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
