'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getPack, QUICK_REPLIES } from '@overhear/shared';
import { IntroCard } from '@/components/talk/IntroCard';
import { ActionChip } from '@/components/ui/ActionChip';
import { ConfidenceNote } from '@/components/ui/ConfidenceNote';
import { ConnectionChip } from '@/components/ui/ConnectionChip';
import { hasVoiceFor } from '@/lib/tts';
import { useApiConnection } from '@/lib/useApiConnection';
import { useTalkSession } from '@/lib/useTalkSession';

function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ConversationPage() {
  const params = useParams<{ pack: string }>();
  const pack = getPack(params.pack);
  const isGeneral = params.pack === 'general';
  if (!pack && !isGeneral) notFound();

  const connection = useApiConnection();
  const session = useTalkSession(connection);
  const [introDone, setIntroDone] = useState(false);
  const [spanishVoice, setSpanishVoice] = useState(true);
  const streamRef = useRef<HTMLDivElement>(null);

  const connected = connection.status === 'connected';
  const { turn, phase, entries, livePartial } = session;
  const lastEntry = entries[entries.length - 1];
  const showQuickReplies =
    turn === 'me' && phase === 'idle' && lastEntry?.speaker === 'them';
  const showIntro = turn === 'them' && !introDone;

  useEffect(() => {
    void hasVoiceFor('es').then(setSpanishVoice);
  }, []);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length, livePartial?.sourceText, turn, phase]);

  const speakButton = (() => {
    const es = turn === 'them';
    if (phase === 'recording') {
      return {
        label: es ? 'Le escucho… toque al terminar' : 'Listening… tap when done',
        onClick: session.stopRecording,
        disabled: false,
        recording: true,
      };
    }
    if (phase === 'processing') {
      return {
        label: es ? 'Traduciendo…' : 'Translating…',
        onClick: () => {},
        disabled: true,
        recording: false,
      };
    }
    return {
      label: es ? 'Toque y hable' : 'Tap to speak English',
      onClick: session.startRecording,
      disabled: !connected,
      recording: false,
    };
  })();

  return (
    <main className="relative flex flex-1 flex-col gap-3.5 px-[18px] pt-3 pb-[18px]">
      <div className="flex items-center justify-between">
        <Link
          href="/talk"
          className="rounded-chip py-2 pr-3 text-[14px] font-bold text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ‹ {pack ? pack.title.en : 'Just talk'}
        </Link>
        <ConnectionChip status={connection.status} rttMs={connection.rttMs} />
      </div>

      <section
        ref={streamRef}
        aria-label="Conversation"
        className="flex flex-1 flex-col gap-4 overflow-y-auto"
      >
        {entries.length === 0 && !livePartial && (
          <div className="rounded-card border border-line bg-card px-[15px] py-[13px]">
            <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
              How it works
            </p>
            <p className="text-[14px] leading-[1.5] font-medium text-ink-2">
              Tap the button and speak English — it appears in Spanish and plays out loud. Then
              hand the phone over: their Spanish comes back to you in English. One turn at a
              time, no typing.
            </p>
          </div>
        )}

        <div aria-live="polite" className="flex flex-col gap-4">
          {entries.map((entry, i) => {
            const isLast = i === entries.length - 1;
            return (
              <div key={entry.id} className={isLast ? '' : 'opacity-50'}>
                <p
                  className={`mb-[5px] text-[12px] leading-none font-extrabold uppercase ${
                    entry.speaker === 'me' ? 'text-accent' : 'text-online-deep'
                  }`}
                >
                  {entry.speaker === 'me' ? 'You · in Spanish' : 'Them · in English'} ·{' '}
                  {formatTime(entry.at)}
                  {entry.approximate && <span className="text-warn"> · connection dropped</span>}
                </p>
                {entry.speaker === 'me' ? (
                  <>
                    <p
                      lang="es"
                      className="text-[26px] leading-[1.22] font-extrabold tracking-[-0.02em] text-ink"
                    >
                      {entry.targetText || entry.sourceText}
                    </p>
                    <p className="mt-1 text-[14px] leading-[1.4] font-medium text-ink-3">
                      {entry.sourceText}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[22px] leading-[1.25] font-extrabold tracking-[-0.02em] text-ink">
                      {entry.targetText || entry.sourceText}
                    </p>
                    <p lang="es" className="mt-1 text-[14px] leading-[1.4] font-medium text-ink-3">
                      {entry.sourceText}
                    </p>
                  </>
                )}
                {isLast && (
                  <div className="mt-2 flex gap-2">
                    <ActionChip onClick={() => session.replay(entry)}>
                      ▸ {entry.speaker === 'me' ? 'Repetir' : 'Replay in Spanish'}
                    </ActionChip>
                  </div>
                )}
              </div>
            );
          })}

          {livePartial && phase === 'recording' && (
            <div>
              <p className="mb-1.5 flex items-center gap-[7px] text-[12px] leading-none font-extrabold text-online-deep">
                <span aria-hidden className="size-[7px] animate-pulse rounded-full bg-online" />
                LIVE
              </p>
              {livePartial.targetText ? (
                <p className="text-[26px] leading-[1.22] font-extrabold tracking-[-0.02em] text-ink">
                  {livePartial.targetText}
                </p>
              ) : (
                <p className="text-[26px] leading-[1.22] font-extrabold tracking-[-0.02em] text-ink-2">
                  {livePartial.sourceText}
                </p>
              )}
            </div>
          )}
        </div>

        {!connected && (
          <ConfidenceNote title="Needs connection">
            Live conversation streams over the network.
            {connection.status === 'unconfigured'
              ? ' The caption API is not configured for this build.'
              : ' Reconnecting…'}{' '}
            The phrase deck below still speaks Spanish offline.
          </ConfidenceNote>
        )}
        {phase === 'mic-denied' && (
          <ConfidenceNote title="Microphone blocked">
            Talk needs the mic. Allow microphone access for this site in your browser settings,
            then try again.
          </ConfidenceNote>
        )}
        {phase === 'mic-unavailable' && (
          <ConfidenceNote title="No microphone found">
            No usable microphone was detected on this device.
          </ConfidenceNote>
        )}
        {phase === 'asr-error' && (
          <ConfidenceNote title="Speech service interrupted">
            The speech service couldn&rsquo;t be reached — try the button again in a moment.
          </ConfidenceNote>
        )}
        {!spanishVoice && (
          <ConfidenceNote title="No Spanish voice on this device">
            Spanish will appear as text only — the stranger can read it, but tap-to-play audio
            is unavailable.
          </ConfidenceNote>
        )}
      </section>

      {showQuickReplies && (
        <section aria-label="Quick replies" className="flex gap-2 overflow-x-auto">
          {QUICK_REPLIES.map((phrase) => (
            <ActionChip
              key={phrase.id}
              lang="es"
              className="flex-none"
              onClick={() => session.sayPhrase(phrase)}
            >
              {phrase.es}
            </ActionChip>
          ))}
        </section>
      )}

      {showIntro ? (
        <IntroCard onDone={() => setIntroDone(true)} />
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={speakButton.onClick}
            disabled={speakButton.disabled}
            aria-pressed={speakButton.recording}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full rounded-[20px] py-[19px] text-center leading-none font-extrabold tracking-[-0.02em] text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-40 ${
              turn === 'them' ? 'text-[20px]' : 'text-[18px]'
            } ${speakButton.recording ? 'scale-[0.99] animate-pulse bg-online' : 'bg-accent'}`}
          >
            {speakButton.label}
          </button>
          {turn === 'me' ? (
            <button
              type="button"
              onClick={() => session.switchTurn('them')}
              className="w-full rounded-[20px] bg-raised py-[15px] text-center text-[15px] leading-none font-bold text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Hand over · <span lang="es">Su turno</span> →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => session.switchTurn('me')}
              className="w-full rounded-[20px] bg-raised py-[15px] text-center text-[15px] leading-none font-bold text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ‹ My turn
            </button>
          )}
        </div>
      )}

      {pack && turn === 'me' && (
        <section aria-label={`${pack.title.en} phrases`} className="flex flex-col gap-2">
          <p className="text-[11px] font-bold tracking-[0.08em] text-ink-3 uppercase">
            {pack.title.en} deck · tap to say it
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pack.phrases.map((phrase) => (
              <button
                key={phrase.id}
                type="button"
                onClick={() => session.sayPhrase(phrase)}
                className="max-w-[240px] flex-none rounded-card border border-line bg-card px-[13px] py-[11px] text-left transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span lang="es" className="block text-[14px] leading-[1.3] font-bold text-ink">
                  {phrase.es}
                </span>
                <span className="mt-0.5 block text-[12px] leading-[1.3] font-medium text-ink-3">
                  {phrase.en}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
