import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { loadEnv, type ApiEnv } from './env.js';
import { captureError } from './instrument.js';
import { makeProviders, type Providers } from './providers/index.js';
import { healthRoutes } from './routes/health.js';
import { listenSocketRoutes } from './ws/listen.js';

declare module 'fastify' {
  interface FastifyInstance {
    apiEnv: ApiEnv;
    providers: Providers;
  }
}

export async function buildApp(env: ApiEnv = loadEnv()) {
  const app = Fastify({
    logger: { level: env.logLevel },
  });
  app.decorate('apiEnv', env);
  app.decorate('providers', makeProviders(env));

  await app.register(websocket, {
    options: { maxPayload: 1024 * 1024 },
  });
  await app.register(healthRoutes);
  await app.register(listenSocketRoutes);

  app.setErrorHandler((err, _req, reply) => {
    captureError(err);
    app.log.error(err);
    void reply.status(500).send({ error: 'internal_error' });
  });

  return app;
}
