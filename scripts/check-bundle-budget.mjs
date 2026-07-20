import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const ASSETS = join(DIST, 'assets');

/** Gzip budget for synchronously loaded JS (entry + modulepreload vendor chunks). */
const INITIAL_GZIP_BUDGET_KB = 159;

function gzipSize(bytes) {
  return gzipSync(bytes).length;
}

async function main() {
  const indexHtml = await readFile(join(DIST, 'index.html'), 'utf8');
  const initialScripts = new Set();

  for (const match of indexHtml.matchAll(/\b(?:src|href)="(\/assets\/[^"]+\.js)"/g)) {
    initialScripts.add(match[1]);
  }

  if (initialScripts.size === 0) {
    console.error('check-bundle-budget: no initial JS chunks found in dist/index.html');
    process.exit(1);
  }

  let initialRaw = 0;
  let initialGzip = 0;
  const rows = [];

  for (const href of [...initialScripts].sort()) {
    const filePath = join(DIST, href.slice(1));
    const raw = await readFile(filePath);
    const gz = gzipSize(raw);
    initialRaw += raw.length;
    initialGzip += gz;
    rows.push({ name: href.split('/').pop(), raw: raw.length, gzip: gz });
  }

  const assetFiles = (await readdir(ASSETS)).filter((name) => name.endsWith('.js'));
  const lazyRows = [];

  for (const name of assetFiles.sort()) {
    const href = `/assets/${name}`;
    if (initialScripts.has(href)) continue;
    const raw = await readFile(join(ASSETS, name));
    lazyRows.push({ name, raw: raw.length, gzip: gzipSize(raw) });
  }

  const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;
  const initialGzipKb = initialGzip / 1024;

  console.log('\n--- Initial JS (entry + preloaded vendors) ---');
  for (const row of rows) {
    console.log(`  ${row.name}: ${fmt(row.raw)} raw, ${fmt(row.gzip)} gzip`);
  }
  console.log(`  Total: ${fmt(initialRaw)} raw, ${fmt(initialGzip)} gzip`);
  console.log(`  Budget: ${INITIAL_GZIP_BUDGET_KB} KB gzip\n`);

  if (lazyRows.length > 0) {
    console.log('--- Lazy / on-demand chunks ---');
    for (const row of lazyRows) {
      console.log(`  ${row.name}: ${fmt(row.raw)} raw, ${fmt(row.gzip)} gzip`);
    }
    console.log('');
  }

  if (initialGzipKb > INITIAL_GZIP_BUDGET_KB) {
    console.error(
      `ERROR: initial JS gzip (${initialGzipKb.toFixed(1)} KB) exceeds ${INITIAL_GZIP_BUDGET_KB} KB budget`
    );
    process.exit(1);
  }

  console.log('Bundle budget: OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
