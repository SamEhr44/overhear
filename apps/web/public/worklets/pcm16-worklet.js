/**
 * Downsamples mic audio from the AudioContext rate to 16 kHz mono PCM16 and
 * posts ~100 ms chunks (1600 samples / 3200 bytes) to the main thread.
 * Bucket-averaging decimation — adequate for ASR; not for playback.
 */
class Pcm16Downsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.ratio = sampleRate / this.targetRate;
    this.acc = 0;
    this.accCount = 0;
    this.pos = 0;
    this.out = new Int16Array(1600);
    this.outIdx = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      this.acc += channel[i];
      this.accCount += 1;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        let v = this.acc / this.accCount;
        this.acc = 0;
        this.accCount = 0;
        if (v > 1) v = 1;
        else if (v < -1) v = -1;
        this.out[this.outIdx++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        if (this.outIdx === this.out.length) {
          const copy = this.out.slice(0);
          this.port.postMessage(copy.buffer, [copy.buffer]);
          this.outIdx = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('pcm16-downsampler', Pcm16Downsampler);
