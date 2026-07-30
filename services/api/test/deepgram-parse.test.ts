import { describe, expect, it } from 'vitest';
import { parseDeepgramMessage } from '../src/providers/deepgram.js';

const RESULTS_FIXTURE = JSON.stringify({
  type: 'Results',
  channel_index: [0, 1],
  duration: 1.02,
  start: 0,
  is_final: true,
  speech_final: true,
  channel: {
    alternatives: [
      {
        transcript: 'la puerta veintidós',
        confidence: 0.87,
        words: [
          { word: 'la', start: 0.1, end: 0.2, confidence: 0.99, punctuated_word: 'la' },
          { word: 'puerta', start: 0.2, end: 0.5, confidence: 0.9, punctuated_word: 'puerta' },
          { word: 'veintidós', start: 0.5, end: 1.0, confidence: 0.61, punctuated_word: 'veintidós' },
        ],
      },
    ],
  },
});

describe('parseDeepgramMessage', () => {
  it('maps a Results frame to an AsrResult', () => {
    const result = parseDeepgramMessage(RESULTS_FIXTURE);
    expect(result).toEqual({
      text: 'la puerta veintidós',
      confidence: 0.87,
      isFinal: true,
      words: [
        { word: 'la', confidence: 0.99 },
        { word: 'puerta', confidence: 0.9 },
        { word: 'veintidós', confidence: 0.61 },
      ],
    });
  });

  it('ignores non-Results frames and junk', () => {
    expect(parseDeepgramMessage(JSON.stringify({ type: 'Metadata' }))).toBeNull();
    expect(parseDeepgramMessage('not json')).toBeNull();
  });

  it('treats interim frames as non-final', () => {
    const interim = JSON.parse(RESULTS_FIXTURE);
    interim.is_final = false;
    const result = parseDeepgramMessage(JSON.stringify(interim));
    expect(result?.isFinal).toBe(false);
  });
});
