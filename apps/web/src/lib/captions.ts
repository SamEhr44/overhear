import type { Caption, CaptionWord, ServerMessage } from '@overhear/shared';

export interface CaptionState {
  finals: Caption[];
  partial: Caption | null;
}

export const EMPTY_CAPTIONS: CaptionState = { finals: [], partial: null };

const MAX_FINALS = 50;

/** Pure reducer for the caption stream — unit-tested, UI-independent. */
export function reduceCaptions(state: CaptionState, msg: ServerMessage): CaptionState {
  switch (msg.type) {
    case 'caption.partial': {
      return { ...state, partial: msg.caption };
    }
    case 'caption.final': {
      const finals = [...state.finals, msg.caption].slice(-MAX_FINALS);
      const partial = state.partial?.id === msg.caption.id ? null : state.partial;
      return { finals, partial };
    }
    default:
      return state;
  }
}

/** Confidence gate for the "not fully sure" disclosure. */
export const LOW_CONFIDENCE_THRESHOLD = 0.72;
export const LOW_WORD_THRESHOLD = 0.5;

export interface LowConfidenceInfo {
  /** The shakiest span of the source, for quoting ("puerta veintidós"). */
  quote: string;
}

export function lowConfidenceInfo(caption: Caption): LowConfidenceInfo | null {
  const words = caption.words ?? [];
  const minWord = words.length ? Math.min(...words.map((w) => w.confidence)) : 1;
  if (caption.confidence >= LOW_CONFIDENCE_THRESHOLD && minWord >= LOW_WORD_THRESHOLD) {
    return null;
  }
  return { quote: shakiestSpan(words) || caption.sourceText };
}

function shakiestSpan(words: CaptionWord[]): string {
  if (!words.length) return '';
  let minIdx = 0;
  for (let i = 1; i < words.length; i++) {
    const current = words[i];
    const best = words[minIdx];
    if (current && best && current.confidence < best.confidence) minIdx = i;
  }
  const from = Math.max(0, minIdx - 1);
  const to = Math.min(words.length, minIdx + 2);
  return words
    .slice(from, to)
    .map((w) => w.word)
    .join(' ');
}
