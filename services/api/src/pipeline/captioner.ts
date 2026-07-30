import type { AsrResult, Caption, Lang, MtProvider } from '@overhear/shared';

/**
 * Turns a stream of ASR results into caption.partial / caption.final events
 * with translations attached.
 *
 * Latency strategy (budget: partial < ~400 ms, final < ~1.2 s):
 * - Partials are emitted IMMEDIATELY with the best-known translation (may be
 *   empty or trailing the source text); MT for partials is throttled to one
 *   in-flight request per PARTIAL_MT_MIN_INTERVAL_MS so we don't burn quota
 *   translating every keystroke-level update.
 * - Finals always get a fresh translation before emitting; on MT failure we
 *   fall back to the last partial translation rather than dropping the line.
 */

export interface CaptionerEvents {
  onPartial: (caption: Caption) => void;
  onFinal: (caption: Caption) => void;
}

const PARTIAL_MT_MIN_INTERVAL_MS = 350;

export class Captioner {
  private seq = 0;
  private currentId: string | null = null;
  private startedAt = 0;
  private lastPartialMtAt = Number.NEGATIVE_INFINITY;
  private partialMtInFlight = false;
  private lastTranslatedSource = '';
  private lastTargetText = '';
  private lastConfidence = 0;

  constructor(
    private readonly mt: MtProvider,
    private readonly sourceLang: Lang,
    private readonly targetLang: Lang,
    private readonly events: CaptionerEvents,
    private readonly now: () => number = Date.now,
  ) {}

  async handleAsrResult(result: AsrResult): Promise<void> {
    const text = result.text.trim();
    if (!text) return;

    if (this.currentId === null) {
      this.currentId = `utt-${++this.seq}`;
      this.startedAt = this.now();
      this.lastTargetText = '';
      this.lastTranslatedSource = '';
    }
    const id = this.currentId;

    this.lastConfidence = clamp01(result.confidence);
    const base = {
      id,
      sourceText: text,
      sourceLang: this.sourceLang,
      targetLang: this.targetLang,
      confidence: this.lastConfidence,
      startedAt: this.startedAt,
    };

    if (result.isFinal) {
      this.currentId = null;
      let targetText = this.lastTargetText;
      try {
        targetText = (await this.mt.translate(text, this.sourceLang, this.targetLang)).text;
      } catch {
        // Keep the last partial translation — a slightly stale line beats none.
      }
      this.events.onFinal({
        ...base,
        targetText,
        words: result.words,
        isFinal: true,
        finalizedAt: this.now(),
      });
      return;
    }

    this.events.onPartial({ ...base, targetText: this.lastTargetText, isFinal: false });
    this.maybeTranslatePartial(id, text);
  }

  private maybeTranslatePartial(id: string, text: string) {
    if (this.partialMtInFlight) return;
    if (text === this.lastTranslatedSource) return;
    if (this.now() - this.lastPartialMtAt < PARTIAL_MT_MIN_INTERVAL_MS) return;

    this.partialMtInFlight = true;
    this.lastPartialMtAt = this.now();
    this.lastTranslatedSource = text;

    this.mt
      .translate(text, this.sourceLang, this.targetLang)
      .then((res) => {
        this.lastTargetText = res.text;
        // Only re-emit if this utterance is still the live one.
        if (this.currentId === id) {
          this.events.onPartial({
            id,
            sourceText: text,
            targetText: res.text,
            sourceLang: this.sourceLang,
            targetLang: this.targetLang,
            confidence: this.lastConfidence,
            startedAt: this.startedAt,
            isFinal: false,
          });
        }
      })
      .catch(() => {
        // Partial MT failures are silent; the final will retry.
      })
      .finally(() => {
        this.partialMtInFlight = false;
      });
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
