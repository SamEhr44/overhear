export interface ApiEnv {
  port: number;
  /** Comma-separated allowlist of browser origins for WS upgrades; empty = allow all (dev). */
  allowedOrigins: string[];
  logLevel: string;
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return {
    port: Number(env.PORT ?? 8787),
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    logLevel: env.LOG_LEVEL ?? 'info',
  };
}
