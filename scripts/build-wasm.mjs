// Builds packages/visual-core with Emscripten and refreshes the prebuilt
// src/lib/visuals/wasm/visual-core.wasm that the app (and `npm run build`)
// consume. Only needed after changing the C++: the prebuilt binary is
// committed, so the JS build never requires Emscripten.
//
//   npm run build:wasm
//
// Also leaves packages/visual-core/build/compile_commands.json (and a
// packages/visual-core/compile_commands.json symlink to it) for clangd.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = join(import.meta.dirname, '..');
const PACKAGE = join(ROOT, 'packages/visual-core');
const BUILD = join(PACKAGE, 'build');
const OUTPUT = join(ROOT, 'src/lib/visuals/wasm/visual-core.wasm');
const PINNED = readFileSync(join(PACKAGE, 'EMSDK_VERSION'), 'utf8').trim();

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const probe = spawnSync('emcc', ['--version'], { encoding: 'utf8' });
if (probe.error || probe.status !== 0) {
  console.error(
    [
      'build:wasm: emcc not found. Install and activate the Emscripten SDK first:',
      '',
      '  git clone https://github.com/emscripten-core/emsdk.git',
      `  ./emsdk/emsdk install ${PINNED} && ./emsdk/emsdk activate ${PINNED}`,
      '  source ./emsdk/emsdk_env.sh',
      '',
      'Only needed when changing packages/visual-core: `npm run build` uses the',
      'committed src/lib/visuals/wasm/visual-core.wasm and never needs Emscripten.',
    ].join('\n'),
  );
  process.exit(1);
}

const version = /\b(\d+\.\d+\.\d+)\b/.exec(probe.stdout)?.[1];
if (version !== PINNED) {
  console.warn(
    `build:wasm: emcc ${version ?? '(unknown)'} differs from the pinned ${PINNED} ` +
      '(packages/visual-core/EMSDK_VERSION). The output will not be byte-identical ' +
      "to CI's, so the WASM workflow's freshness check will fail on a commit of it.",
  );
}

// The IDE-only native configure shares this build dir; CMake can't switch an
// existing build tree to a different toolchain, so start that one over.
const cache = join(BUILD, 'CMakeCache.txt');
if (existsSync(cache) && !readFileSync(cache, 'utf8').includes('Emscripten.cmake')) {
  console.log('build:wasm: replacing a native (non-Emscripten) build tree in packages/visual-core/build');
  rmSync(BUILD, { recursive: true, force: true });
}

run('emcmake', ['cmake', '-S', PACKAGE, '-B', BUILD, '-DCMAKE_BUILD_TYPE=Release', '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON']);
run('cmake', ['--build', BUILD]);
copyFileSync(join(BUILD, 'visual_core.wasm'), OUTPUT);

// For tools that look for compile_commands.json beside the sources rather
// than reading .clangd; gitignored, like the build dir it points into.
const link = join(PACKAGE, 'compile_commands.json');
rmSync(link, { force: true });
try {
  symlinkSync(relative(PACKAGE, join(BUILD, 'compile_commands.json')), link);
} catch {
  copyFileSync(join(BUILD, 'compile_commands.json'), link); // e.g. Windows without symlink rights
}

const bytes = readFileSync(OUTPUT);
console.log(
  `\nbuild:wasm: wrote ${relative(ROOT, OUTPUT)} ` +
    `(${(statSync(OUTPUT).size / 1024).toFixed(1)} KB raw, ${(gzipSync(bytes).length / 1024).toFixed(1)} KB gzip)`,
);
