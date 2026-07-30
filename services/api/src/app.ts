import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { loadEnv, type ApiEnv } from './env.js';
import { healthRoutes } from './routes/health.js';
import { listenSocketRoutes } from './ws/listen.js';

declare module 'fastify' {
  interface FastifyInstance {
    apiEnv: ApiEnv;
  }
}

export async function buildApp(env: ApiEnv = loadEnv()) {
  const app = Fastify({
    logger: { level: env.logLevel },
  });
  app.decorate('apiEnv', env);

  await app.register(websocket, {
    options: { maxPayload: 1024 * 1024 },
  });
  await app.register(healthRoutes);
  await app.register(listenSocketRoutes);

  return app;
}
