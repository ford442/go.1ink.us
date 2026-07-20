import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SOURCE = join(ROOT, 'assets-source', 'go1inkus.png');
const OUT_DIR = join(ROOT, 'public', 'pwa');

const SIZES = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

async function renderIcon({ name, size, maskable = false }) {
  const outPath = join(OUT_DIR, name);
  let pipeline = sharp(SOURCE).resize(size, size, {
    fit: 'contain',
    background: { r: 15, g: 23, b: 42, alpha: 1 },
  });

  if (maskable) {
    const inset = Math.round(size * 0.1);
    pipeline = sharp(SOURCE).resize(size - inset * 2, size - inset * 2, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }).extend({
      top: inset,
      bottom: inset,
      left: inset,
      right: inset,
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    });
  }

  await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`  ${name}: ${size}x${size}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('PWA icons from go1inkus.png');
  for (const spec of SIZES) {
    await renderIcon(spec);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
