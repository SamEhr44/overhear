'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ESSENTIALS_PACK, type Phrase } from '@overhear/shared';
import { useAnalyticsOptOut } from '@/components/Telemetry';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { useDestination } from '@/lib/destination';
import { speak } from '@/lib/tts';

const CATEGORY_LABELS: Record<string, string> = {
  emergency: 'Emergency',
  medical: 'Medical',
  police: 'Police',
  help: 'Help',
};

const CATEGORY_ORDER = ['emergency', 'medical', 'police', 'help'];

function groupPhrases(): Array<{ category: string; phrases: Phrase[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    phrases: ESSENTIALS_PACK.phrases.filter((p) => p.category === category),
  })).filter((g) => g.phrases.length > 0);
}

export default function EssentialsPage() {
  const { destination } = useDestination();
  const { optedOut, setOptOut } = useAnalyticsOptOut();
  const [speaking, setSpeaking] = useState<string | null>(null);

  const sayPhrase = (phrase: Phrase) => {
    setSpeaking(phrase.id);
    void speak(phrase.es, 'es').finally(() => setSpeaking(null));
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-[18px] pt-3 pb-[18px]">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-chip py-2 pr-3 text-[14px] font-bold text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ‹ Home
        </Link>
      </div>

      <header className="flex flex-col gap-px">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          Essentials
        </h1>
        <p className="text-[14px] leading-tight font-semibold text-ink-3">
          SOS &amp; key phrases · works offline
        </p>
      </header>

      <section className="flex flex-1 flex-col gap-4 overflow-y-auto">
        <Card className="border-sos/30 px-[15px] py-[13px]">
          <p className="mb-1.5 text-[12px] leading-none font-extrabold text-sos uppercase">
            In a real emergency
          </p>
          <p className="text-[15px] leading-[1.45] font-medium text-ink-2">
            Call{' '}
            <a href="tel:911" className="font-extrabold text-sos underline">
              911
            </a>{' '}
            — Mexico&rsquo;s national emergency number. It works from any phone.
          </p>
        </Card>

        {destination && (
          <Card className="px-[15px] py-[13px]">
            <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
              Where I&rsquo;m staying · Dónde me hospedo
            </p>
            <p lang="es" className="text-[20px] leading-[1.25] font-extrabold text-ink">
              {destination.name}
            </p>
            {destination.address && (
              <p lang="es" className="mt-0.5 text-[15px] leading-[1.35] font-semibold text-ink-2">
                {destination.address}
              </p>
            )}
          </Card>
        )}

        {groupPhrases().map((group) => (
          <section key={group.category} aria-label={CATEGORY_LABELS[group.category]}>
            <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-ink-3 uppercase">
              {CATEGORY_LABELS[group.category]}
            </p>
            <div className="flex flex-col gap-2">
              {group.phrases.map((phrase) => (
                <button
                  key={phrase.id}
                  type="button"
                  onClick={() => sayPhrase(phrase)}
                  className={`rounded-card border px-[15px] py-[13px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    speaking === phrase.id
                      ? 'border-online bg-online-tint'
                      : 'border-line bg-card hover:bg-raised'
                  } ${group.category === 'emergency' ? 'border-sos/40' : ''}`}
                >
                  <span lang="es" className="block text-[20px] leading-[1.3] font-extrabold text-ink">
                    {phrase.es}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-[1.3] font-medium text-ink-3">
                    {phrase.en} · tap to say it
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <Card className="flex items-center justify-between px-[15px] py-[13px]">
          <div className="min-w-0 pr-3">
            <p className="text-[14px] leading-tight font-bold text-ink">Anonymous usage counts</p>
            <p className="mt-0.5 text-[12px] leading-[1.4] font-medium text-ink-3">
              Cookieless page analytics — no identity, no audio, no captions. Ever.
            </p>
          </div>
          <Toggle
            checked={!optedOut}
            onChange={(on) => setOptOut(!on)}
            label="Allow anonymous usage analytics"
          />
        </Card>

        <p className="text-[12px] leading-[1.45] font-medium text-ink-3">
          Phrases and audio work without a connection.
        </p>
      </section>
    </main>
  );
}
