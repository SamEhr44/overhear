import {
  decodeServerMessage,
  encodeClientMessage,
  type ClientMessage,
  type ServerMessage,
} from '@overhear/shared';

export type ConnectionStatus = 'unconfigured' | 'connecting' | 'connected' | 'offline';

/**
 * Resolve the caption API WebSocket URL.
 * - Prod: NEXT_PUBLIC_API_WS_URL (unset until the Fly API is live → honest
 *   "unconfigured" state in the UI, never a fake connection).
 * - Dev: falls back to the local API on :8787.
 */
export function getApiWsUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_API_WS_URL;
  if (explicit && explicit.length > 0) return explicit;
  if (process.env.NODE_ENV === 'development') return 'ws://localhost:8787/ws/listen';
  return null;
}

export interface OverhearSocketHandlers {
  onStatus: (status: ConnectionStatus) => void;
  onMessage: (msg: ServerMessage) => void;
}

const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 15_000];

/** Thin typed wrapper around the caption WebSocket with capped-backoff reconnect. */
export class OverhearSocket {
  private ws: WebSocket | null = null;
  private attempts = 0;
  private closedByUser = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly url: string,
    private readonly handlers: OverhearSocketHandlers,
  ) {}

  connect() {
    this.closedByUser = false;
    this.open();
  }

  private open() {
    this.handlers.onStatus(this.attempts === 0 ? 'connecting' : 'offline');
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.attempts = 0;
      this.handlers.onStatus('connected');
    };
    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') return; // binary is never expected client-bound in M0
      try {
        this.handlers.onMessage(decodeServerMessage(event.data));
      } catch {
        // Ignore malformed frames rather than crashing the UI.
      }
    };
    ws.onclose = () => {
      this.ws = null;
      if (this.closedByUser) return;
      this.handlers.onStatus('offline');
      const delay = BACKOFF_MS[Math.min(this.attempts, BACKOFF_MS.length - 1)] ?? 15_000;
      this.attempts += 1;
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };
    ws.onerror = () => {
      ws.close();
    };
  }

  send(msg: ClientMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(encodeClientMessage(msg));
      return true;
    }
    return false;
  }

  /** Raw audio frames (PCM16). Only valid after session.start. */
  sendBinary(chunk: ArrayBuffer): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
      return true;
    }
    return false;
  }

  close() {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
