import { spawnSync } from 'node:child_process';
import { serwist } from '@serwist/next/config';

// Dynamic /talk/[pack] routes aren't prerendered, so they need explicit
// precache entries (prerendered routes are picked up automatically).
const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ||
  crypto.randomUUID();

const TALK_PACK_ROUTES = ['general', 'directions', 'restaurant', 'shopping', 'hotel'].map(
  (pack) => ({ url: `/talk/${pack}`, revision }),
);

export default serwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: TALK_PACK_ROUTES,
});
