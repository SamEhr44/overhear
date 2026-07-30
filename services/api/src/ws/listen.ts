import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import {
  decodeClientMessage,
  encodeServerMessage,
  type ClientMessage,
  type ServerMessage,
} from '@overhear/shared';
import { echoAsr, echoMt } from '../providers/echo.js';

interface ConnectionState {
  sessionId: string | null;
  audioBytes: number;
}

function send(socket: WebSocket, msg: ServerMessage) {
  if (socket.readyState === socket.OPEN) {
    socket.send(encodeServerMessage(msg));
  }
}

export async function listenSocketRoutes(app: FastifyInstance) {
  app.get('/ws/listen', { websocket: true }, (socket, req) => {
    const { allowedOrigins } = app.apiEnv;
    const origin = req.headers.origin;
    if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
      req.log.warn({ origin }, 'rejected ws origin');
      socket.close(1008, 'origin not allowed');
      return;
    }

    const state: ConnectionState = { sessionId: null, audioBytes: 0 };

    socket.on('message', async (raw: Buffer, isBinary: boolean) => {
      if (isBinary) {
        if (!state.sessionId) {
          send(socket, {
            type: 'error',
            code: 'no_session',
            message: 'Send session.start before streaming audio.',
          });
          return;
        }
        // M0: count and discard; M1 pipes this into the ASR provider stream.
        state.audioBytes += raw.byteLength;
        return;
      }

      let msg: ClientMessage;
      try {
        msg = decodeClientMessage(raw.toString('utf8'));
      } catch {
        send(socket, {
          type: 'error',
          code: 'bad_message',
          message: 'Message failed protocol validation.',
        });
        return;
      }

      switch (msg.type) {
        case 'session.start': {
          state.sessionId = randomUUID();
          send(socket, {
            type: 'session.ready',
            sessionId: state.sessionId,
            providers: { asr: echoAsr.name, mt: echoMt.name },
          });
          break;
        }
        case 'session.stop': {
          if (state.sessionId) {
            send(socket, { type: 'session.stopped', sessionId: state.sessionId });
            state.sessionId = null;
          }
          break;
        }
        case 'text.translate': {
          const result = await echoMt.translate(msg.text, msg.sourceLang, msg.targetLang);
          send(socket, {
            type: 'translation.result',
            id: msg.id,
            sourceText: msg.text,
            targetText: result.text,
            provider: echoMt.name,
          });
          break;
        }
        case 'ping': {
          send(socket, { type: 'pong', t: msg.t, serverTime: Date.now() });
          break;
        }
      }
    });
  });
}
