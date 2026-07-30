'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { RIDE_PACK } from '@overhear/shared';
import { DestinationSheet } from '@/components/ride/DestinationSheet';
import { Card } from '@/components/ui/Card';
import { ConnectionChip } from '@/components/ui/ConnectionChip';
import { ModeTabs } from '@/components/ui/ModeTabs';
import { useDestination } from '@/lib/destination';
import { recognizeImage } from '@/lib/ocr';
import { speak } from '@/lib/tts';
import { useApiConnection, type TranslationOutcome } from '@/lib/useApiConnection';

type OcrState = { status: 'idle' } | { status: 'working'; pct: number } | { status: 'failed' };

export default function RidePage() {
  const connection = useApiConnection();
  const { destination, setDestination } = useDestination();
  const [editOpen, setEditOpen] = useState(false);
  const [inbound, setInbound] = useState('');
  const [result, setResult] = useState<{ es: string; outcome: TranslationOutcome } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [ocr, setOcr] = useState<OcrState>({ status: 'idle' });
  const fileRef = useRef<HTMLInputElement>(null);

  const connected = connection.status === 'connected';
  const driverLine = 'Lléveme a esta dirección, por favor:';

  const speakDestination = () => {
    if (!destination) return;
    void speak(
      `${driverLine} ${destination.name}${destination.address ? `, ${destination.address}` : ''}`,
      'es',
    );
  };

  const translateInbound = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || translating) return;
    setTranslating(true);
    try {
      const outcome = await connection.translate(trimmed, 'es', 'en');
      setResult({ es: trimmed, outcome });
    } catch {
      setResult(null);
    } finally {
      setTranslating(false);
    }
  };

  const onScreenshot = async (file: File | undefined) => {
    if (!file) return;
    setOcr({ status: 'working', pct: 0 });
    try {
      const text = await recognizeImage(file, (pct) => setOcr({ status: 'working', pct }));
      setOcr({ status: 'idle' });
      if (text) {
        setInbound(text);
        if (connected) await translateInbound(text);
      } else {
        setOcr({ status: 'failed' });
      }
    } catch {
      setOcr({ status: 'failed' });
    }
  };

  return (
    <main className="relative flex flex-1 flex-col gap-4 px-[18px] pt-3 pb-[18px]">
      <div className="flex items-center justify-between">
        <header className="flex flex-col gap-px">
          <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
            Ride
          </h1>
          <p className="text-[14px] leading-tight font-semibold text-ink-3">Driver comms</p>
        </header>
        <ConnectionChip status={connection.status} rttMs={connection.rttMs} />
      </div>

      <section className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {/* Destination card — the thing you show the driver. */}
        {destination ? (
          <Card className="px-[15px] py-4">
            <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
              Para el conductor
            </p>
            <p lang="es" className="text-[16px] leading-[1.35] font-bold text-ink-2">
              {driverLine}
            </p>
            <p
              lang="es"
              className="mt-1 text-[26px] leading-[1.15] font-extrabold tracking-[-0.02em] text-ink"
            >
              {destination.name}
            </p>
            {destination.address && (
              <p lang="es" className="mt-1 text-[18px] leading-[1.35] font-semibold text-ink-2">
                {destination.address}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={speakDestination}
                className="flex-1 rounded-chip bg-accent px-[13px] py-3 text-[15px] leading-none font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]"
              >
                ▸ Decirlo
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-chip border border-line bg-card px-[13px] py-3 text-[14px] leading-none font-bold text-ink-2 hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent"
              >
                Edit
              </button>
            </div>
          </Card>
        ) : (
          <Card className="px-[15px] py-4">
            <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
              Destination card
            </p>
            <p className="text-[15px] leading-[1.45] font-medium text-ink-2">
              Set where you&rsquo;re staying once — it becomes a big Spanish card you can show
              any driver, with tap-to-play audio. Stored on this phone only.
            </p>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-3 w-full rounded-chip bg-accent px-[13px] py-3 text-[15px] leading-none font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Set destination
            </button>
          </Card>
        )}

        {/* Inbound: paste or screenshot the driver's message. */}
        <Card className="px-[15px] py-[13px]">
          <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
            Message from your driver
          </p>
          <p className="mb-2 text-[13px] leading-[1.45] font-medium text-ink-3">
            The web app can&rsquo;t read WhatsApp or SMS directly — paste the message or upload
            a screenshot.
          </p>
          <textarea
            value={inbound}
            onChange={(e) => setInbound(e.target.value)}
            placeholder="Pega el mensaje aquí…"
            rows={2}
            className="w-full rounded-chip border border-line bg-card px-[13px] py-3 text-[15px] font-medium text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-accent"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={!connected || !inbound.trim() || translating}
              onClick={() => void translateInbound(inbound)}
              className="flex-1 rounded-chip bg-accent px-[13px] py-3 text-[15px] leading-none font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-40"
            >
              {translating ? 'Translating…' : 'Translate'}
            </button>
            <button
              type="button"
              disabled={ocr.status === 'working'}
              onClick={() => fileRef.current?.click()}
              className="rounded-chip border border-line bg-card px-[13px] py-3 text-[14px] leading-none font-bold text-ink-2 hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
            >
              {ocr.status === 'working' ? `Reading… ${ocr.pct}%` : 'Screenshot'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onScreenshot(e.target.files?.[0])}
            />
          </div>
          {ocr.status === 'failed' && (
            <p className="mt-2 text-[13px] font-semibold text-warn">
              Couldn&rsquo;t read text from that image — try a tighter crop of the message.
            </p>
          )}
          {result && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[19px] leading-[1.3] font-extrabold tracking-[-0.01em] text-ink">
                {result.outcome.targetText}
              </p>
              <p lang="es" className="mt-1 text-[13px] leading-[1.4] font-medium text-ink-3">
                {result.es}
              </p>
            </div>
          )}
          {!connected && (
            <p className="mt-2 text-[13px] font-semibold text-ink-3">
              Translation needs a connection — the chip above shows the link state.
            </p>
          )}
        </Card>

        {/* Call flow: speaker + Listen. */}
        <Card className="px-[15px] py-[13px]">
          <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
            Driver calling you?
          </p>
          <p className="text-[14px] leading-[1.45] font-medium text-ink-2">
            Put the call on speaker and open Listen — it captions the call audio like any other
            voice nearby.
          </p>
          <Link
            href="/listen?focus=one-person"
            className="mt-3 block rounded-chip border border-line bg-card px-[13px] py-3 text-center text-[15px] leading-none font-extrabold text-ink hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent"
          >
            Speaker + Listen ›
          </Link>
        </Card>

        {/* Driver deck. */}
        <section aria-label="Driver phrases" className="flex flex-col gap-2">
          <p className="text-[11px] font-bold tracking-[0.08em] text-ink-3 uppercase">
            Driver deck · tap to say it
          </p>
          <div className="grid grid-cols-1 gap-2">
            {RIDE_PACK.phrases.map((phrase) => (
              <button
                key={phrase.id}
                type="button"
                onClick={() => void speak(phrase.es, 'es')}
                className="rounded-card border border-line bg-card px-[13px] py-[11px] text-left transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span lang="es" className="block text-[15px] leading-[1.3] font-bold text-ink">
                  {phrase.es}
                </span>
                <span className="mt-0.5 block text-[12px] leading-[1.3] font-medium text-ink-3">
                  {phrase.en}
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <ModeTabs active="ride" />

      {editOpen && (
        <DestinationSheet
          initial={destination}
          onSave={setDestination}
          onClose={() => setEditOpen(false)}
        />
      )}
    </main>
  );
}
