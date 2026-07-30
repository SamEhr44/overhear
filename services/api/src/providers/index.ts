import type { AsrProvider, MtProvider } from '@overhear/shared';
import type { ApiEnv } from '../env.js';
import { DeeplMt } from './deepl.js';
import { DeepgramAsr } from './deepgram.js';
import { echoAsr, echoMt } from './echo.js';

export interface Providers {
  asr: AsrProvider;
  mt: MtProvider;
}

/** Real providers when keys exist, echo mocks otherwise (dev/CI keep working keyless). */
export function makeProviders(env: ApiEnv): Providers {
  return {
    asr: env.deepgramApiKey ? new DeepgramAsr(env.deepgramApiKey, env.deepgramModel) : echoAsr,
    mt: env.deeplApiKey ? new DeeplMt(env.deeplApiKey) : echoMt,
  };
}
