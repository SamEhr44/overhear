import { z } from 'zod';

/**
 * WebSocket protocol between apps/web and services/api.
 *
 * Transport rules:
 * - JSON text frames carry control + results (schemas below).
 * - Binary frames carry raw audio chunks (16 kHz mono PCM16 unless the
 *   session negotiates otherwise). Binary frames are only valid after
 *   `session.start` has been acknowledged with `session.ready`.
 */

export const LangSchema = z.enum(['es', 'en']);
export type Lang = z.infer<typeof LangSchema>;

export const ListenSubModeSchema = z.enum(['announcements', 'around-me', 'one-person']);
export type ListenSubMode = z.infer<typeof ListenSubModeSchema>;

export const AudioFormatSchema = z.object({
  encoding: z.literal('pcm16'),
  sampleRate: z.number().int().positive(),
  channels: z.literal(1),
});
export type AudioFormat = z.infer<typeof AudioFormatSchema>;

// ---------------------------------------------------------------------------
// Client → server
// ---------------------------------------------------------------------------

export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('session.start'),
    mode: z.enum(['listen', 'talk']),
    sourceLang: LangSchema,
    targetLang: LangSchema,
    subMode: ListenSubModeSchema.optional(),
    audio: AudioFormatSchema.optional(),
  }),
  z.object({ type: z.literal('session.stop') }),
  z.object({
    type: z.literal('text.translate'),
    id: z.string().min(1),
    text: z.string().min(1).max(2000),
    sourceLang: LangSchema,
    targetLang: LangSchema,
  }),
  z.object({ type: z.literal('ping'), t: z.number() }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ---------------------------------------------------------------------------
// Server → client
// ---------------------------------------------------------------------------

export const CaptionWordSchema = z.object({
  word: z.string(),
  confidence: z.number().min(0).max(1),
});
export type CaptionWord = z.infer<typeof CaptionWordSchema>;

export const CaptionSchema = z.object({
  /** Stable id across partial → final updates of the same utterance. */
  id: z.string(),
  sourceText: z.string(),
  /** Empty string while the first partial translation is still in flight. */
  targetText: z.string(),
  sourceLang: LangSchema,
  targetLang: LangSchema,
  /** 0..1 overall ASR confidence for the utterance. */
  confidence: z.number().min(0).max(1),
  /** Word-level confidences (finals only) — powers the low-confidence UI. */
  words: z.array(CaptionWordSchema).optional(),
  isFinal: z.boolean(),
  /** Server epoch ms when the utterance started. */
  startedAt: z.number(),
  finalizedAt: z.number().optional(),
});
export type Caption = z.infer<typeof CaptionSchema>;

export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('session.ready'),
    sessionId: z.string(),
    providers: z.object({ asr: z.string(), mt: z.string() }),
  }),
  z.object({ type: z.literal('session.stopped'), sessionId: z.string() }),
  z.object({ type: z.literal('caption.partial'), caption: CaptionSchema }),
  z.object({ type: z.literal('caption.final'), caption: CaptionSchema }),
  z.object({
    type: z.literal('translation.result'),
    id: z.string(),
    sourceText: z.string(),
    targetText: z.string(),
    provider: z.string(),
  }),
  z.object({ type: z.literal('pong'), t: z.number(), serverTime: z.number() }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function encodeClientMessage(msg: ClientMessage): string {
  return JSON.stringify(msg);
}

export function decodeClientMessage(raw: string): ClientMessage {
  return ClientMessageSchema.parse(JSON.parse(raw));
}

export function encodeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}

export function decodeServerMessage(raw: string): ServerMessage {
  return ServerMessageSchema.parse(JSON.parse(raw));
}
