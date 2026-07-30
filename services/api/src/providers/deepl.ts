import type { Lang, MtProvider, TranslateOptions, TranslationResult } from '@overhear/shared';

/** DeepL REST MT behind the MtProvider interface. */

const TARGET_LANG: Record<Lang, string> = {
  // DeepL deprecates bare EN as a target — regional variant required.
  en: 'EN-US',
  es: 'ES',
};

/** DeepL only supports the formality parameter for some targets; ES is one, EN is not. */
const FORMALITY_TARGETS = new Set<Lang>(['es']);

export class DeeplMt implements MtProvider {
  readonly name = 'deepl';
  private readonly endpoint: string;

  constructor(
    private readonly apiKey: string,
    fetchImpl: typeof fetch = fetch,
  ) {
    // Free-tier keys are suffixed ":fx" and live on the api-free host.
    this.endpoint = apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';
    this.fetchImpl = fetchImpl;
  }

  private readonly fetchImpl: typeof fetch;

  async translate(
    text: string,
    from: Lang,
    to: Lang,
    opts?: TranslateOptions,
  ): Promise<TranslationResult> {
    const body: Record<string, unknown> = {
      text: [text],
      source_lang: from.toUpperCase(),
      target_lang: TARGET_LANG[to],
    };
    if (opts?.formality && opts.formality !== 'default' && FORMALITY_TARGETS.has(to)) {
      body.formality = opts.formality;
    }

    const res = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`deepl_http_${res.status}`);

    const data = (await res.json()) as {
      translations?: Array<{ text: string; detected_source_language?: string }>;
    };
    const first = data.translations?.[0];
    if (!first) throw new Error('deepl_empty_response');

    const detected = first.detected_source_language?.toLowerCase();
    return {
      text: first.text,
      detectedSourceLang: detected === 'es' || detected === 'en' ? detected : undefined,
    };
  }
}
