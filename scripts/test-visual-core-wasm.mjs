import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  REQUIRED_VISUAL_CORE_FUNCTIONS,
  VC_EFFECT,
  VC_MATRIX_GLYPH_COUNT,
  VC_MAX_INSTANCE_POINTS,
  VC_OP,
  VC_OP_WORDS,
  VISUAL_CORE_ABI_VERSION,
} from '../src/lib/visuals/wasm/visualCoreAbi.ts';
import { createVisualCore, instantiateVisualCore, loadVisualCore } from '../src/lib/visuals/wasm/loadVisualCore.ts';
import { ColorCache, replayDrawList } from '../src/lib/visuals/wasm/drawList.ts';
import { parseRgb } from '../src/lib/visuals/wasm/WasmEngine.ts';
import { MATRIX_GLYPHS, MatrixRainEngine, matrixThemeColor } from '../src/lib/visuals/engines/matrixRainEngine.ts';
import { ParticleNetworkEngine } from '../src/lib/visuals/engines/particleNetworkEngine.ts';
import { StarfieldEngine } from '../src/lib/visuals/engines/starfieldEngine.ts';
import { VisualWorkerRuntime } from '../src/lib/visuals/worker/visualWorkerRuntime.ts';

// Runs the *prebuilt* src/lib/visuals/wasm/visual-core.wasm (no Emscripten
// needed), through the same adapter the worker uses, against a recording
// Canvas2D. Covers: ABI drift between visual_core.h and visualCoreAbi.ts,
// the C++ math each port has to preserve (counts, bounds, link radius, the
// 30 fps matrix throttle, shooting-star timing), structural parity with the
// JS engines, and the loader's fallbacks. If the C++ changes, rebuild with
// `npm run build:wasm` before running this.

const ROOT = join(import.meta.dirname, '..');
const WASM_PATH = join(ROOT, 'src/lib/visuals/wasm/visual-core.wasm');
const HEADER = readFileSync(join(ROOT, 'packages/visual-core/include/visual_core.h'), 'utf8');
const CMAKE = readFileSync(join(ROOT, 'packages/visual-core/CMakeLists.txt'), 'utf8');
const WASM_BYTES = readFileSync(WASM_PATH);
const ACCENT = '34, 211, 238';
const OPTS = { accentRgb: ACCENT, theme: 'cyan', density: 1 };

function headerDefine(name) {
  const match = new RegExp(`#define\\s+${name}\\s+(\\d+)u?\\b`).exec(HEADER);
  assert.ok(match, `visual_core.h defines ${name}`);
  return Number(match[1]);
}

function createRecordingCtx() {
  const calls = [];
  const ctx = {
    calls,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    globalAlpha: 1,
    beginPath: () => {},
    // Both the JS engines and the replayer set fillStyle between arc() and
    // fill(), so style and alpha are captured when the path is filled.
    arc: (x, y, r) => calls.push({ op: 'arc', x, y, r, fill: null, alpha: null }),
    fill: () => {
      const last = calls.at(-1);
      if (last?.op === 'arc') Object.assign(last, { fill: ctx.fillStyle, alpha: ctx.globalAlpha });
    },
    stroke: () => calls.push({ op: 'stroke', style: ctx.strokeStyle, alpha: ctx.globalAlpha, width: ctx.lineWidth, path: ctx._path }),
    moveTo: (x, y) => { ctx._path = [x, y]; },
    lineTo: (x, y) => { ctx._path = [...ctx._path, x, y]; },
    clearRect: (x, y, w, h) => calls.push({ op: 'clearRect', x, y, w, h }),
    fillRect: (x, y, w, h) => calls.push({ op: 'fillRect', x, y, w, h, fill: ctx.fillStyle, alpha: ctx.globalAlpha }),
    fillText: (text, x, y) => calls.push({ op: 'fillText', text, x, y, fill: ctx.fillStyle, alpha: ctx.globalAlpha, font: ctx.font }),
    createLinearGradient: (x0, y0, x1, y1) => {
      const stops = [];
      return { kind: 'gradient', coords: [x0, y0, x1, y1], stops, addColorStop: (o, c) => stops.push([o, c]) };
    },
  };
  return ctx;
}

const arcs = (ctx) => ctx.calls.filter((c) => c.op === 'arc');
const strokes = (ctx, width) => ctx.calls.filter((c) => c.op === 'stroke' && (width === undefined || Math.abs(c.width - width) < 1e-6));
const alphaOf = (css) => Number(/rgba\([^)]*,\s*([\d.]+)\)$/.exec(css)[1]);

async function core() {
  return instantiateVisualCore(WASM_BYTES);
}

async function wasmEngine(effect, width, height, options = OPTS) {
  const engine = (await core()).createEngine(effect);
  assert.ok(engine, `core implements ${effect}`);
  const ctx = createRecordingCtx();
  engine.init(ctx, width, height, options);
  return { engine, ctx };
}

describe('visual core ABI', () => {
  it('visualCoreAbi.ts mirrors every constant in visual_core.h', () => {
    assert.equal(VISUAL_CORE_ABI_VERSION, headerDefine('VC_ABI_VERSION'));
    assert.equal(VC_EFFECT.particleNetwork, headerDefine('VC_EFFECT_PARTICLE_NETWORK'));
    assert.equal(VC_EFFECT.starfield, headerDefine('VC_EFFECT_STARFIELD'));
    assert.equal(VC_EFFECT.matrixRain, headerDefine('VC_EFFECT_MATRIX_RAIN'));
    for (const [name, value] of Object.entries(VC_OP)) assert.equal(value, headerDefine(`VC_OP_${name}`), name);
    assert.equal(VC_MATRIX_GLYPH_COUNT, headerDefine('VC_MATRIX_GLYPH_COUNT'));
    assert.equal(VC_MAX_INSTANCE_POINTS, headerDefine('VC_MAX_INSTANCE_POINTS'));
  });

  it('record sizes match the layouts documented in visual_core.h', () => {
    for (const [name, op] of Object.entries(VC_OP)) {
      const doc = new RegExp(`\\*\\s+${name}\\b[^\\n]*\\((\\d+) words`).exec(HEADER);
      assert.ok(doc, `visual_core.h documents ${name}`);
      assert.equal(VC_OP_WORDS[op], Number(doc[1]), name);
    }
  });

  it('the glyph table the core indexes into is the one the JS engine draws from', () => {
    assert.equal(MATRIX_GLYPHS.length, VC_MATRIX_GLYPH_COUNT);
  });

  it('CMake exports exactly the functions the adapter requires', () => {
    const block = /set\(VISUAL_CORE_EXPORTS([\s\S]*?)\)/.exec(CMAKE)[1];
    const exported = block.split(/\s+/).filter(Boolean).map((name) => name.replace(/^_/, ''));
    assert.deepEqual([...exported].sort(), [...REQUIRED_VISUAL_CORE_FUNCTIONS].sort());
  });

  it('the prebuilt module imports nothing but the memory-growth hook, and exports the C API', () => {
    const module = new WebAssembly.Module(WASM_BYTES);
    assert.deepEqual(
      WebAssembly.Module.imports(module).map((i) => `${i.module}.${i.name}`),
      ['env.emscripten_notify_memory_growth'],
    );
    const exports = new Set(WebAssembly.Module.exports(module).map((e) => e.name));
    for (const name of [...REQUIRED_VISUAL_CORE_FUNCTIONS, 'memory']) assert.ok(exports.has(name), name);
  });
});

describe('visual core loader', () => {
  it('returns null for effects the core does not implement', async () => {
    const visualCore = await core();
    assert.equal(visualCore.createEngine('cursor'), null);
    assert.equal(visualCore.createEngine('cursorTrail'), null);
  });

  it('rejects a module whose ABI version does not match the adapter', async () => {
    const { instance } = await WebAssembly.instantiate(WASM_BYTES, { env: { emscripten_notify_memory_growth: () => {} } });
    const exports = { ...instance.exports, vc_abi_version: () => VISUAL_CORE_ABI_VERSION + 1 };
    assert.throws(() => createVisualCore({ exports }), /ABI/);
  });

  it('rejects a module missing part of the C API', async () => {
    const { instance } = await WebAssembly.instantiate(WASM_BYTES, { env: { emscripten_notify_memory_growth: () => {} } });
    const { vc_tick: _omitted, ...exports } = instance.exports;
    assert.throws(() => createVisualCore({ exports }), /missing export vc_tick/);
  });

  it('streams with the right MIME type, and falls back to an ArrayBuffer compile without it', async () => {
    const serve = (type) => async () => new Response(WASM_BYTES, { headers: { 'content-type': type } });
    for (const type of ['application/wasm', 'application/octet-stream']) {
      const visualCore = await loadVisualCore('https://example.test/visual-core.wasm', serve(type));
      assert.ok(visualCore.createEngine('starfield'), type);
    }
  });

  it('fails loudly on an HTTP error rather than compiling an error page', async () => {
    const notFound = async () => new Response('nope', { status: 404 });
    await assert.rejects(loadVisualCore('https://example.test/visual-core.wasm', notFound), /HTTP 404/);
  });

  it('parses the accent triplet the CSS custom property holds', () => {
    assert.deepEqual(parseRgb('34, 211, 238'), [34, 211, 238]);
    assert.deepEqual(parseRgb(' 1 2 300 '), [1, 2, 255]);
    assert.equal(parseRgb(''), null);
    assert.equal(parseRgb('red'), null);
  });
});

describe('WASM particle network', () => {
  const LINK = 118;
  const POINTER = 155;

  it('seeds the same particle count as the JS engine at every density', async () => {
    for (const [width, height, density] of [[800, 600, 1], [1920, 1080, 1], [1920, 1080, 2], [300, 200, 1], [0, 0, 1]]) {
      const js = new ParticleNetworkEngine();
      js.init(createRecordingCtx(), width, height, { ...OPTS, density });
      const { engine, ctx } = await wasmEngine('particleNetwork', width, height, { ...OPTS, density });
      engine.tick(16);
      assert.equal(arcs(ctx).length, js.particles.length, `${width}x${height} @${density}`);
    }
  });

  it('links exactly the pairs within the link radius (vs. an O(n^2) brute force)', async () => {
    const { engine, ctx } = await wasmEngine('particleNetwork', 1280, 720, { ...OPTS, density: 2 });
    for (let frame = 0; frame < 30; frame++) {
      ctx.calls.length = 0;
      engine.tick(frame * 16);
      const points = arcs(ctx).map((a) => [a.x, a.y]);
      const key = (x1, y1, x2, y2) => [x1, y1, x2, y2].map((v) => v.toFixed(3)).join(',');
      const linked = new Set();
      for (const s of strokes(ctx, 0.6)) {
        const [x1, y1, x2, y2] = s.path;
        assert.ok(Math.hypot(x1 - x2, y1 - y2) < LINK, 'no link longer than the radius');
        assert.ok(!linked.has(key(x1, y1, x2, y2)) && !linked.has(key(x2, y2, x1, y1)), 'each pair drawn once');
        linked.add(key(x1, y1, x2, y2));
      }
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const [x1, y1] = points[i];
          const [x2, y2] = points[j];
          // Links within ~0.8px of the radius fade to alpha 0 and are culled; anything clearly inside must be drawn.
          if (Math.hypot(x1 - x2, y1 - y2) < LINK - 1) {
            assert.ok(linked.has(key(x1, y1, x2, y2)) || linked.has(key(x2, y2, x1, y1)), `pair ${i},${j} linked`);
          }
        }
      }
    }
  });

  it('fades link alpha with distance on the JS engine\'s curve, in the accent colour', async () => {
    const { engine, ctx } = await wasmEngine('particleNetwork', 1280, 720);
    engine.tick(16);
    for (const s of strokes(ctx, 0.6)) {
      const [x1, y1, x2, y2] = s.path;
      const expected = 0.28 * (1 - Math.hypot(x1 - x2, y1 - y2) / LINK);
      assert.ok(Math.abs(s.alpha - expected) <= 0.5 / 255 + 1e-6);
      assert.equal(s.style, 'rgb(34, 211, 238)');
    }
    for (const a of arcs(ctx)) {
      assert.equal(a.fill, 'rgb(34, 211, 238)');
      assert.equal(a.alpha, 140 / 255); // 0.55, quantized the way the canvas stores it
    }
  });

  it('draws pointer links only within the pointer radius, and none once the pointer leaves', async () => {
    const { engine, ctx } = await wasmEngine('particleNetwork', 1280, 720, { ...OPTS, density: 2 });
    engine.setPointer(640, 360);
    engine.tick(16);
    const pointerLinks = strokes(ctx, 1.1);
    assert.ok(pointerLinks.length > 0);
    for (const s of pointerLinks) {
      const [x1, y1, x2, y2] = s.path;
      assert.deepEqual([x2, y2], [640, 360]);
      assert.ok(Math.hypot(x1 - 640, y1 - 360) < POINTER);
    }
    ctx.calls.length = 0;
    engine.setPointer(null, null);
    engine.tick(32);
    assert.equal(strokes(ctx, 1.1).length, 0);
  });

  it('keeps particles bouncing inside the canvas over a long run', async () => {
    const { engine, ctx } = await wasmEngine('particleNetwork', 400, 300, { ...OPTS, density: 2 });
    for (let frame = 0; frame < 2000; frame++) {
      ctx.calls.length = 0;
      engine.tick(frame * 16);
    }
    // One frame past an edge is allowed (the bounce flips velocity after the move), same as JS; max speed is 1.5px.
    for (const a of arcs(ctx)) {
      assert.ok(a.x >= -1.5 && a.x <= 401.5 && a.y >= -1.5 && a.y <= 301.5, `${a.x},${a.y}`);
    }
  });

  it('reseeds on density change (God Mode) and caps the count, growing memory as needed', async () => {
    const { engine, ctx } = await wasmEngine('particleNetwork', 1920, 1080);
    engine.setDensity(100);
    engine.tick(16);
    assert.equal(arcs(ctx).length, VC_MAX_INSTANCE_POINTS);
    // Thousands of overlapping particles outgrow the 1 MB initial memory; the views must follow the new buffer.
    assert.ok(strokes(ctx, 0.6).length > 10000);
  });

  it('restyles to a new accent', async () => {
    const { engine, ctx } = await wasmEngine('particleNetwork', 800, 600);
    engine.setTheme('217, 70, 239', 'purple');
    engine.tick(16);
    assert.ok(arcs(ctx).every((a) => a.fill === 'rgb(217, 70, 239)'));
  });
});

describe('WASM starfield', () => {
  it('seeds 75 stars per unit density, like the JS engine', async () => {
    for (const density of [1, 2, 0.5, 0]) {
      const js = new StarfieldEngine();
      js.init(createRecordingCtx(), 800, 600, { ...OPTS, density });
      const { engine, ctx } = await wasmEngine('starfield', 800, 600, { ...OPTS, density });
      engine.tick(16);
      assert.equal(arcs(ctx).length, js.stars.length, `density ${density}`);
    }
  });

  it('twinkles white stars inside the JS alpha and radius ranges', async () => {
    const { engine, ctx } = await wasmEngine('starfield', 800, 600);
    for (let t = 0; t < 6000; t += 250) engine.tick(t);
    for (const a of arcs(ctx)) {
      assert.equal(a.fill, 'rgb(255, 255, 255)');
      assert.ok(a.alpha >= 0.3 - 0.003 && a.alpha <= 1);
      assert.ok(a.r >= 0.4 - 1e-6 && a.r <= 1.65 + 1e-6, `radius ${a.r}`);
      assert.ok(a.x >= 0 && a.x <= 800 && a.y >= 0 && a.y <= 600);
    }
  });

  it('fires the first shooting star 5 s after its own first tick, as a white gradient streak', async () => {
    const { engine, ctx } = await wasmEngine('starfield', 800, 600);
    const gradients = [];
    const original = ctx.createLinearGradient;
    ctx.createLinearGradient = (...args) => {
      const g = original(...args);
      gradients.push(g);
      return g;
    };
    const start = 123456; // mount time is arbitrary; the delay counts from the first tick
    engine.tick(start);
    engine.tick(start + 4999);
    assert.equal(gradients.length, 0);
    engine.tick(start + 5500);
    assert.equal(gradients.length, 1);
    const [[o0, c0], [o1, c1], [o2, c2]] = gradients[0].stops;
    assert.deepEqual([o0, o1, o2], [0, 0.5, 1]);
    assert.equal(c0, 'rgba(255, 255, 255, 0)');
    assert.equal(c2, 'rgba(255, 255, 255, 0)');
    // 500 ms into the 1 s travel window: opacity 1 - 0.5.
    assert.ok(Math.abs(alphaOf(c1) - 0.5) <= 1 / 255);
    engine.tick(start + 6100);
    assert.equal(gradients.length, 1, 'gone once the travel window ends');
  });
});

describe('WASM matrix rain', () => {
  it('throttles to 30 fps whatever the tick rate', async () => {
    const { engine, ctx } = await wasmEngine('matrixRain', 800, 600);
    let frames = 0;
    for (let t = 0; t <= 1000; t += 1000 / 120) {
      const before = ctx.calls.length;
      engine.tick(t);
      if (ctx.calls.length > before) frames++;
    }
    const js = new MatrixRainEngine();
    const jsCtx = createRecordingCtx();
    js.init(jsCtx, 800, 600, OPTS);
    let jsFrames = 0;
    for (let t = 0; t <= 1000; t += 1000 / 120) {
      const before = jsCtx.calls.length;
      js.tick(t);
      if (jsCtx.calls.length > before) jsFrames++;
    }
    assert.equal(frames, jsFrames);
    assert.ok(frames > 0 && frames <= 31, `${frames} frames in 1 s`);
  });

  it('draws one glyph per 16px column over a 0.05 black fade, like the JS engine', async () => {
    const { engine, ctx } = await wasmEngine('matrixRain', 800, 600);
    engine.tick(100);
    const [fade, ...glyphs] = ctx.calls;
    assert.deepEqual(fade, { op: 'fillRect', x: 0, y: 0, w: 800, h: 600, fill: 'rgb(0, 0, 0)', alpha: 13 / 255 });
    assert.equal(glyphs.length, Math.floor(800 / 16));
    glyphs.forEach((g, i) => {
      assert.equal(g.x, i * 16);
      assert.equal(g.y, 16); // drops start at row 1
      assert.equal(g.font, '16px monospace');
      assert.ok(MATRIX_GLYPHS.includes(g.text));
    });
  });

  it('uses the whole glyph table and the theme rain colour', async () => {
    const { engine, ctx } = await wasmEngine('matrixRain', 1920, 1080, { ...OPTS, theme: 'purple' });
    const seen = new Set();
    for (let t = 0; t < 3000; t += 34) {
      engine.tick(t);
    }
    for (const c of ctx.calls) if (c.op === 'fillText') seen.add(c.text);
    assert.equal(seen.size, MATRIX_GLYPHS.length);
    const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(matrixThemeColor('purple').slice(i, i + 2), 16));
    assert.ok(ctx.calls.filter((c) => c.op === 'fillText').every((c) => c.fill === `rgb(${r}, ${g}, ${b})` && c.alpha === 1));
  });

  it('resets columns that fall off the bottom, and only those', async () => {
    const { engine, ctx } = await wasmEngine('matrixRain', 160, 64);
    let wrapped = false;
    let t = 0;
    for (let frame = 0; frame < 400; frame++) {
      ctx.calls.length = 0;
      engine.tick((t += 34));
      for (const c of ctx.calls) {
        if (c.op !== 'fillText') continue;
        if (c.y === 16 && frame > 10) wrapped = true;
        // A column only restarts after its head passed the bottom edge, so it can't skip rows.
        assert.equal(c.y % 16, 0);
      }
    }
    assert.ok(wrapped, 'some column restarted from the top');
  });
});

describe('draw-list replay', () => {
  it('stops at an unknown opcode or a truncated record instead of misreading memory', () => {
    const words = new Uint32Array([VC_OP.CLEAR_RECT, 0, 0, 0, 0, 999, VC_OP.CLEAR_RECT, 0, 0, 0, 0]);
    const floats = new Float32Array(words.buffer);
    const ctx = createRecordingCtx();
    assert.equal(replayDrawList(ctx, words, floats, 0, words.length, new ColorCache(), MATRIX_GLYPHS), 1);
    assert.equal(replayDrawList(ctx, words, floats, 6, words.length - 1, new ColorCache(), MATRIX_GLYPHS), 0);
  });

  it('formats every 8-bit alpha so it round-trips exactly', () => {
    const cache = new ColorCache();
    for (let a = 0; a < 256; a++) {
      const css = cache.withAlpha(((a << 24) | 0x112233) >>> 0);
      assert.equal(Math.round(alphaOf(css) * 255), a);
    }
    assert.equal(cache.opaque(0x80332211), 'rgb(17, 34, 51)');
  });

  it('leaves globalAlpha at 1, which every engine assumes on entry (and after a swap)', async () => {
    for (const effect of ['particleNetwork', 'starfield', 'matrixRain']) {
      const { engine, ctx } = await wasmEngine(effect, 800, 600);
      engine.setPointer(400, 300);
      for (let t = 0; t < 8000; t += 50) {
        engine.tick(t);
        assert.equal(ctx.globalAlpha, 1, effect);
      }
    }
  });
});

describe('VisualWorkerRuntime + real visual core', () => {
  it('drives a wasm layer end to end: load, engine report, and frames on the layer canvas', async () => {
    const posted = [];
    const ctx = createRecordingCtx();
    const runtime = new VisualWorkerRuntime((m) => posted.push(m), undefined, () => 1, () => {}, core);
    runtime.handleMessage({
      type: 'init',
      payload: {
        layerId: 'p', effect: 'particleNetwork', engine: 'wasm',
        canvas: { width: 0, height: 0, getContext: () => ctx },
        width: 1024, height: 768, accentRgb: ACCENT, theme: 'cyan', density: 1,
      },
    });
    await runtime.wasmSettledForTest();
    runtime.tickForTest(16);

    assert.deepEqual(posted.filter((m) => m.type === 'engine'), [{ type: 'engine', layerId: 'p', engine: 'wasm' }]);
    assert.equal(arcs(ctx).length, Math.min(Math.floor((1024 * 768) / 14500), 110));
    runtime.dispose();
  });
});
