'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Caption } from '@overhear/shared';
import { SavedSheet } from '@/components/SavedSheet';
import { ActionChip } from '@/components/ui/ActionChip';
import { Card } from '@/components/ui/Card';
import { ConfidenceNote } from '@/components/ui/ConfidenceNote';
import { ConnectionChip } from '@/components/ui/ConnectionChip';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Toggle } from '@/components/ui/Toggle';
import { lowConfidenceInfo } from '@/lib/captions';
import { usePins } from '@/lib/pins';
import { useApiConnection } from '@/lib/useApiConnection';
import { useListenSession } from '@/lib/useListenSession';

const SUB_MODES = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'around-me', label: 'Around me' },
  { id: 'one-person', label: 'One person' },
];

function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ListenPage() {
  const [subMode, setSubMode] = useState('announcements');
  const [boostHeld, setBoostHeld] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [justPinned, setJustPinned] = useState(false);
  const connection = useApiConnection();
  const session = useListenSession(connection);
  const { pins, addPin, removePin } = usePins();
  const streamRef = useRef<HTMLDivElement>(null);

  const { finals, partial } = session.captions;
  const lastFinal: Caption | undefined = finals[finals.length - 1];
  const hasCaptions = finals.length > 0 || partial !== null;
  const lowInfo = lastFinal ? lowConfidenceInfo(lastFinal) : null;

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [finals.length, partial?.sourceText]);

  useEffect(() => {
    if (!justPinned) return;
    const t = setTimeout(() => setJustPinned(false), 1500);
    return () => clearTimeout(t);
  }, [justPinned]);

  const holdBoost = (on: boolean) => {
    setBoostHeld(on);
    session.setBoost(on);
  };

  return (
    <main className="relative flex flex-1 flex-col gap-3.5 px-[18px] pt-3 pb-[18px]">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-chip py-2 pr-3 text-[14px] font-bold text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ‹ Home
        </Link>
        <ConnectionChip status={connection.status} rttMs={connection.rttMs} />
      </div>

      <SegmentedTabs items={SUB_MODES} value={subMode} onChange={setSubMode} label="Listen focus" />

      <section
        ref={streamRef}
        aria-label="Captions"
        className="flex flex-1 flex-col gap-4 overflow-y-auto"
      >
        {hasCaptions ? (
          <>
            <div aria-live="polite" className="flex flex-col gap-4">
              {finals.slice(0, -1).map((c) => (
                <div key={c.id} className="opacity-40">
                  <p className="mb-[5px] text-[12px] leading-none font-bold text-ink-3">
                    {formatTime(c.finalizedAt ?? c.startedAt)}
                  </p>
                  <p className="text-[18px] leading-[1.4] font-medium text-ink">
                    {c.targetText || c.sourceText}
                  </p>
                </div>
              ))}
              {lastFinal && (
                <div>
                  <p className="mb-[5px] text-[12px] leading-none font-bold text-ink-3">
                    {formatTime(lastFinal.finalizedAt ?? lastFinal.startedAt)}
                  </p>
                  <p className="text-[18px] leading-[1.4] font-semibold text-ink">
                    {lastFinal.targetText || lastFinal.sourceText}
                  </p>
                  {lowInfo && (
                    <div className="mt-3">
                      <ConfidenceNote title="Not fully sure">
                        Heard <strong lang="es">&ldquo;{lowInfo.quote}&rdquo;</strong> —
                        double-check anything important.
                      </ConfidenceNote>
                    </div>
                  )}
                  {explainOpen && (
                    <div className="mt-3">
                      <Card className="px-[15px] py-[13px]">
                        <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
                          What was heard
                        </p>
                        <p lang="es" className="text-[15px] leading-[1.4] font-medium text-ink-2">
                          {lastFinal.sourceText}
                        </p>
                        <p className="mt-1.5 text-[12px] leading-none font-bold text-ink-3">
                          Confidence {Math.round(lastFinal.confidence * 100)}%
                          {session.providers ? ` · ${session.providers.asr}` : ''}
                        </p>
                      </Card>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <ActionChip aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)}>
                      Explain that
                    </ActionChip>
                    <ActionChip
                      onClick={() => {
                        addPin({ es: lastFinal.sourceText, en: lastFinal.targetText });
                        setJustPinned(true);
                      }}
                    >
                      {justPinned ? 'Pinned ✓' : 'Pin'}
                    </ActionChip>
                    <ActionChip onClick={() => session.speak(lastFinal.targetText)}>
                      Replay
                    </ActionChip>
                  </div>
                </div>
              )}
            </div>
            {partial && (
              <div>
                <p className="mb-1.5 flex items-center gap-[7px] text-[12px] leading-none font-extrabold text-online-deep">
                  <span aria-hidden className="size-[7px] animate-pulse rounded-full bg-online" />
                  LIVE · {formatTime(partial.startedAt)}
                </p>
                {partial.targetText ? (
                  <p className="text-[29px] leading-[1.18] font-extrabold tracking-[-0.03em] text-ink">
                    {partial.targetText}
                  </p>
                ) : (
                  <p
                    lang="es"
                    className="text-[29px] leading-[1.18] font-extrabold tracking-[-0.03em] text-ink-2"
                  >
                    {partial.sourceText}
                  </p>
                )}
              </div>
            )}
            {!partial && session.state === 'live' && (
              <p className="text-[13px] font-semibold text-ink-3">Listening…</p>
            )}
          </>
        ) : (
          <>
            {session.state === 'live' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <span aria-hidden className="size-2.5 animate-pulse rounded-full bg-online" />
                <p className="text-[18px] leading-[1.4] font-bold text-ink">Listening…</p>
                <p className="max-w-[250px] text-[14px] leading-[1.45] font-medium text-ink-3">
                  Point the phone at whoever&rsquo;s speaking. Captions appear here.
                </p>
                {session.providers && (
                  <p className="text-[11px] font-bold tracking-[0.08em] text-ink-3 uppercase">
                    {session.providers.asr} · {session.providers.mt}
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="text-[11px] font-bold tracking-[0.08em] text-ink-3 uppercase">
                  Preview — captions go live when listening starts
                </p>
                <div className="opacity-40">
                  <p className="mb-[5px] text-[12px] leading-none font-bold text-ink-3">
                    9:43 · Gate area
                  </p>
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
                </div>

                {connection.status === 'connected' && session.state === 'starting' && (
                  <p className="text-[13px] font-semibold text-ink-3">Starting microphone…</p>
                )}
                {connection.status === 'connected' &&
                  (session.state === 'idle' || session.state === 'needs-tap') && (
                    <button
                      type="button"
                      onClick={session.start}
                      className="rounded-[20px] bg-accent px-6 py-[18px] text-center text-[17px] leading-none font-extrabold tracking-[-0.02em] text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]"
                    >
                      Start listening
                    </button>
                  )}
                {session.state === 'mic-denied' && (
                  <ConfidenceNote title="Microphone blocked">
                    Overhear needs the mic to caption speech around you. Allow microphone access
                    for this site in your browser settings, then try again.
                  </ConfidenceNote>
                )}
                {session.state === 'mic-unavailable' && (
                  <ConfidenceNote title="No microphone found">
                    No usable microphone was detected on this device.
                  </ConfidenceNote>
                )}
                {session.state === 'asr-error' && (
                  <div className="flex flex-col gap-3">
                    <ConfidenceNote title="Captions interrupted">
                      The speech service couldn&rsquo;t be reached. Your connection is fine — this
                      is on our side.
                    </ConfidenceNote>
                    <button
                      type="button"
                      onClick={session.start}
                      className="self-start rounded-chip border border-line bg-card px-[13px] py-2.5 text-[14px] leading-none font-bold text-ink hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      Try again
                    </button>
                  </div>
                )}
                {connection.status !== 'connected' && (
                  <ConfidenceNote title="Needs connection">
                    Live captions stream over the network in this web MVP.
                    {connection.status === 'unconfigured'
                      ? ' The caption API is not configured for this build.'
                      : ' Reconnecting to the caption API…'}{' '}
                    Phrase packs, SOS and saved phrases will work offline (M4).
                  </ConfidenceNote>
                )}
              </>
            )}
          </>
        )}
      </section>

      <Card className="flex items-center justify-between px-[15px] py-[13px]">
        <span className="text-[15px] leading-none font-bold text-ink">Whisper in ear</span>
        <Toggle
          checked={session.whisper}
          onChange={session.setWhisper}
          label="Whisper translations into earbuds"
        />
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-pressed={boostHeld}
          disabled={session.state !== 'live'}
          onPointerDown={() => holdBoost(true)}
          onPointerUp={() => holdBoost(false)}
          onPointerLeave={() => holdBoost(false)}
          onPointerCancel={() => holdBoost(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex-1 rounded-[20px] bg-accent py-[21px] text-center text-[18px] leading-none font-extrabold tracking-[-0.02em] text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-40 ${
            boostHeld ? 'scale-[0.98] brightness-110' : ''
          }`}
        >
          Hold to boost
        </button>
        <button
          type="button"
          aria-label={`Saved captions (${pins.length})`}
          onClick={() => setSavedOpen(true)}
          className="grid size-16 place-items-center rounded-[20px] border border-line bg-card text-[22px] text-ink-2 transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ▣
        </button>
      </div>

      {savedOpen && (
        <SavedSheet pins={pins} onRemove={removePin} onClose={() => setSavedOpen(false)} />
      )}
    </main>
  );
}
