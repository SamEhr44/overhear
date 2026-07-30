import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import type { AsrStream } from '@overhear/shared';
import {
  decodeClientMessage,
  encodeServerMessage,
  type ClientMessage,
  type ServerMessage,
} from '@overhear/shared';
import { Captioner } from '../pipeline/captioner.js';

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

    const { asr, mt } = app.providers;
    let sessionId: string | null = null;
    let asrStream: AsrStream | null = null;
    let starting = false;

    // Protocol-level pings keep mobile NATs and proxies from idling the
    // socket out between app-level pings.
    const keepalive = setInterval(() => {
      if (socket.readyState === socket.OPEN) socket.ping();
    }, 20_000);

    const stopSession = async () => {
      const stream = asrStream;
      asrStream = null;
      sessionId = null;
      if (stream) await stream.end().catch(() => {});
    };

    socket.on('message', async (raw: Buffer, isBinary: boolean) => {
      if (isBinary) {
        if (!asrStream) {
          if (!starting) {
            send(socket, {
              type: 'error',
              code: 'no_session',
              message: 'Send session.start before streaming audio.',
            });
          }
          return;
        }
        asrStream.sendAudio(raw);
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
          if (starting) return;
          starting = true;
          try {
            await stopSession();
            const captioner = new Captioner(mt, msg.sourceLang, msg.targetLang, {
              onPartial: (caption) => send(socket, { type: 'caption.partial', caption }),
              onFinal: (caption) => send(socket, { type: 'caption.final', caption }),
            });
            const stream = await asr.startStream({
              lang: msg.sourceLang,
              sampleRate: msg.audio?.sampleRate ?? 16000,
            });
            stream.onResult((result) => {
              void captioner.handleAsrResult(result).catch((err) => {
                req.log.error({ err }, 'captioner failure');
              });
            });
            stream.onError((err) => {
              req.log.error({ err }, 'asr stream error');
              send(socket, {
                type: 'error',
                code: 'asr_error',
                message: 'Speech recognition hit an error — captions paused.',
              });
            });
            asrStream = stream;
            sessionId = randomUUID();
            send(socket, {
              type: 'session.ready',
              sessionId,
              providers: { asr: asr.name, mt: mt.name },
            });
          } catch (err) {
            req.log.error({ err }, 'failed to start asr stream');
            send(socket, {
              type: 'error',
              code: 'asr_unavailable',
              message: 'Could not reach the speech provider.',
            });
          } finally {
            starting = false;
          }
          break;
        }
        case 'session.stop': {
          const stoppedId = sessionId;
          await stopSession();
          if (stoppedId) send(socket, { type: 'session.stopped', sessionId: stoppedId });
          break;
        }
        case 'text.translate': {
          try {
            const result = await mt.translate(msg.text, msg.sourceLang, msg.targetLang, {
              formality: msg.targetLang === 'es' ? 'more' : 'default',
            });
            send(socket, {
              type: 'translation.result',
              id: msg.id,
              sourceText: msg.text,
              targetText: result.text,
              provider: mt.name,
            });
          } catch (err) {
            req.log.error({ err }, 'translate failure');
            send(socket, {
              type: 'error',
              code: 'mt_error',
              message: 'Translation is unavailable right now.',
            });
          }
          break;
        }
        case 'ping': {
          send(socket, { type: 'pong', t: msg.t, serverTime: Date.now() });
          break;
        }
      }
    });

    socket.on('close', () => {
      clearInterval(keepalive);
      void stopSession();
    });
  });
}
