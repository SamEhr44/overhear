import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import {
  decodeServerMessage,
  encodeClientMessage,
  type ClientMessage,
  type ServerMessage,
} from '@overhear/shared';
import { buildApp } from '../src/app.js';

let app: Awaited<ReturnType<typeof buildApp>>;
let wsUrl: string;

beforeAll(async () => {
  app = await buildApp({ port: 0, allowedOrigins: [], logLevel: 'silent' });
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  if (address === null || typeof address === 'string') throw new Error('no address');
  wsUrl = `ws://127.0.0.1:${address.port}/ws/listen`;
});

afterAll(async () => {
  await app.close();
});

function connect(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function nextMessage(ws: WebSocket): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    ws.once('message', (data) => {
      try {
        resolve(decodeServerMessage(data.toString()));
      } catch (err) {
        reject(err as Error);
      }
    });
  });
}

function send(ws: WebSocket, msg: ClientMessage) {
  ws.send(encodeClientMessage(msg));
}

describe('healthz', () => {
  it('reports ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'overhear-api' });
  });
});

describe('/ws/listen', () => {
  it('answers ping with pong', async () => {
    const ws = await connect();
    send(ws, { type: 'ping', t: 123 });
    const msg = await nextMessage(ws);
    expect(msg).toMatchObject({ type: 'pong', t: 123 });
    ws.close();
  });

  it('acknowledges session start with providers', async () => {
    const ws = await connect();
    send(ws, {
      type: 'session.start',
      mode: 'listen',
      sourceLang: 'es',
      targetLang: 'en',
    });
    const msg = await nextMessage(ws);
    expect(msg.type).toBe('session.ready');
    if (msg.type === 'session.ready') {
      expect(msg.sessionId).toBeTruthy();
      expect(msg.providers).toEqual({ asr: 'echo-asr', mt: 'echo-mt' });
    }
    ws.close();
  });

  it('round-trips a text translation through the mock MT provider', async () => {
    const ws = await connect();
    send(ws, {
      type: 'text.translate',
      id: 'req-1',
      text: '¿Dónde está la puerta veintidós?',
      sourceLang: 'es',
      targetLang: 'en',
    });
    const msg = await nextMessage(ws);
    expect(msg).toMatchObject({
      type: 'translation.result',
      id: 'req-1',
      targetText: 'Where is gate twenty-two?',
      provider: 'echo-mt',
    });
    ws.close();
  });

  it('rejects malformed messages with a protocol error', async () => {
    const ws = await connect();
    ws.send(JSON.stringify({ type: 'not-a-thing' }));
    const msg = await nextMessage(ws);
    expect(msg).toMatchObject({ type: 'error', code: 'bad_message' });
    ws.close();
  });

  it('rejects binary audio before a session exists', async () => {
    const ws = await connect();
    ws.send(Buffer.from([1, 2, 3]));
    const msg = await nextMessage(ws);
    expect(msg).toMatchObject({ type: 'error', code: 'no_session' });
    ws.close();
  });
});
