/**
 * End-to-end pipeline check with REAL providers and REAL audio.
 *
 * Synthesizes a Spanish sentence with Deepgram Aura TTS, streams the PCM to
 * the Overhear WS API paced like a live mic (100 ms chunks), and reports
 * caption latencies against the PRD budgets (partial < ~400 ms after speech,
 * final < ~1.2 s after utterance end).
 *
 * Usage:
 *   DEEPGRAM_API_KEY=... node scripts/live-check.mjs [wsUrl]
 *   (wsUrl defaults to ws://localhost:8787/ws/listen)
 *
 * Costs a fraction of a cent per run. Not part of the CI test suite.
 */
import WebSocket from 'ws';

const WS_URL = process.argv[2] ?? 'ws://localhost:8787/ws/listen';
const DG_KEY = process.env.DEEPGRAM_API_KEY;
const SENTENCE = 'La salida a Puerto Vallarta es por la puerta veintidós.';
const SAMPLE_RATE = 16000;
const CHUNK_MS = 100;

if (!DG_KEY) {
  console.error('DEEPGRAM_API_KEY env var is required (used for TTS synthesis).');
  process.exit(1);
}

async function pickSpanishVoice() {
  const res = await fetch('https://api.deepgram.com/v1/models', {
    headers: { Authorization: `Token ${DG_KEY}` },
  });
  if (!res.ok) throw new Error(`models_http_${res.status}`);
  const data = await res.json();
  const voices = (data.tts ?? []).filter((m) =>
    (m.languages ?? []).some((l) => String(l).toLowerCase().startsWith('es')),
  );
  const voice = voices[0]?.canonical_name ?? voices[0]?.name;
  if (!voice) throw new Error('no spanish tts voice available on this key');
  return voice;
}

async function synthesize(voice) {
  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}&encoding=linear16&sample_rate=${SAMPLE_RATE}&container=none`,
    {
      method: 'POST',
      headers: { Authorization: `Token ${DG_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: SENTENCE }),
    },
  );
  if (!res.ok) throw new Error(`speak_http_${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

const voice = await pickSpanishVoice();
console.log(`tts voice: ${voice}`);
const audio = await synthesize(voice);
const audioMs = Math.round((audio.length / 2 / SAMPLE_RATE) * 1000);
console.log(`audio: ${audio.length} bytes (~${audioMs} ms) for: "${SENTENCE}"`);

const ws = await connect(WS_URL);
console.log(`connected: ${WS_URL}`);

let sessionReady;
const done = new Promise((resolve) => (sessionReady = resolve));
const events = [];
let firstChunkAt = 0;
let lastChunkAt = 0;
let readyInfo = null;

ws.on('message', (raw, isBinary) => {
  if (isBinary) return;
  const msg = JSON.parse(raw.toString());
  const now = Date.now();
  if (msg.type === 'session.ready') {
    readyInfo = msg.providers;
    sessionReady(msg);
  } else if (msg.type === 'caption.partial' || msg.type === 'caption.final') {
    events.push({ at: now, msg });
    const c = msg.caption;
    const kind = msg.type === 'caption.final' ? 'FINAL  ' : 'partial';
    console.log(
      `${kind} +${firstChunkAt ? now - firstChunkAt : 0}ms conf=${c.confidence.toFixed(2)} es="${c.sourceText}" en="${c.targetText}"`,
    );
  } else if (msg.type === 'error') {
    console.error(`server error: ${msg.code} ${msg.message}`);
  }
});

ws.send(
  JSON.stringify({
    type: 'session.start',
    mode: 'listen',
    sourceLang: 'es',
    targetLang: 'en',
    audio: { encoding: 'pcm16', sampleRate: SAMPLE_RATE, channels: 1 },
  }),
);
await done;
console.log(`session ready: asr=${readyInfo.asr} mt=${readyInfo.mt}`);

const bytesPerChunk = (SAMPLE_RATE * 2 * CHUNK_MS) / 1000;
firstChunkAt = Date.now();
for (let off = 0; off < audio.length; off += bytesPerChunk) {
  ws.send(audio.subarray(off, off + bytesPerChunk));
  await new Promise((r) => setTimeout(r, CHUNK_MS));
}
lastChunkAt = Date.now();
// Half a second of trailing silence helps endpointing close the utterance.
const silence = Buffer.alloc(bytesPerChunk);
for (let i = 0; i < 8; i++) {
  ws.send(silence);
  await new Promise((r) => setTimeout(r, CHUNK_MS));
}

// Give endpointing a chance to close the utterance naturally…
await new Promise((r) => setTimeout(r, 3500));
// …then session.stop → the API sends CloseStream and Deepgram flushes any
// pending final. Keep the socket open to receive it (the web client does too).
ws.send(JSON.stringify({ type: 'session.stop' }));
await new Promise((r) => setTimeout(r, 2000));
ws.close();

const partials = events.filter((e) => e.msg.type === 'caption.partial');
const finals = events.filter((e) => e.msg.type === 'caption.final');
const firstPartial = partials[0];
const lastFinal = finals.at(-1);

console.log('\n— report —');
if (firstPartial) {
  console.log(`first partial: +${firstPartial.at - firstChunkAt} ms after audio start`);
}
if (lastFinal) {
  console.log(`final caption: +${lastFinal.at - lastChunkAt} ms after audio end`);
  console.log(`final es: "${lastFinal.msg.caption.sourceText}"`);
  console.log(`final en: "${lastFinal.msg.caption.targetText}"`);
}
const ok =
  firstPartial &&
  lastFinal &&
  lastFinal.msg.caption.targetText.length > 0 &&
  lastFinal.msg.caption.targetText !== lastFinal.msg.caption.sourceText;
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
