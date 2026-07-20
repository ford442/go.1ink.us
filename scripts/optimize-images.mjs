import { readdir, rm, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SOURCE_DIR = join(ROOT, 'assets-source');
const OUTPUT_DIR = join(ROOT, 'public', 'images');
const MAX_PUBLIC_BYTES = 6 * 1024 * 1024;

const BRAND_FILES = new Set(['title.png', 'go1inkus.png']);

const PROJECT_WIDTHS = [
  { width: 400, webpQuality: 80, avifQuality: 45 },
  { width: 800, webpQuality: 82, avifQuality: 48 },
  { width: 1200, webpQuality: 85, avifQuality: 50 },
];

const BRAND_CONFIG = {
  'title.png': {
    slug: 'title',
    widths: [
      { width: 352, webpQuality: 85, avifQuality: 50 },
      { width: 704, webpQuality: 85, avifQuality: 50 },
    ],
  },
  'go1inkus.png': {
    slug: 'go1inkus',
    widths: [
      { width: 96, webpQuality: 82, avifQuality: 48 },
      { width: 192, webpQuality: 82, avifQuality: 48 },
    ],
  },
};

async function getDirSize(dir) {
  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await getDirSize(fullPath);
    } else {
      const { size } = await stat(fullPath);
      total += size;
    }
  }
  return total;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function generateVariant(inputPath, outputPath, width, webpQuality, avifQuality) {
  const pipeline = sharp(inputPath)
    .rotate()
    .resize({ width, fit: 'inside', withoutEnlargement: true });

  const webpPath = `${outputPath}.webp`;
  const avifPath = `${outputPath}.avif`;

  await pipeline.clone().webp({ quality: webpQuality }).toFile(webpPath);
  await pipeline.clone().avif({ quality: avifQuality }).toFile(avifPath);

  const [webpStat, avifStat] = await Promise.all([stat(webpPath), stat(avifPath)]);
  return { webpBytes: webpStat.size, avifBytes: avifStat.size };
}

async function processImage(inputPath, outputSubdir, slug, widths) {
  const sourceStat = await stat(inputPath);
  let outputBytes = 0;

  for (const { width, webpQuality, avifQuality } of widths) {
    const outputBase = join(OUTPUT_DIR, outputSubdir, `${slug}-${width}`);
    const { webpBytes, avifBytes } = await generateVariant(
      inputPath,
      outputBase,
      width,
      webpQuality,
      avifQuality
    );
    outputBytes += webpBytes + avifBytes;
    console.log(
      `  ${slug}-${width}: webp ${formatBytes(webpBytes)}, avif ${formatBytes(avifBytes)}`
    );
  }

  console.log(
    `  ${slug}: ${formatBytes(sourceStat.size)} -> ${formatBytes(outputBytes)} (${widths.length * 2} files)`
  );
  return { sourceBytes: sourceStat.size, outputBytes };
}

async function main() {
  await rm(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  await mkdir(join(OUTPUT_DIR, 'projects'), { recursive: true });
  await mkdir(join(OUTPUT_DIR, 'brand'), { recursive: true });

  const files = (await readdir(SOURCE_DIR))
    .filter((name) => extname(name).toLowerCase() === '.png')
    .sort();

  if (files.length === 0) {
    console.error('No PNG files found in assets-source/');
    process.exit(1);
  }

  let totalSource = 0;
  let totalOutput = 0;

  for (const file of files) {
    const inputPath = join(SOURCE_DIR, file);
    const slug = basename(file, extname(file));

    if (BRAND_FILES.has(file)) {
      const config = BRAND_CONFIG[file];
      console.log(`Brand: ${file}`);
      const result = await processImage(inputPath, 'brand', config.slug, config.widths);
      totalSource += result.sourceBytes;
      totalOutput += result.outputBytes;
      continue;
    }

    console.log(`Project: ${file}`);
    const result = await processImage(inputPath, 'projects', slug, PROJECT_WIDTHS);
    totalSource += result.sourceBytes;
    totalOutput += result.outputBytes;
  }

  const publicBytes = await getDirSize(join(ROOT, 'public'));
  const savings = ((1 - totalOutput / totalSource) * 100).toFixed(1);

  console.log('\n--- Summary ---');
  console.log(`Source PNGs:     ${formatBytes(totalSource)}`);
  console.log(`Generated:       ${formatBytes(totalOutput)} (${savings}% smaller)`);
  console.log(`public/ total:   ${formatBytes(publicBytes)}`);

  if (publicBytes > MAX_PUBLIC_BYTES) {
    console.error(
      `\nERROR: public/ (${formatBytes(publicBytes)}) exceeds ${formatBytes(MAX_PUBLIC_BYTES)} limit`
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
