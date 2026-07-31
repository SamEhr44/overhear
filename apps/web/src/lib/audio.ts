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

/**
 * close-talk: phone near the mouth (Talk, one-person Listen) — voice-call
 * DSP helps. far-field: distant sources (PA, conversations across a room) —
 * request the fully RAW capture path (all OS voice processing off; browser
 * AGC is tuned for phone-distance voices and leaves room speech below ASR's
 * voice-detection floor), then do our own leveling: a hot pre-gain into a
 * compressor tuned as a voice leveler, which lifts quiet distant speech
 * while clamping loud nearby sounds.
 */
export type MicProfile = 'close-talk' | 'far-field';

/** Exported for unit tests. */
export function constraintsForProfile(profile: MicProfile): MediaTrackConstraints {
  const closeTalk = profile === 'close-talk';
  return {
    channelCount: 1,
    echoCancellation: closeTalk,
    noiseSuppression: closeTalk,
    autoGainControl: closeTalk,
  };
}

/** Exported for unit tests. */
export function gainPlanForProfile(profile: MicProfile): {
  base: number;
  boosted: number;
  compressor: boolean;
} {
  return profile === 'far-field'
    ? { base: 2.5, boosted: 6, compressor: true }
    : { base: 1, boosted: 2.5, compressor: false };
}

/** Exported for unit tests. */
export function effectiveGain(
  plan: ReturnType<typeof gainPlanForProfile>,
  state: { muted: boolean; boosted: boolean },
): number {
  if (state.muted) return 0;
  return state.boosted ? plan.boosted : plan.base;
}

export class MicStream {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private gain: GainNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private gainPlan = gainPlanForProfile('close-talk');
  private muted = false;
  private boosted = false;

  /** Actual output sample rate the worklet emits (fixed 16k). */
  readonly sampleRate = 16000;

  async start(
    onChunk: (chunk: ArrayBuffer) => void,
    profile: MicProfile = 'close-talk',
  ): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new MicFailureError('unsupported');
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: constraintsForProfile(profile),
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

    // Ask for 16 kHz directly — Chrome/Android resample natively (highest
    // quality) and the worklet becomes a pass-through. Safari ignores the
    // hint and the worklet's linear resampler takes over.
    let ctx: AudioContext;
    try {
      ctx = new AudioContext({ sampleRate: this.sampleRate });
    } catch {
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') {
      // Allowed after a successful getUserMedia in practice; if the browser
      // still refuses, the caller surfaces a tap-to-start affordance.
      await ctx.resume().catch(() => {});
    }
    await ctx.audioWorklet.addModule('/worklets/pcm16-worklet.js');

    this.gainPlan = gainPlanForProfile(profile);
    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = this.gainPlan.base;
    const worklet = new AudioWorkletNode(ctx, 'pcm16-downsampler', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
    });
    worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => onChunk(event.data);

    source.connect(gain);
    if (this.gainPlan.compressor) {
      // Voice-leveler recipe: aggressive ratio with a low threshold acts as
      // our own wide-range AGC, purpose-built for distant speech.
      const leveler = ctx.createDynamicsCompressor();
      leveler.threshold.value = -50;
      leveler.knee.value = 40;
      leveler.ratio.value = 12;
      leveler.attack.value = 0.003;
      leveler.release.value = 0.25;
      gain.connect(leveler);
      leveler.connect(worklet);
    } else {
      gain.connect(worklet);
    }

    this.ctx = ctx;
    this.stream = stream;
    this.gain = gain;
    this.worklet = worklet;
  }

  private applyGain() {
    if (this.gain) {
      this.gain.gain.value = effectiveGain(this.gainPlan, {
        muted: this.muted,
        boosted: this.boosted,
      });
    }
  }

  setBoost(on: boolean) {
    this.boosted = on;
    this.applyGain();
  }

  /** Half-duplex duck: silence the mic while translations play aloud. */
  setMuted(on: boolean) {
    this.muted = on;
    this.applyGain();
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
