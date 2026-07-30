import WebSocket from 'ws';
import type { AsrProvider, AsrResult, AsrStream, AsrStreamOptions } from '@overhear/shared';

/**
 * Deepgram streaming ASR behind the AsrProvider interface.
 * Raw WS (no SDK): audio in as linear16 frames, Results JSON out.
 */

interface DeepgramWord {
  word: string;
  confidence: number;
  punctuated_word?: string;
}

interface DeepgramResults {
  type?: string;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: {
    alternatives?: Array<{
      transcript?: string;
      confidence?: number;
      words?: DeepgramWord[];
    }>;
  };
}

/** Exported for unit tests. */
export function parseDeepgramMessage(raw: string): AsrResult | null {
  let msg: DeepgramResults;
  try {
    msg = JSON.parse(raw) as DeepgramResults;
  } catch {
    return null;
  }
  if (msg.type !== 'Results') return null;
  const alt = msg.channel?.alternatives?.[0];
  if (!alt) return null;
  return {
    text: (alt.transcript ?? '').trim(),
    confidence: Math.max(0, Math.min(1, alt.confidence ?? 0)),
    isFinal: msg.is_final === true,
    words: (alt.words ?? []).map((w) => ({
      word: w.punctuated_word ?? w.word,
      confidence: Math.max(0, Math.min(1, w.confidence)),
    })),
  };
}

const KEEPALIVE_INTERVAL_MS = 8_000;

export class DeepgramAsr implements AsrProvider {
  readonly name: string;

  constructor(
    private readonly apiKey: string,
    private readonly model = 'nova-2',
  ) {
    this.name = `deepgram-${model}`;
  }

  async startStream(opts: AsrStreamOptions): Promise<AsrStream> {
    const params = new URLSearchParams({
      model: this.model,
      language: opts.lang,
      encoding: 'linear16',
      sample_rate: String(opts.sampleRate),
      channels: '1',
      interim_results: 'true',
      smart_format: 'true',
      endpointing: '300',
    });
    const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${params.toString()}`, {
      headers: { Authorization: `Token ${this.apiKey}` },
    });

    const resultCbs: Array<(r: AsrResult) => void> = [];
    const errorCbs: Array<(e: Error) => void> = [];

    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve());
      ws.once('error', (err) => reject(err instanceof Error ? err : new Error(String(err))));
    });

    const keepalive = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, KEEPALIVE_INTERVAL_MS);

    ws.on('message', (data) => {
      const result = parseDeepgramMessage(data.toString());
      if (result) for (const cb of resultCbs) cb(result);
    });
    ws.on('error', (err) => {
      const e = err instanceof Error ? err : new Error(String(err));
      for (const cb of errorCbs) cb(e);
    });
    ws.on('close', () => clearInterval(keepalive));

    return {
      sendAudio(chunk) {
        if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
      },
      async end() {
        clearInterval(keepalive);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'CloseStream' }));
        }
        ws.close();
      },
      onResult(cb) {
        resultCbs.push(cb);
      },
      onError(cb) {
        errorCbs.push(cb);
      },
    };
  }
}
