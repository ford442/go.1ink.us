// JS engine vs. WASM visual core, per-tick cost, under Node.
//
//   npm run bench:visual-core
//
// Both run against a no-op Canvas2D, so this measures exactly the part the
// WASM core changes (simulation + building the draw calls; for WASM also
// the draw-list replay) and none of the rasterization, which is the
// browser's canvas either way. Treat the numbers as relative, and confirm a
// real-world win with the browser profiler on the target device.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { instantiateVisualCore } from '../src/lib/visuals/wasm/loadVisualCore.ts';
import { MatrixRainEngine } from '../src/lib/visuals/engines/matrixRainEngine.ts';
import { ParticleNetworkEngine } from '../src/lib/visuals/engines/particleNetworkEngine.ts';
import { StarfieldEngine } from '../src/lib/visuals/engines/starfieldEngine.ts';

const core = await instantiateVisualCore(readFileSync(join(import.meta.dirname, '../src/lib/visuals/wasm/visual-core.wasm')));

function noopCtx() {
  const noop = () => {};
  return {
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', globalAlpha: 1,
    beginPath: noop, arc: noop, fill: noop, stroke: noop, moveTo: noop, lineTo: noop,
    clearRect: noop, fillRect: noop, fillText: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
  };
}

const CASES = [
  { name: 'particleNetwork 1920x1080', effect: 'particleNetwork', js: ParticleNetworkEngine, w: 1920, h: 1080, density: 1, pointer: true },
  { name: 'particleNetwork 1920x1080 God Mode', effect: 'particleNetwork', js: ParticleNetworkEngine, w: 1920, h: 1080, density: 2, pointer: true },
  { name: 'particleNetwork 3840x2160 God Mode', effect: 'particleNetwork', js: ParticleNetworkEngine, w: 3840, h: 2160, density: 2, pointer: true },
  { name: 'starfield 1920x1080', effect: 'starfield', js: StarfieldEngine, w: 1920, h: 1080, density: 1 },
  { name: 'matrixRain 1920x1080', effect: 'matrixRain', js: MatrixRainEngine, w: 1920, h: 1080, density: 1, frameMs: 34 },
];

const WARMUP = 300;
const FRAMES = 3000;

function bench(engine, c) {
  engine.init(noopCtx(), c.w, c.h, { accentRgb: '34, 211, 238', theme: 'cyan', density: c.density });
  if (c.pointer) engine.setPointer(c.w / 2, c.h / 2);
  const step = c.frameMs ?? 16.667;
  let t = 1000;
  for (let i = 0; i < WARMUP; i++) engine.tick((t += step));
  const start = performance.now();
  for (let i = 0; i < FRAMES; i++) engine.tick((t += step));
  const perTick = (performance.now() - start) / FRAMES;
  engine.dispose();
  return perTick;
}

console.log(`${FRAMES} ticks each after ${WARMUP} warm-up, no-op canvas (ms per tick)\n`);
console.log('case'.padEnd(38), 'JS'.padStart(8), 'WASM'.padStart(8), 'ratio'.padStart(8));
for (const c of CASES) {
  const js = bench(new c.js(), c);
  const wasm = bench(core.createEngine(c.effect), c);
  console.log(c.name.padEnd(38), js.toFixed(4).padStart(8), wasm.toFixed(4).padStart(8), `${(js / wasm).toFixed(2)}x`.padStart(8));
}
