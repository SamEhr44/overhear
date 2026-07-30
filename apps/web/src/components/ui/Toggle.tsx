'use client';

/** Switch from the Listen mock — 50×30 pill, online-green when on. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        checked ? 'bg-online' : 'bg-line'
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[3px] size-6 rounded-full bg-card shadow-card transition-[left] duration-150 ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  );
}
