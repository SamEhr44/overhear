import { describe, expect, it } from 'vitest';
import { pickVoice } from './tts';

function voice(lang: string, name = lang): SpeechSynthesisVoice {
  return { lang, name, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe('pickVoice', () => {
  it('prefers Mexican Spanish, then US/419, then any Spanish', () => {
    const voices = [voice('en-US'), voice('es-ES'), voice('es-US'), voice('es-MX')];
    expect(pickVoice(voices, 'es')?.lang).toBe('es-MX');
    expect(pickVoice([voice('es-ES'), voice('es-US')], 'es')?.lang).toBe('es-US');
    expect(pickVoice([voice('es-ES')], 'es')?.lang).toBe('es-ES');
  });

  it('handles underscore locales', () => {
    expect(pickVoice([voice('es_MX')], 'es')?.lang).toBe('es_MX');
  });

  it('returns null when no matching voice exists', () => {
    expect(pickVoice([voice('en-US'), voice('fr-FR')], 'es')).toBeNull();
    expect(pickVoice([], 'en')).toBeNull();
  });
});
