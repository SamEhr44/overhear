import { describe, expect, it } from 'vitest';
import type { Caption, MtProvider } from '@overhear/shared';
import { Captioner } from '../src/pipeline/captioner.js';

function makeMt(prefix = 'EN:', delayMs = 0): MtProvider & { calls: string[] } {
  const calls: string[] = [];
  return {
    name: 'fake-mt',
    calls,
    async translate(text: string) {
      calls.push(text);
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      return { text: `${prefix}${text}` };
    },
  };
}

function collect() {
  const partials: Caption[] = [];
  const finals: Caption[] = [];
  return {
    partials,
    finals,
    events: {
      onPartial: (c: Caption) => partials.push(c),
      onFinal: (c: Caption) => finals.push(c),
    },
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Captioner', () => {
  it('emits partials immediately and finals with fresh translations', async () => {
    const mt = makeMt();
    const { partials, finals, events } = collect();
    const captioner = new Captioner(mt, 'es', 'en', events);

    await captioner.handleAsrResult({ text: 'hola', confidence: 0.9, isFinal: false });
    // The first emit is synchronous and untranslated; the MT enrichment may
    // already have landed on the microtask queue by the time we assert.
    expect(partials[0]).toMatchObject({ sourceText: 'hola', targetText: '', isFinal: false });

    await wait(10); // let the throttled partial MT land
    expect(partials.length).toBeGreaterThanOrEqual(2);
    expect(partials.at(-1)).toMatchObject({ targetText: 'EN:hola' });

    await captioner.handleAsrResult({ text: 'hola amigo', confidence: 0.92, isFinal: true });
    expect(finals).toHaveLength(1);
    expect(finals[0]).toMatchObject({
      sourceText: 'hola amigo',
      targetText: 'EN:hola amigo',
      isFinal: true,
    });
    expect(finals[0]?.finalizedAt).toBeTypeOf('number');
  });

  it('rotates utterance ids after each final', async () => {
    const mt = makeMt();
    const { partials, finals, events } = collect();
    const captioner = new Captioner(mt, 'es', 'en', events);

    await captioner.handleAsrResult({ text: 'uno', confidence: 0.9, isFinal: false });
    await captioner.handleAsrResult({ text: 'uno dos', confidence: 0.9, isFinal: true });
    await captioner.handleAsrResult({ text: 'tres', confidence: 0.9, isFinal: false });

    const firstId = partials[0]?.id;
    expect(finals[0]?.id).toBe(firstId);
    expect(partials.at(-1)?.id).not.toBe(firstId);
  });

  it('ignores empty results', async () => {
    const mt = makeMt();
    const { partials, finals, events } = collect();
    const captioner = new Captioner(mt, 'es', 'en', events);
    await captioner.handleAsrResult({ text: '  ', confidence: 0, isFinal: false });
    await captioner.handleAsrResult({ text: '', confidence: 0, isFinal: true });
    expect(partials).toHaveLength(0);
    expect(finals).toHaveLength(0);
    expect(mt.calls).toHaveLength(0);
  });

  it('falls back to the last partial translation when final MT fails', async () => {
    let shouldFail = false;
    const mt: MtProvider = {
      name: 'flaky-mt',
      async translate(text: string) {
        if (shouldFail) throw new Error('boom');
        return { text: `EN:${text}` };
      },
    };
    const { finals, events } = collect();
    const captioner = new Captioner(mt, 'es', 'en', events);

    await captioner.handleAsrResult({ text: 'la puerta', confidence: 0.8, isFinal: false });
    await wait(10);
    shouldFail = true;
    await captioner.handleAsrResult({ text: 'la puerta veintidós', confidence: 0.8, isFinal: true });
    expect(finals[0]?.targetText).toBe('EN:la puerta');
  });

  it('throttles partial MT calls', async () => {
    const mt = makeMt();
    const { events } = collect();
    let clock = 0;
    const captioner = new Captioner(mt, 'es', 'en', events, () => clock);

    await captioner.handleAsrResult({ text: 'a', confidence: 0.9, isFinal: false });
    clock += 100; // < 350ms window
    await captioner.handleAsrResult({ text: 'a b', confidence: 0.9, isFinal: false });
    clock += 100;
    await captioner.handleAsrResult({ text: 'a b c', confidence: 0.9, isFinal: false });
    await wait(10);
    expect(mt.calls).toHaveLength(1); // only the first partial translated

    clock += 400; // window elapsed
    await captioner.handleAsrResult({ text: 'a b c d', confidence: 0.9, isFinal: false });
    await wait(10);
    expect(mt.calls).toHaveLength(2);
  });
});
