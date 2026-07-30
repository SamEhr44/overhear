'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@overhear/shared';
import { getApiWsUrl, OverhearSocket, type ConnectionStatus } from './ws';

const PING_INTERVAL_MS = 10_000;
const TRANSLATE_TIMEOUT_MS = 5_000;

export interface TranslationOutcome {
  targetText: string;
  provider: string;
  roundTripMs: number;
}

/**
 * Live connection to the caption API. Maintains status + measured round-trip
 * time via pings, and exposes a promise-based text translation (the M0
 * "hello world" round trip; M1 adds streaming audio on the same socket).
 */
export function useApiConnection() {
  const url = getApiWsUrl();
  const [status, setStatus] = useState<ConnectionStatus>(url ? 'connecting' : 'unconfigured');
  const [rttMs, setRttMs] = useState<number | null>(null);
  const socketRef = useRef<OverhearSocket | null>(null);
  const pendingRef = useRef(
    new Map<string, { resolve: (o: TranslationOutcome) => void; sentAt: number }>(),
  );

  useEffect(() => {
    if (!url) return;
    const socket = new OverhearSocket(url, {
      onStatus: setStatus,
      onMessage: (msg) => {
        if (msg.type === 'pong') {
          setRttMs(Math.max(0, Math.round(Date.now() - msg.t)));
          return;
        }
        if (msg.type === 'translation.result') {
          const pending = pendingRef.current.get(msg.id);
          if (pending) {
            pendingRef.current.delete(msg.id);
            pending.resolve({
              targetText: msg.targetText,
              provider: msg.provider,
              roundTripMs: Math.max(0, Math.round(Date.now() - pending.sentAt)),
            });
          }
        }
      },
    });
    socketRef.current = socket;
    socket.connect();

    const pinger = setInterval(() => {
      socket.send({ type: 'ping', t: Date.now() });
    }, PING_INTERVAL_MS);

    return () => {
      clearInterval(pinger);
      socket.close();
      socketRef.current = null;
    };
  }, [url]);

  // Fire an initial ping as soon as we connect so the RTT chip fills in fast.
  useEffect(() => {
    if (status === 'connected') {
      socketRef.current?.send({ type: 'ping', t: Date.now() });
    }
  }, [status]);

  const translate = useCallback(
    (text: string, sourceLang: Lang, targetLang: Lang): Promise<TranslationOutcome> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        const id = crypto.randomUUID();
        if (!socket?.send({ type: 'text.translate', id, text, sourceLang, targetLang })) {
          reject(new Error('not_connected'));
          return;
        }
        pendingRef.current.set(id, { resolve, sentAt: Date.now() });
        setTimeout(() => {
          if (pendingRef.current.delete(id)) reject(new Error('timeout'));
        }, TRANSLATE_TIMEOUT_MS);
      });
    },
    [],
  );

  return { status, rttMs, translate };
}
