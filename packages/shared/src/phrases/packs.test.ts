import { describe, expect, it } from 'vitest';
import { ALL_PACKS, getPack, QUICK_REPLIES, SPANISH_INTRO } from './index.js';

describe('phrase packs', () => {
  it('registers the four situation packs with unique ids', () => {
    expect(ALL_PACKS.map((p) => p.id)).toEqual(['directions', 'restaurant', 'shopping', 'hotel']);
    const phraseIds = ALL_PACKS.flatMap((p) => p.phrases.map((ph) => ph.id));
    expect(new Set(phraseIds).size).toBe(phraseIds.length);
  });

  it('every phrase has both languages and a category', () => {
    for (const pack of ALL_PACKS) {
      expect(pack.title.en.length).toBeGreaterThan(0);
      expect(pack.title.es.length).toBeGreaterThan(0);
      expect(pack.tagline.en.length).toBeGreaterThan(0);
      expect(pack.phrases.length).toBeGreaterThanOrEqual(5);
      for (const phrase of pack.phrases) {
        expect(phrase.es.length).toBeGreaterThan(0);
        expect(phrase.en.length).toBeGreaterThan(0);
        expect(phrase.category.length).toBeGreaterThan(0);
      }
    }
  });

  it('resolves packs by id', () => {
    expect(getPack('restaurant')?.title.en).toBe('Restaurant');
    expect(getPack('nope')).toBeUndefined();
  });

  it('ships quick replies and the stranger-facing intro', () => {
    expect(QUICK_REPLIES.length).toBeGreaterThanOrEqual(4);
    expect(SPANISH_INTRO.es).toContain('usando esta aplicación');
    expect(SPANISH_INTRO.en).toContain('using this app');
  });
});
