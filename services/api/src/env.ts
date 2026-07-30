export interface ApiEnv {
  port: number;
  /** Comma-separated allowlist of browser origins for WS upgrades; empty = allow all (dev). */
  allowedOrigins: string[];
  logLevel: string;
  /** When present, real providers replace the echo mocks. Keys never reach the client. */
  deepgramApiKey?: string;
  deeplApiKey?: string;
  deepgramModel: string;
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return {
    port: Number(env.PORT ?? 8787),
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    logLevel: env.LOG_LEVEL ?? 'info',
    deepgramApiKey: env.DEEPGRAM_API_KEY || undefined,
    deeplApiKey: env.DEEPL_API_KEY || undefined,
    deepgramModel: env.DEEPGRAM_MODEL ?? 'nova-2',
  };
}
