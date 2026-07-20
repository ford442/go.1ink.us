import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST_INDEX = join(ROOT, 'dist', 'index.html');

const SOURCE_PATHS = [
  join(ROOT, 'src'),
  join(ROOT, 'public'),
  join(ROOT, 'index.html'),
  join(ROOT, 'vite.config.js'),
  join(ROOT, 'package.json'),
  join(ROOT, 'package-lock.json'),
];

async function walkNewestMtime(dir) {
  let newest = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      newest = Math.max(newest, await walkNewestMtime(fullPath));
    } else {
      const { mtimeMs } = await stat(fullPath);
      newest = Math.max(newest, mtimeMs);
    }
  }
  return newest;
}

async function newestSourceMtime() {
  let newest = 0;
  for (const path of SOURCE_PATHS) {
    try {
      const info = await stat(path);
      if (info.isDirectory()) {
        newest = Math.max(newest, await walkNewestMtime(path));
      } else {
        newest = Math.max(newest, info.mtimeMs);
      }
    } catch {
      // public/ may be empty of sources after image optimization — skip missing paths
    }
  }
  return newest;
}

async function main() {
  let distStat;
  try {
    distStat = await stat(DIST_INDEX);
  } catch {
    console.error(`ERROR: ${DIST_INDEX} is missing. Run npm run build first.`);
    process.exit(1);
  }

  const sourceMtime = await newestSourceMtime();
  if (distStat.mtimeMs + 1000 < sourceMtime) {
    console.error('ERROR: dist/ is older than source files.');
    console.error('Run npm run build before deploying.');
    process.exit(1);
  }

  console.log('dist/ freshness check: OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
