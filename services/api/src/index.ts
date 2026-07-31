import { buildApp } from './app.js';
import { loadEnv } from './env.js';
import { initErrorTracking } from './instrument.js';

const env = loadEnv();
const tracking = initErrorTracking();
const app = await buildApp(env);
if (tracking) app.log.info('error tracking enabled');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.log.info({ signal }, 'shutting down');
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ port: env.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
