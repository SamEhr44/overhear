import { describe, expect, it } from 'vitest';
import {
  decodeClientMessage,
  decodeServerMessage,
  encodeClientMessage,
  encodeServerMessage,
  type ClientMessage,
  type ServerMessage,
} from './protocol.js';

describe('protocol codecs', () => {
  it('round-trips a client message', () => {
    const msg: ClientMessage = {
      type: 'text.translate',
      id: 'abc',
      text: '¿Dónde está la puerta veintidós?',
      sourceLang: 'es',
      targetLang: 'en',
    };
    expect(decodeClientMessage(encodeClientMessage(msg))).toEqual(msg);
  });

  it('round-trips a server caption message', () => {
    const msg: ServerMessage = {
      type: 'caption.final',
      caption: {
        id: 'utt-1',
        sourceText: 'puerta veintidós',
        targetText: 'gate twenty-two',
        sourceLang: 'es',
        targetLang: 'en',
        confidence: 0.61,
        isFinal: true,
        startedAt: 1000,
        finalizedAt: 2000,
      },
    };
    expect(decodeServerMessage(encodeServerMessage(msg))).toEqual(msg);
  });

  it('rejects malformed messages', () => {
    expect(() => decodeClientMessage(JSON.stringify({ type: 'nope' }))).toThrow();
    expect(() => decodeServerMessage(JSON.stringify({ type: 'pong' }))).toThrow();
  });
});
