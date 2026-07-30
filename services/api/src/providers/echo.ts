import type {
  AsrProvider,
  AsrResult,
  AsrStream,
  MtProvider,
  TranslationResult,
} from '@overhear/shared';

/**
 * M0 mock providers. They exercise the exact same interfaces the real
 * Deepgram/DeepL adapters implement in M1, so swapping is config-only.
 */

const DICT: Record<string, string> = {
  hola: 'hello',
  gracias: 'thank you',
  'la cuenta': 'the check',
  'la cuenta, por favor': 'the check, please',
  'sin cilantro, por favor': 'no cilantro, please',
  '¿dónde está la puerta veintidós?': 'Where is gate twenty-two?',
};

export const echoMt: MtProvider = {
  name: 'echo-mt',
  async translate(text, _from, to): Promise<TranslationResult> {
    const hit = DICT[text.trim().toLowerCase()];
    return { text: hit ?? `[${to} · mock] ${text}` };
  },
};

export const echoAsr: AsrProvider = {
  name: 'echo-asr',
  async startStream(): Promise<AsrStream> {
    const resultListeners: Array<(r: AsrResult) => void> = [];
    const errorListeners: Array<(e: Error) => void> = [];
    void errorListeners;
    return {
      sendAudio() {
        // M0: audio is accepted and discarded; real streaming ASR lands in M1.
      },
      async end() {},
      onResult(cb) {
        resultListeners.push(cb);
      },
      onError(cb) {
        errorListeners.push(cb);
      },
    };
  },
};
