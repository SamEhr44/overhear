import { describe, expect, it } from 'vitest';
import type { Caption, ServerMessage } from '@overhear/shared';
import { EMPTY_CAPTIONS, lowConfidenceInfo, reduceCaptions } from './captions';

function caption(overrides: Partial<Caption>): Caption {
  return {
    id: 'utt-1',
    sourceText: 'hola',
    targetText: 'hello',
    sourceLang: 'es',
    targetLang: 'en',
    confidence: 0.9,
    isFinal: false,
    startedAt: 1000,
    ...overrides,
  };
}

describe('reduceCaptions', () => {
  it('replaces the partial and promotes finals', () => {
    let state = EMPTY_CAPTIONS;
    state = reduceCaptions(state, {
      type: 'caption.partial',
      caption: caption({ sourceText: 'ho' }),
    });
    state = reduceCaptions(state, {
      type: 'caption.partial',
      caption: caption({ sourceText: 'hola' }),
    });
    expect(state.partial?.sourceText).toBe('hola');
    expect(state.finals).toHaveLength(0);

    state = reduceCaptions(state, {
      type: 'caption.final',
      caption: caption({ isFinal: true, finalizedAt: 2000 }),
    });
    expect(state.finals).toHaveLength(1);
    expect(state.partial).toBeNull();
  });

  it('keeps a partial from a newer utterance when an older final lands', () => {
    let state = EMPTY_CAPTIONS;
    state = reduceCaptions(state, {
      type: 'caption.partial',
      caption: caption({ id: 'utt-2', sourceText: 'siguiente' }),
    });
    state = reduceCaptions(state, {
      type: 'caption.final',
      caption: caption({ id: 'utt-1', isFinal: true }),
    });
    expect(state.partial?.id).toBe('utt-2');
  });

  it('ignores unrelated messages', () => {
    const msg: ServerMessage = { type: 'pong', t: 1, serverTime: 2 };
    expect(reduceCaptions(EMPTY_CAPTIONS, msg)).toBe(EMPTY_CAPTIONS);
  });
});

describe('lowConfidenceInfo', () => {
  it('is null for confident captions', () => {
    expect(
      lowConfidenceInfo(
        caption({
          confidence: 0.95,
          words: [
            { word: 'la', confidence: 0.99 },
            { word: 'puerta', confidence: 0.9 },
          ],
        }),
      ),
    ).toBeNull();
  });

  it('quotes the shakiest span when a word is weak', () => {
    const info = lowConfidenceInfo(
      caption({
        confidence: 0.9,
        words: [
          { word: 'la', confidence: 0.99 },
          { word: 'puerta', confidence: 0.9 },
          { word: 'veintidós.', confidence: 0.4 },
        ],
      }),
    );
    expect(info?.quote).toBe('puerta veintidós.');
  });

  it('falls back to the full source when overall confidence is low', () => {
    const info = lowConfidenceInfo(caption({ confidence: 0.5, sourceText: 'algo raro' }));
    expect(info?.quote).toBe('algo raro');
  });
});
