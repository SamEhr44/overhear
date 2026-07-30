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
