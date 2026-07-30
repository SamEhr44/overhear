'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActionChip } from '@/components/ui/ActionChip';
import { Card } from '@/components/ui/Card';
import { ConfidenceNote } from '@/components/ui/ConfidenceNote';
import { ConnectionChip } from '@/components/ui/ConnectionChip';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Toggle } from '@/components/ui/Toggle';
import { useApiConnection, type TranslationOutcome } from '@/lib/useApiConnection';

const SUB_MODES = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'around-me', label: 'Around me' },
  { id: 'one-person', label: 'One person' },
];

/** The M0 round-trip probe sentence (also the design's sample utterance). */
const PROBE_TEXT = '¿Dónde está la puerta veintidós?';

export default function ListenPage() {
  const [subMode, setSubMode] = useState('announcements');
  const [whisper, setWhisper] = useState(true);
  const [boostHeld, setBoostHeld] = useState(false);
  const [probe, setProbe] = useState<TranslationOutcome | null>(null);
  const { status, rttMs, translate } = useApiConnection();

  // M0 "hello world": once connected, run one real text round trip through the
  // API (web → WS → mock MT provider → back) and show it in the stream.
  useEffect(() => {
    if (status !== 'connected' || probe !== null) return;
    let cancelled = false;
    translate(PROBE_TEXT, 'es', 'en')
      .then((outcome) => {
        if (!cancelled) setProbe(outcome);
      })
      .catch(() => {
        /* chip already reports the connection state */
      });
    return () => {
      cancelled = true;
    };
  }, [status, probe, translate]);

  return (
    <main className="flex flex-1 flex-col gap-3.5 px-[18px] pt-3 pb-[18px]">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-chip py-2 pr-3 text-[14px] font-bold text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ‹ Home
        </Link>
        <ConnectionChip status={status} rttMs={rttMs} />
      </div>

      <SegmentedTabs items={SUB_MODES} value={subMode} onChange={setSubMode} label="Listen focus" />

      <section aria-label="Captions" className="flex flex-1 flex-col gap-4 overflow-hidden">
        <p className="text-[11px] font-bold tracking-[0.08em] text-ink-3 uppercase">
          Preview — live captions land in M1
        </p>

        <div className="opacity-40">
          <p className="mb-[5px] text-[12px] leading-none font-bold text-ink-3">9:43 · Gate area</p>
          <p className="text-[18px] leading-[1.4] font-medium text-ink">
            Passengers travelling to Mexico City, please have your boarding pass ready.
          </p>
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-[7px] text-[12px] leading-none font-extrabold text-online-deep">
            <span aria-hidden className="size-[7px] rounded-full bg-online" />
            LIVE · 9:44
          </p>
          <p className="text-[29px] leading-[1.18] font-extrabold tracking-[-0.03em] text-ink">
            Flight 674 to Mexico City is now boarding at gate 22.
          </p>
          <div className="mt-3">
            <ConfidenceNote title="Not fully sure">
              Heard <strong lang="es">&ldquo;puerta veintidós&rdquo;</strong> — could be 22 or 32.
              Worth a glance at the board.
            </ConfidenceNote>
          </div>
          <div className="mt-3 flex gap-2">
            <ActionChip>Explain that</ActionChip>
            <ActionChip>Pin</ActionChip>
            <ActionChip>Replay</ActionChip>
          </div>
        </div>

        {probe ? (
          <div>
            <p className="mb-[5px] text-[12px] leading-none font-extrabold text-online-deep">
              LIVE CHECK · {probe.provider} · {probe.roundTripMs} ms
            </p>
            <p className="text-[18px] leading-[1.4] font-semibold text-ink">
              <span lang="es" className="text-ink-2">
                {PROBE_TEXT}
              </span>{' '}
              → {probe.targetText}
            </p>
          </div>
        ) : status !== 'connected' ? (
          <ConfidenceNote title="Needs connection">
            Live captions stream over the network in this web MVP.
            {status === 'unconfigured'
              ? ' The caption API is not deployed yet (M0 skeleton).'
              : ' Reconnecting to the caption API…'}{' '}
            Phrase packs, SOS and saved phrases will work offline (M4).
          </ConfidenceNote>
        ) : null}
      </section>

      <Card className="flex items-center justify-between px-[15px] py-[13px]">
        <span id="whisper-label" className="text-[15px] leading-none font-bold text-ink">
          Whisper in ear
        </span>
        <Toggle checked={whisper} onChange={setWhisper} label="Whisper translations into earbuds" />
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-pressed={boostHeld}
          onPointerDown={() => setBoostHeld(true)}
          onPointerUp={() => setBoostHeld(false)}
          onPointerLeave={() => setBoostHeld(false)}
          className={`flex-1 rounded-[20px] bg-accent py-[21px] text-center text-[18px] leading-none font-extrabold tracking-[-0.02em] text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            boostHeld ? 'scale-[0.98] brightness-110' : ''
          }`}
        >
          Hold to boost
        </button>
        <button
          type="button"
          aria-label="Saved captions"
          className="grid size-16 place-items-center rounded-[20px] border border-line bg-card text-[22px] text-ink-2 transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ▣
        </button>
      </div>
    </main>
  );
}
