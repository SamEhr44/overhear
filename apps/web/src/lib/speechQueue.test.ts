import { describe, expect, it } from 'vitest';
import { SpeechQueue } from './tts';
import { effectiveGain, gainPlanForProfile } from './audio';

function makeSpeaker() {
  const spoken: string[] = [];
  let release: (() => void) | null = null;
  const speakFn = (text: string) =>
    new Promise<void>((resolve) => {
      spoken.push(text);
      release = resolve;
    });
  return { spoken, speakFn, finish: () => release?.() };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('SpeechQueue', () => {
  it('speaks in order and reports activity', async () => {
    const { spoken, speakFn, finish } = makeSpeaker();
    const queue = new SpeechQueue(speakFn, 2);
    const activity: boolean[] = [];
    queue.onActivity((s) => activity.push(s));

    queue.enqueue('one', 'en');
    await tick();
    expect(spoken).toEqual(['one']);
    expect(queue.speaking).toBe(true);

    queue.enqueue('two', 'en');
    finish();
    await tick();
    expect(spoken).toEqual(['one', 'two']);

    finish();
    await tick();
    expect(queue.speaking).toBe(false);
    expect(activity).toEqual([true, false]);
  });

  it('drops the stalest backlog so playback stays near-live', async () => {
    const { spoken, speakFn, finish } = makeSpeaker();
    const queue = new SpeechQueue(speakFn, 2);

    queue.enqueue('speaking-now', 'en');
    await tick();
    // Backlog grows past the cap while the first utterance is still playing.
    queue.enqueue('old-1', 'en');
    queue.enqueue('old-2', 'en');
    queue.enqueue('newest-1', 'en');
    queue.enqueue('newest-2', 'en');

    finish();
    await tick();
    finish();
    await tick();
    finish();
    await tick();

    expect(spoken).toEqual(['speaking-now', 'newest-1', 'newest-2']);
  });

  it('clear() empties pending speech', async () => {
    const { spoken, speakFn, finish } = makeSpeaker();
    const queue = new SpeechQueue(speakFn, 2);
    queue.enqueue('a', 'en');
    await tick();
    queue.enqueue('b', 'en');
    queue.clear();
    finish();
    await tick();
    expect(spoken).toEqual(['a']);
    expect(queue.speaking).toBe(false);
  });
});

describe('effectiveGain', () => {
  const plan = gainPlanForProfile('far-field');
  it('mute wins over boost (half-duplex duck)', () => {
    expect(effectiveGain(plan, { muted: true, boosted: true })).toBe(0);
    expect(effectiveGain(plan, { muted: false, boosted: true })).toBe(plan.boosted);
    expect(effectiveGain(plan, { muted: false, boosted: false })).toBe(plan.base);
  });
});
