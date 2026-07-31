import type { Lang } from '@overhear/shared';

/**
 * Web Speech Synthesis wrapper — tap-to-play Spanish (and whisper English).
 * Works offline once the device has voices; honest `hasVoiceFor` lets the UI
 * warn when a device ships no Spanish voice at all.
 */

const PREFERENCES: Record<Lang, string[]> = {
  es: ['es-mx', 'es-us', 'es-419', 'es'],
  en: ['en-us', 'en'],
};

/** Pure voice picker — exported for tests. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  const prefs = PREFERENCES[lang];
  for (const pref of prefs) {
    const exact = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(pref));
    if (exact) return exact;
  }
  return null;
}

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof speechSynthesis === 'undefined') return Promise.resolve([]);
  const now = speechSynthesis.getVoices();
  if (now.length > 0) {
    cachedVoices = now;
    return Promise.resolve(now);
  }
  return new Promise((resolve) => {
    const onChange = () => {
      cachedVoices = speechSynthesis.getVoices();
      speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(cachedVoices);
    };
    speechSynthesis.addEventListener('voiceschanged', onChange);
    // Some browsers never fire voiceschanged; don't hang forever.
    setTimeout(() => {
      speechSynthesis.removeEventListener('voiceschanged', onChange);
      cachedVoices = speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 1_500);
  });
}

export async function hasVoiceFor(lang: Lang): Promise<boolean> {
  const voices = cachedVoices ?? (await loadVoices());
  return pickVoice(voices, lang) !== null;
}

/** Speak text aloud; resolves when playback ends (or fails silently). */
export async function speak(text: string, lang: Lang, rate = 1): Promise<void> {
  if (typeof speechSynthesis === 'undefined' || !text) return;
  const voices = cachedVoices ?? (await loadVoices());
  const voice = pickVoice(voices, lang);
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang ?? (lang === 'es' ? 'es-MX' : 'en-US');
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

export function cancelSpeech() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

/**
 * Speak SYNCHRONOUSLY within a user-gesture tick (no awaits before the
 * `speak` call) — mobile browsers unlock speech synthesis for later
 * event-driven playback only when the first utterance starts in a gesture.
 */
export function unlockSpeech(confirmationText: string, lang: Lang = 'en') {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(confirmationText);
  utterance.lang = lang === 'es' ? 'es-MX' : 'en-US';
  const voice = cachedVoices ? pickVoice(cachedVoices, lang) : null;
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

type SpeakFn = (text: string, lang: Lang, rate?: number) => Promise<void>;

interface QueuedUtterance {
  text: string;
  lang: Lang;
  rate: number;
}

/**
 * Managed playback queue for interpreter-style output: speaks in order, but
 * when captions outpace speech it drops the stalest backlog so the voice
 * stays near-live. Exposes activity so the mic can duck while speaking.
 */
export class SpeechQueue {
  private pending: QueuedUtterance[] = [];
  private active = false;
  private readonly listeners = new Set<(speaking: boolean) => void>();

  constructor(
    private readonly speakFn: SpeakFn = speak,
    private readonly maxPending = 2,
  ) {}

  enqueue(text: string, lang: Lang, rate = 1.05) {
    if (!text) return;
    this.pending.push({ text, lang, rate });
    if (this.pending.length > this.maxPending) {
      // Keep the newest utterances — currency beats completeness here.
      this.pending.splice(0, this.pending.length - this.maxPending);
    }
    void this.pump();
  }

  clear() {
    this.pending = [];
    cancelSpeech();
  }

  get speaking(): boolean {
    return this.active;
  }

  onActivity(cb: (speaking: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(speaking: boolean) {
    for (const cb of this.listeners) cb(speaking);
  }

  private async pump() {
    if (this.active) return;
    this.active = true;
    this.notify(true);
    try {
      let next = this.pending.shift();
      while (next) {
        await this.speakFn(next.text, next.lang, next.rate);
        next = this.pending.shift();
      }
    } finally {
      this.active = false;
      this.notify(false);
    }
  }
}

/** Shared queue for Listen's spoken translations. */
export const listenSpeech = new SpeechQueue();
