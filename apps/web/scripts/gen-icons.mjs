// Generates PWA icons from the brand mark (accent square + EQ bars).
// Run once: pnpm --filter @overhear/web gen:icons  (outputs are committed).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// --- oklch(0.5 0.16 258) → sRGB hex (the --color-accent token) ---------------
function oklchToHex(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const srgb = lin.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  });
  return `#${srgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const ACCENT = oklchToHex(0.5, 0.16, 258);

function markSvg({ size, radius, scale }) {
  // Four EQ bars centered in a rounded accent square; `scale` shrinks the
  // bars into the maskable safe zone when needed.
  const bars = [
    { x: 148, y: 186, h: 140 },
    { x: 208, y: 146, h: 220 },
    { x: 268, y: 166, h: 180 },
    { x: 328, y: 196, h: 120 },
  ];
  const s = (n) => 256 + (n - 256) * scale;
  const rects = bars
    .map(
      (b) =>
        `<rect x="${s(b.x)}" y="${s(b.y)}" width="${36 * scale}" height="${b.h * scale}" rx="${14 * scale}" fill="#ffffff"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
    <rect width="512" height="512" rx="${radius}" fill="${ACCENT}"/>${rects}</svg>`;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'public', 'icons');
await mkdir(outDir, { recursive: true });

const jobs = [
  { file: 'icon-192.png', size: 192, radius: 120, scale: 1 },
  { file: 'icon-512.png', size: 512, radius: 120, scale: 1 },
  // Maskable: full-bleed background, mark scaled into the 80% safe zone.
  { file: 'maskable-512.png', size: 512, radius: 0, scale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, radius: 0, scale: 0.9 },
];

for (const job of jobs) {
  const png = await sharp(Buffer.from(markSvg(job))).resize(job.size, job.size).png().toBuffer();
  await writeFile(path.join(outDir, job.file), png);
  console.log(`wrote icons/${job.file}`);
}
console.log(`accent = ${ACCENT}`);
