/**
 * Simulates the mobile failure mode from the field: a socket that dies
 * abruptly mid-session, then a fresh connection starting a new session.
 * Asserts the second session still produces captions.
 *
 * DEEPGRAM_API_KEY=... node scripts/flap-check.mjs [wsUrl]
 */
import WebSocket from 'ws';

const WS_URL = process.argv[2] ?? 'ws://localhost:8787/ws/listen';
const DG_KEY = process.env.DEEPGRAM_API_KEY;
const SAMPLE_RATE = 16000;
const CHUNK = (SAMPLE_RATE * 2 * 100) / 1000;

if (!DG_KEY) {
  console.error('DEEPGRAM_API_KEY required');
  process.exit(1);
}

async function synthesize(text) {
  const models = await (
    await fetch('https://api.deepgram.com/v1/models', {
      headers: { Authorization: `Token ${DG_KEY}` },
    })
  ).json();
  const voice = (models.tts ?? []).find((m) =>
    (m.languages ?? []).some((l) => String(l).toLowerCase().startsWith('es')),
  );
  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice.canonical_name ?? voice.name)}&encoding=linear16&sample_rate=${SAMPLE_RATE}&container=none`,
    {
      method: 'POST',
      headers: { Authorization: `Token ${DG_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
  );
  return Buffer.from(await res.arrayBuffer());
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function startSession(ws) {
  return new Promise((resolve) => {
    ws.on('message', function onMsg(raw, isBinary) {
      if (isBinary) return;
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'session.ready') {
        ws.removeListener('message', onMsg);
        resolve(msg);
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
  });
}

const audio = await synthesize('Buenas tardes, ¿me puede ayudar con mi maleta, por favor?');
console.log(`audio ${audio.length} bytes`);

// --- Session 1: stream half the audio, then kill the socket abruptly. ---
const ws1 = await connect();
await startSession(ws1);
console.log('session 1 ready — streaming, then terminating abruptly mid-utterance');
for (let off = 0; off < audio.length / 2; off += CHUNK) {
  ws1.send(audio.subarray(off, off + CHUNK));
  await new Promise((r) => setTimeout(r, 100));
}
ws1.terminate(); // no close frame — like a dead radio
console.log('socket 1 terminated');
await new Promise((r) => setTimeout(r, 1000));

// --- Session 2: fresh socket, full utterance — must caption normally. ---
const ws2 = await connect();
const captions = [];
ws2.on('message', (raw, isBinary) => {
  if (isBinary) return;
  const msg = JSON.parse(raw.toString());
  if (msg.type === 'caption.partial' || msg.type === 'caption.final') {
    captions.push(msg);
    console.log(
      `${msg.type === 'caption.final' ? 'FINAL  ' : 'partial'} es="${msg.caption.sourceText}" en="${msg.caption.targetText}"`,
    );
  } else if (msg.type === 'error') {
    console.error(`server error: ${msg.code}`);
  }
});
await startSession(ws2);
console.log('session 2 ready — streaming full utterance');
for (let off = 0; off < audio.length; off += CHUNK) {
  ws2.send(audio.subarray(off, off + CHUNK));
  await new Promise((r) => setTimeout(r, 100));
}
const silence = Buffer.alloc(CHUNK);
for (let i = 0; i < 8; i++) {
  ws2.send(silence);
  await new Promise((r) => setTimeout(r, 100));
}
await new Promise((r) => setTimeout(r, 2500));
ws2.send(JSON.stringify({ type: 'session.stop' }));
await new Promise((r) => setTimeout(r, 2000));
ws2.close();

const finals = captions.filter((c) => c.type === 'caption.final');
const ok = finals.length > 0 && finals.at(-1).caption.targetText.length > 0;
console.log(ok ? 'PASS — second session captions normally after abrupt drop' : 'FAIL');
process.exit(ok ? 0 : 1);
