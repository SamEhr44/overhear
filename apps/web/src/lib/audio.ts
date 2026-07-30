/**
 * Mic capture → 16 kHz PCM16 chunks via an AudioWorklet.
 * The "boost" gain sits between the mic source and the downsampler
 * (the Listen screen's hold-to-boost).
 */

export type MicFailure = 'denied' | 'no-mic' | 'unsupported';

export class MicFailureError extends Error {
  constructor(public readonly reason: MicFailure) {
    super(`mic_${reason}`);
  }
}

const BOOST_GAIN = 2.5;

export class MicStream {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private gain: GainNode | null = null;
  private worklet: AudioWorkletNode | null = null;

  /** Actual output sample rate the worklet emits (fixed 16k). */
  readonly sampleRate = 16000;

  async start(onChunk: (chunk: ArrayBuffer) => void): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new MicFailureError('unsupported');
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw new MicFailureError('denied');
      }
      if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        throw new MicFailureError('no-mic');
      }
      throw new MicFailureError('unsupported');
    }

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      // Allowed after a successful getUserMedia in practice; if the browser
      // still refuses, the caller surfaces a tap-to-start affordance.
      await ctx.resume().catch(() => {});
    }
    await ctx.audioWorklet.addModule('/worklets/pcm16-worklet.js');

    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = 1;
    const worklet = new AudioWorkletNode(ctx, 'pcm16-downsampler', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
    });
    worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => onChunk(event.data);
    source.connect(gain);
    gain.connect(worklet);

    this.ctx = ctx;
    this.stream = stream;
    this.gain = gain;
    this.worklet = worklet;
  }

  setBoost(on: boolean) {
    if (this.gain) this.gain.gain.value = on ? BOOST_GAIN : 1;
  }

  get running(): boolean {
    return this.ctx !== null;
  }

  async stop(): Promise<void> {
    this.worklet?.port.close();
    this.worklet?.disconnect();
    this.gain?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.stream = null;
    this.gain = null;
    this.worklet = null;
  }
}
