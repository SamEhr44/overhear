'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, Lang, ServerMessage } from '@overhear/shared';
import { getApiWsUrl, OverhearSocket, type ConnectionStatus } from './ws';

const PING_INTERVAL_MS = 10_000;
const TRANSLATE_TIMEOUT_MS = 5_000;

export interface TranslationOutcome {
  targetText: string;
  provider: string;
  roundTripMs: number;
}

export interface ApiConnection {
  status: ConnectionStatus;
  rttMs: number | null;
  sendMessage: (msg: ClientMessage) => boolean;
  sendBinary: (chunk: ArrayBuffer) => boolean;
  /** Subscribe to every server message; returns an unsubscribe. */
  subscribe: (fn: (msg: ServerMessage) => void) => () => void;
  translate: (text: string, sourceLang: Lang, targetLang: Lang) => Promise<TranslationOutcome>;
}

/**
 * Live connection to the caption API: status + measured RTT via pings,
 * a message bus for session hooks, and promise-based text translation.
 */
export function useApiConnection(): ApiConnection {
  const url = getApiWsUrl();
  const [status, setStatus] = useState<ConnectionStatus>(url ? 'connecting' : 'unconfigured');
  const [rttMs, setRttMs] = useState<number | null>(null);
  const socketRef = useRef<OverhearSocket | null>(null);
  const listenersRef = useRef(new Set<(msg: ServerMessage) => void>());
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
        } else if (msg.type === 'translation.result') {
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
        for (const fn of listenersRef.current) fn(msg);
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

  // Prime the RTT chip as soon as the socket opens.
  useEffect(() => {
    if (status === 'connected') {
      socketRef.current?.send({ type: 'ping', t: Date.now() });
    }
  }, [status]);

  const sendMessage = useCallback((msg: ClientMessage) => {
    return socketRef.current?.send(msg) ?? false;
  }, []);

  const sendBinary = useCallback((chunk: ArrayBuffer) => {
    return socketRef.current?.sendBinary(chunk) ?? false;
  }, []);

  const subscribe = useCallback((fn: (msg: ServerMessage) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

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

  return { status, rttMs, sendMessage, sendBinary, subscribe, translate };
}
