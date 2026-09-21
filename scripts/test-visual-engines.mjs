import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StarfieldEngine } from '../src/lib/visuals/engines/starfieldEngine.ts';
import { ParticleNetworkEngine } from '../src/lib/visuals/engines/particleNetworkEngine.ts';
import { MatrixRainEngine } from '../src/lib/visuals/engines/matrixRainEngine.ts';
import { CursorTrailEngine } from '../src/lib/visuals/engines/cursorTrailEngine.ts';

// Deterministic tick tests for the pure engine math behind every ambient
// visual layer — the thing a future backend (WASM, WebGPU 2D, …) has to
// match pixel-for-pixel logic, not just implement the same interface. These
// fail loudly if someone "simplifies" a wrap/decay/step rule while touching
// an engine, independent of `test-visual-worker-protocol.mjs`, which only
// covers the worker *protocol* (init/transfer/density/idle ticks) with a
// fake engine that records calls rather than running the real math.

function createFakeCtx() {
  const calls = [];
  return {
    calls,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    globalAlpha: 1,
    beginPath: () => calls.push(['beginPath']),
    arc: (x, y, r, a0, a1) => calls.push(['arc', x, y, r, a0, a1]),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    moveTo: (x, y) => calls.push(['moveTo', x, y]),
    lineTo: (x, y) => calls.push(['lineTo', x, y]),
    clearRect: (x, y, w, h) => calls.push(['clearRect', x, y, w, h]),
    fillRect: (x, y, w, h) => calls.push(['fillRect', x, y, w, h]),
    fillText: (text, x, y) => calls.push(['fillText', text, x, y]),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  };
}

const OPTS = { accentRgb: '34, 211, 238', theme: 'cyan', density: 1 };

describe('StarfieldEngine', () => {
  it('seeds star count proportional to density, rounded', () => {
    const engine = new StarfieldEngine();
    engine.init(createFakeCtx(), 800, 600, { ...OPTS, density: 1 });
    assert.equal(engine.stars.length, 75); // STAR_BASE_COUNT

    engine.setDensity(2);
    assert.equal(engine.stars.length, 150);

    engine.setDensity(0.5);
    assert.equal(engine.stars.length, 38); // Math.round(75 * 0.5)

    engine.setDensity(0);
    assert.equal(engine.stars.length, 0);
  });

  it('reseeds star count on resize without changing density', () => {
    const engine = new StarfieldEngine();
    engine.init(createFakeCtx(), 800, 600, { ...OPTS, density: 1 });
    engine.resize(400, 300);
    assert.equal(engine.stars.length, 75);
  });
});

describe('ParticleNetworkEngine', () => {
  it('scales seeded particle count with density and canvas area', () => {
    const engine = new ParticleNetworkEngine();
    // area / 14500 = 20000 / 14500 -> base 1 particle.
    engine.init(createFakeCtx(), 200, 100, { ...OPTS, density: 1 });
    assert.equal(engine.particles.length, 1);

    engine.setDensity(2);
    assert.equal(engine.particles.length, 2);
  });

  it('bounces off the boundary (flips velocity) instead of wrapping through it', () => {
    const engine = new ParticleNetworkEngine();
    engine.init(createFakeCtx(), 200, 100, { ...OPTS, density: 1 });
    const particle = engine.particles[0];
    particle.x = -5;
    particle.vx = -1;
    particle.y = 50;
    particle.vy = 0;

    engine.tick(0);

    // update() applies velocity before testing the bound, so position moves
    // one more step out-of-range, then the *next* update reverses direction.
    assert.equal(particle.x, -6);
    assert.equal(particle.vx, 1);

    engine.tick(16);
    assert.equal(particle.x, -5);
  });
});

describe('MatrixRainEngine', () => {
  it('steps every column glyph by one row per throttled tick', () => {
    const engine = new MatrixRainEngine();
    // columns = floor(32 / FONT_SIZE=16) = 2; tall canvas so the random
    // reset-to-0 branch (drop*FONT_SIZE > height) never triggers.
    engine.init(createFakeCtx(), 32, 4000, { ...OPTS, theme: 'cyan' });
    assert.deepEqual(engine.drops, [1, 1]);

    engine.tick(40); // past FRAME_INTERVAL (1000/30 ≈ 33.3ms) from lastTime 0
    assert.deepEqual(engine.drops, [2, 2]);
  });

  it('throttles to ~30fps: a tick inside the frame interval is a no-op', () => {
    const engine = new MatrixRainEngine();
    engine.init(createFakeCtx(), 32, 4000, { ...OPTS, theme: 'cyan' });

    engine.tick(40);
    assert.deepEqual(engine.drops, [2, 2]);

    engine.tick(50); // only 10ms later — under FRAME_INTERVAL
    assert.deepEqual(engine.drops, [2, 2]);

    engine.tick(80); // 40ms after the last committed tick — over FRAME_INTERVAL
    assert.deepEqual(engine.drops, [3, 3]);
  });
});

describe('CursorTrailEngine', () => {
  it('spawns one particle per distinct pointer position and decays life per tick', () => {
    const engine = new CursorTrailEngine();
    engine.init(createFakeCtx(), 800, 600, OPTS);

    engine.setPointer(10, 10);
    assert.equal(engine.particles.length, 1);
    assert.equal(engine.particles[0].life, 1.0);

    // Same position again — no new particle spawned.
    engine.setPointer(10, 10);
    assert.equal(engine.particles.length, 1);

    engine.tick(0);
    assert.equal(engine.particles.length, 1);
    assert.ok(Math.abs(engine.particles[0].life - 0.98) < 1e-9);
  });

  it('caps live particle count so a fast pointer burst cannot grow it unbounded', () => {
    const engine = new CursorTrailEngine();
    engine.init(createFakeCtx(), 800, 600, OPTS);

    for (let i = 0; i < 200; i++) engine.setPointer(i, i);

    assert.equal(engine.particles.length, 60); // MAX_PARTICLES
    // The cap drops the oldest points, keeping the most recent ones.
    assert.equal(engine.particles.at(-1).x, 199);
  });

  it('parks itself (tick returns false) once every particle has fully decayed', () => {
    const engine = new CursorTrailEngine();
    engine.init(createFakeCtx(), 800, 600, OPTS);
    engine.setPointer(5, 5);

    let demandsFrame = true;
    for (let i = 0; i < 60 && demandsFrame; i++) {
      demandsFrame = engine.tick(i * 16) !== false;
    }

    assert.equal(demandsFrame, false);
    assert.equal(engine.particles.length, 0);
  });
});
