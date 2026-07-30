import type { Lang } from '../protocol.js';

export interface Phrase {
  id: string;
  /** Warm-polite usted Spanish — stranger-facing register. */
  es: string;
  en: string;
  category: string;
}

export interface PhrasePack {
  id: string;
  title: Record<Lang, string>;
  /** Short descriptor for the pack chooser card. */
  tagline: Record<Lang, string>;
  phrases: Phrase[];
}
