import * as Sentry from '@sentry/node';

/**
 * Error tracking — a silent no-op until SENTRY_DSN is set
 * (`fly secrets set SENTRY_DSN=...`). No PII, no audio: we never attach
 * request bodies or captured speech to events.
 */
export function initErrorTracking() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
  return true;
}

export function captureError(err: unknown) {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
}
