'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EqBars } from '@/components/ui/EqBars';
import { useTrip, type TripData } from '@/lib/trip';

const EMPTY: TripData = {
  city: '',
  lodgingName: '',
  lodgingAddress: '',
  flightCode: '',
  flightTime: '',
  initials: '',
  arrivedOn: '',
};

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-bold tracking-[0.06em] text-ink-3 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const INPUT_CLASS =
  'w-full rounded-chip border border-line bg-card px-[13px] py-3 text-[16px] font-semibold text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-accent';

export default function OnboardingPage() {
  const { trip, ready } = useTrip();
  // Mount the flow only after IndexedDB hydration so editing an existing
  // trip starts on the form step with values preloaded (state initializers
  // instead of effect-driven setState).
  if (!ready) return null;
  return <OnboardingFlow initialTrip={trip} />;
}

function OnboardingFlow({ initialTrip }: { initialTrip: TripData | null }) {
  const router = useRouter();
  const { saveTrip, dismissOnboarding } = useTrip();
  const [step, setStep] = useState(initialTrip ? 1 : 0);
  const [draft, setDraft] = useState<TripData>(
    initialTrip ?? { ...EMPTY, arrivedOn: todayIso() },
  );

  const set = (patch: Partial<TripData>) => setDraft((d) => ({ ...d, ...patch }));

  const finish = (save: boolean) => {
    if (save) saveTrip(draft);
    dismissOnboarding();
    router.replace('/');
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-[18px] pt-6 pb-[18px]">
      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="grid size-[84px] place-items-center rounded-[24px] bg-accent shadow-hero">
              <EqBars height={30} width={5} />
            </div>
            <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
              Overhear
            </h1>
            <p className="max-w-[300px] text-[16px] leading-[1.5] font-medium text-ink-2">
              Your travel communication cockpit for Mexico —{' '}
              <strong className="text-ink">Listen</strong> captions the Spanish around you,{' '}
              <strong className="text-ink">Talk</strong> holds two-way conversations, and{' '}
              <strong className="text-ink">Ride</strong> handles drivers.
            </p>
            <p className="max-w-[300px] text-[13px] leading-[1.5] font-medium text-ink-3">
              Live captions need a connection. Phrase decks, SOS and your trip card work
              offline. Everything you type stays on this phone.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-[20px] bg-accent py-[18px] text-[17px] leading-none font-extrabold tracking-[-0.02em] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.99]"
            >
              Set up my trip
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full rounded-[20px] py-[15px] text-[15px] leading-none font-bold text-ink-3 hover:text-ink-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col gap-4">
          <header className="flex flex-col gap-px">
            <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
              Your trip
            </h1>
            <p className="text-[14px] leading-tight font-semibold text-ink-3">
              30 seconds — everything stays on this phone
            </p>
          </header>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            <Field label="City">
              <input
                className={INPUT_CLASS}
                type="text"
                value={draft.city}
                placeholder="Puerto Vallarta"
                onChange={(e) => set({ city: e.target.value })}
              />
            </Field>
            <Field label="Where you're staying">
              <input
                className={INPUT_CLASS}
                type="text"
                value={draft.lodgingName}
                placeholder="Casa Kimberly"
                onChange={(e) => set({ lodgingName: e.target.value })}
              />
            </Field>
            <Field label="Address (for the driver card)">
              <input
                className={INPUT_CLASS}
                type="text"
                value={draft.lodgingAddress}
                placeholder="Calle Zaragoza 445, Centro"
                onChange={(e) => set({ lodgingAddress: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Flight (optional)">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  value={draft.flightCode}
                  placeholder="AM 674"
                  onChange={(e) => set({ flightCode: e.target.value })}
                />
              </Field>
              <Field label="Departs">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  value={draft.flightTime}
                  placeholder="18:20"
                  onChange={(e) => set({ flightTime: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Arrived on">
                <input
                  className={INPUT_CLASS}
                  type="date"
                  value={draft.arrivedOn}
                  onChange={(e) => set({ arrivedOn: e.target.value })}
                />
              </Field>
              <Field label="Your initials">
                <input
                  className={INPUT_CLASS}
                  type="text"
                  maxLength={2}
                  value={draft.initials}
                  placeholder="JR"
                  onChange={(e) => set({ initials: e.target.value.toUpperCase() })}
                />
              </Field>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-[20px] bg-accent py-[18px] text-[17px] leading-none font-extrabold tracking-[-0.02em] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.99]"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full rounded-[20px] py-[15px] text-[15px] leading-none font-bold text-ink-3 hover:text-ink-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center gap-3">
            <h1 className="text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
              Two things to know
            </h1>
            <div className="rounded-card border border-line bg-card px-[15px] py-[13px]">
              <p className="mb-1.5 text-[12px] leading-none font-extrabold text-accent uppercase">
                Microphone
              </p>
              <p className="text-[14px] leading-[1.5] font-medium text-ink-2">
                Listen and Talk caption real speech, so your phone will ask for the mic once.
                Audio is streamed for live captions and never stored.
              </p>
            </div>
            <div className="rounded-card border border-line bg-card px-[15px] py-[13px]">
              <p className="mb-1.5 text-[12px] leading-none font-extrabold text-sos uppercase">
                SOS — even offline
              </p>
              <p className="text-[14px] leading-[1.5] font-medium text-ink-2">
                The red edge tab opens emergency Spanish that speaks out loud, plus 911 —
                it works with no connection at all.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            className="w-full rounded-[20px] bg-accent py-[18px] text-[17px] leading-none font-extrabold tracking-[-0.02em] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.99]"
          >
            Open Overhear
          </button>
        </div>
      )}
    </main>
  );
}
