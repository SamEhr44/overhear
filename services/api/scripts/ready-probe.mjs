// Prints the providers reported by session.ready — quick deploy sanity check.
import WebSocket from 'ws';

const ws = new WebSocket(process.argv[2] ?? 'wss://overhear-api.fly.dev/ws/listen');
const timeout = setTimeout(() => {
  console.error('timeout');
  process.exit(1);
}, 15000);
ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'session.start',
      mode: 'listen',
      sourceLang: 'es',
      targetLang: 'en',
      subMode: 'announcements',
      audio: { encoding: 'pcm16', sampleRate: 16000, channels: 1 },
    }),
  );
});
ws.on('message', (raw, isBinary) => {
  if (isBinary) return;
  const msg = JSON.parse(raw.toString());
  if (msg.type === 'session.ready') {
    console.log(`asr=${msg.providers.asr} mt=${msg.providers.mt}`);
    clearTimeout(timeout);
    ws.send(JSON.stringify({ type: 'session.stop' }));
    ws.close();
    process.exit(0);
  }
});
ws.on('error', (e) => {
  console.error(e.message);
  process.exit(1);
});
