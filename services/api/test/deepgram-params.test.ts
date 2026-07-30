import { describe, expect, it } from 'vitest';
import { buildListenParams } from '../src/providers/deepgram.js';

const MODELS = { en: 'nova-3', es: 'nova-2' };

describe('buildListenParams', () => {
  it('picks the model per language', () => {
    expect(buildListenParams(MODELS, { lang: 'en', sampleRate: 16000 }).get('model')).toBe(
      'nova-3',
    );
    expect(buildListenParams(MODELS, { lang: 'es', sampleRate: 16000 }).get('model')).toBe(
      'nova-2',
    );
  });

  it('defaults endpointing to 300 and honors overrides (announcements = 500)', () => {
    expect(buildListenParams(MODELS, { lang: 'es', sampleRate: 16000 }).get('endpointing')).toBe(
      '300',
    );
    expect(
      buildListenParams(MODELS, { lang: 'es', sampleRate: 16000, endpointingMs: 500 }).get(
        'endpointing',
      ),
    ).toBe('500');
  });

  it('carries the stream format', () => {
    const params = buildListenParams(MODELS, { lang: 'es', sampleRate: 16000 });
    expect(params.get('encoding')).toBe('linear16');
    expect(params.get('sample_rate')).toBe('16000');
    expect(params.get('interim_results')).toBe('true');
  });
});
