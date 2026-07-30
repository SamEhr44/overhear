import { describe, expect, it, vi } from 'vitest';
import { DeeplMt } from '../src/providers/deepl.js';

function mockFetch(response: unknown, status = 200) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
  })) as unknown as typeof fetch;
}

describe('DeeplMt', () => {
  it('uses the free-tier host for :fx keys and maps EN to EN-US', async () => {
    const fetchImpl = mockFetch({ translations: [{ text: 'hello', detected_source_language: 'ES' }] });
    const mt = new DeeplMt('key:fx', fetchImpl);
    const result = await mt.translate('hola', 'es', 'en');

    expect(result).toEqual({ text: 'hello', detectedSourceLang: 'es' });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://api-free.deepl.com/v2/translate');
    expect(init.headers).toMatchObject({ Authorization: 'DeepL-Auth-Key key:fx' });
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ text: ['hola'], source_lang: 'ES', target_lang: 'EN-US' });
    expect(body.formality).toBeUndefined();
  });

  it('uses the paid host for regular keys', async () => {
    const fetchImpl = mockFetch({ translations: [{ text: 'x' }] });
    const mt = new DeeplMt('paid-key', fetchImpl);
    await mt.translate('hola', 'es', 'en');
    const [url] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe('https://api.deepl.com/v2/translate');
  });

  it('sends formality only for supported targets (es yes, en no)', async () => {
    const fetchImpl = mockFetch({ translations: [{ text: 'buenos días' }] });
    const mt = new DeeplMt('key:fx', fetchImpl);
    await mt.translate('good morning', 'en', 'es', { formality: 'more' });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(init.body as string).formality).toBe('more');

    const fetchEn = mockFetch({ translations: [{ text: 'hi' }] });
    const mtEn = new DeeplMt('key:fx', fetchEn);
    await mtEn.translate('hola', 'es', 'en', { formality: 'more' });
    const [, initEn] = (fetchEn as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(initEn.body as string).formality).toBeUndefined();
  });

  it('throws on HTTP errors', async () => {
    const mt = new DeeplMt('key:fx', mockFetch({}, 456));
    await expect(mt.translate('hola', 'es', 'en')).rejects.toThrow('deepl_http_456');
  });
});
