/**
 * Animated equalizer bars from the Listen hero — four bars pulsing with a
 * 140 ms stagger. Purely decorative.
 */
export function EqBars({
  bar = 'bg-surface',
  height = 40,
  width = 6,
  count = 4,
}: {
  bar?: string;
  height?: number;
  width?: number;
  count?: number;
}) {
  return (
    <div aria-hidden className="flex items-end gap-[5px]" style={{ height }}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-full rounded-[4px] ${bar} animate-oh-bar`}
          style={{ width, animationDelay: `${i * 0.14}s` }}
        />
      ))}
    </div>
  );
}
