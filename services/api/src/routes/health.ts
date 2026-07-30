import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/healthz', async () => ({
    status: 'ok',
    service: 'overhear-api',
    uptimeSeconds: Math.round(process.uptime()),
  }));
}
