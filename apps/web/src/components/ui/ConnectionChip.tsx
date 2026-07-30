'use client';

import type { ConnectionStatus } from '@/lib/ws';

const LOOK: Record<ConnectionStatus, { chip: string; dot: string; label: (rtt: number | null) => string }> = {
  unconfigured: {
    chip: 'bg-raised text-ink-2',
    dot: 'bg-ink-3',
    label: () => 'No caption API yet',
  },
  connecting: {
    chip: 'bg-raised text-ink-2',
    dot: 'bg-warn',
    label: () => 'Connecting…',
  },
  connected: {
    chip: 'bg-online-tint text-online-deep',
    dot: 'bg-online',
    label: (rtt) => (rtt === null ? 'Live' : `Live · ${rtt} ms`),
  },
  offline: {
    chip: 'bg-raised text-warn',
    dot: 'bg-warn',
    label: () => 'Reconnecting…',
  },
};

/** Persistent connectivity chip — every screen tells the truth about the link. */
export function ConnectionChip({ status, rttMs }: { status: ConnectionStatus; rttMs: number | null }) {
  const look = LOOK[status];
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-[7px] rounded-full px-[13px] py-[9px] text-[13px] leading-none font-bold ${look.chip}`}
    >
      <span aria-hidden className={`size-2 rounded-full ${look.dot}`} />
      {look.label(rttMs)}
    </span>
  );
}
