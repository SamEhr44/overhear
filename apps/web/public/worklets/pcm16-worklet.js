/**
 * Converts mic audio from the AudioContext rate to 16 kHz mono PCM16 and
 * posts ~100 ms chunks (1600 samples / 3200 bytes) to the main thread.
 *
 * When the context already runs at 16 kHz (Chrome/Android honor the
 * requested rate) this is a pass-through. Otherwise it linearly
 * interpolates between input samples — far less aliasing than bucket
 * averaging, which audibly garbled ASR on 44.1/48 kHz devices (Safari).
 */
class Pcm16Downsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.step = sampleRate / this.targetRate; // input samples per output sample
    this.phase = 0; // fractional read position within the current input block
    this.prevSample = 0; // last sample of the previous block, for interpolation
    this.hasPrev = false;
    this.out = new Int16Array(1600);
    this.outIdx = 0;
  }

  pushSample(v) {
    if (v > 1) v = 1;
    else if (v < -1) v = -1;
    this.out[this.outIdx++] = v < 0 ? v * 0x8000 : v * 0x7fff;
    if (this.outIdx === this.out.length) {
      const copy = this.out.slice(0);
      this.port.postMessage(copy.buffer, [copy.buffer]);
      this.outIdx = 0;
    }
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;

    if (this.step === 1) {
      for (let i = 0; i < ch.length; i++) this.pushSample(ch[i]);
      return true;
    }

    // Resample by linear interpolation. `pos` walks the input timeline in
    // input-sample units; index -1 refers to the last sample of the previous
    // block so interpolation is continuous across block boundaries.
    let pos = this.phase;
    while (pos < ch.length) {
      const i = Math.floor(pos);
      const frac = pos - i;
      const s0 = i === 0 ? (this.hasPrev ? this.prevSample : ch[0]) : ch[i - 1];
      const s1 = ch[Math.min(i, ch.length - 1)];
      // s0 is the sample just before `pos`, s1 the one at/after it.
      this.pushSample(s0 + (s1 - s0) * frac);
      pos += this.step;
    }
    this.phase = pos - ch.length;
    this.prevSample = ch[ch.length - 1];
    this.hasPrev = true;
    return true;
  }
}

registerProcessor('pcm16-downsampler', Pcm16Downsampler);
