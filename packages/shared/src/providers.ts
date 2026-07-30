import type { Lang } from './protocol.js';

/**
 * Provider interfaces for the translation pipeline.
 *
 * Everything vendor-specific (Deepgram, DeepL, Google, self-hosted
 * Whisper/NLLB, …) lives behind these interfaces so callers never touch a
 * vendor SDK directly and providers can be swapped via env config.
 */

export interface AsrWord {
  word: string;
  confidence: number;
}

export interface AsrResult {
  text: string;
  /** 0..1 utterance confidence. */
  confidence: number;
  isFinal: boolean;
  words?: AsrWord[];
}

export interface AsrStream {
  sendAudio(chunk: Uint8Array): void;
  end(): Promise<void>;
  onResult(cb: (result: AsrResult) => void): void;
  onError(cb: (err: Error) => void): void;
}

export interface AsrStreamOptions {
  lang: Lang;
  sampleRate: number;
  /** Silence gap (ms) before an utterance finalizes; PA announcements pause longer than conversation. */
  endpointingMs?: number;
}

export interface AsrProvider {
  readonly name: string;
  startStream(opts: AsrStreamOptions): Promise<AsrStream>;
}

export interface TranslateOptions {
  /** Politeness register; maps to DeepL formality. Stranger-facing Spanish uses 'more' (usted). */
  formality?: 'default' | 'more' | 'less';
}

export interface TranslationResult {
  text: string;
  detectedSourceLang?: Lang;
}

export interface MtProvider {
  readonly name: string;
  translate(text: string, from: Lang, to: Lang, opts?: TranslateOptions): Promise<TranslationResult>;
}

export interface TtsProvider {
  readonly name: string;
  /** Returns encoded audio (mp3/ogg) for server-side TTS fallback. */
  synthesize(text: string, lang: Lang): Promise<Uint8Array>;
}
