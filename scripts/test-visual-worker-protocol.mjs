import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VisualWorkerRuntime } from '../src/lib/visuals/worker/visualWorkerRuntime.ts';
import { VisualWorkerClient } from '../src/lib/visuals/VisualWorkerClient.ts';

// --- Fakes standing in for the browser objects the real protocol crosses ---

function createFakeCtx() {
  return { fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', globalAlpha: 1 };
}

function createFakeCanvas() {
  return { width: 0, height: 0, getContext: () => createFakeCtx(), _isFakeCanvas: true };
}

function createFakeEngineFactory() {
  const engines = new Map();
  const factory = (effect) => {
    const calls = [];
    const engine = {
      calls,
      init: (ctx, width, height, options) => calls.push(['init', ctx, width, height, options]),
      resize: (width, height) => calls.push(['resize', width, height]),
      setPointer: (x, y) => calls.push(['setPointer', x, y]),
      setTheme: (accentRgb, theme) => calls.push(['setTheme', accentRgb, theme]),
      setDensity: (density) => calls.push(['setDensity', density]),
      tick: (time) => calls.push(['tick', time]),
      dispose: () => calls.push(['dispose']),
    };
    engines.set(effect, engine);
    return engine;
  };
  return { factory, engines };
}

function basePayload(overrides = {}) {
  return {
    layerId: 'starfield-1',
    effect: 'starfield',
    canvas: createFakeCanvas(),
    width: 800,
    height: 600,
    accentRgb: '34, 211, 238',
    theme: 'cyan',
    density: 1,
    ...overrides,
  };
}

describe('VisualWorkerRuntime', () => {
  it('creates an engine on init, calls Engine.init, and posts ready', () => {
    const posted = [];
    const { factory, engines } = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime((msg) => posted.push(msg), factory, () => 'noop-handle', () => {});

    const payload = basePayload();
    runtime.handleMessage({ type: 'init', payload });

    const engine = engines.get('starfield');
    assert.equal(engine.calls[0][0], 'init');
    assert.equal(engine.calls[0][2], 800);
    assert.equal(engine.calls[0][3], 600);
    assert.deepEqual(engine.calls[0][4], { accentRgb: '34, 211, 238', theme: 'cyan', density: 1 });
    assert.deepEqual(posted, [{ type: 'ready', layerId: 'starfield-1' }]);
    // The runtime sizes the canvas itself before handing it to the engine.
    assert.equal(payload.canvas.width, 800);
    assert.equal(payload.canvas.height, 600);
  });

  it('posts an error and skips engine creation when the canvas has no 2D context', () => {
    const posted = [];
    const { factory, engines } = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime((msg) => posted.push(msg), factory);

    const payload = basePayload({ canvas: { width: 0, height: 0, getContext: () => null } });
    runtime.handleMessage({ type: 'init', payload });

    assert.equal(engines.size, 0);
    assert.deepEqual(posted, [{ type: 'error', layerId: 'starfield-1', message: '2D context unavailable' }]);
  });

  it('routes resize/setTheme/setPointer/setDensity to the matching layer only', () => {
    const { factory, engines } = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime(() => {}, factory, () => 'noop-handle', () => {});

    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'a', effect: 'starfield' }) });
    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'b', effect: 'matrixRain' }) });

    runtime.handleMessage({ type: 'resize', layerId: 'a', width: 1024, height: 768 });
    runtime.handleMessage({ type: 'setPointer', layerId: 'a', x: 5, y: 6 });
    runtime.handleMessage({ type: 'setTheme', layerId: 'b', accentRgb: '1,2,3', theme: 'purple' });
    runtime.handleMessage({ type: 'setDensity', layerId: 'b', density: 2 });

    const starfield = engines.get('starfield');
    const matrix = engines.get('matrixRain');

    assert.deepEqual(
      starfield.calls.filter((c) => c[0] !== 'init'),
      [['resize', 1024, 768], ['setPointer', 5, 6]],
    );
    assert.deepEqual(
      matrix.calls.filter((c) => c[0] !== 'init'),
      [['setTheme', '1,2,3', 'purple'], ['setDensity', 2]],
    );
  });

  it('ignores messages for an unknown layerId instead of throwing', () => {
    const runtime = new VisualWorkerRuntime(() => {}, createFakeEngineFactory().factory);
    assert.doesNotThrow(() => {
      runtime.handleMessage({ type: 'resize', layerId: 'missing', width: 10, height: 10 });
      runtime.handleMessage({ type: 'setPointer', layerId: 'missing', x: 0, y: 0 });
      runtime.handleMessage({ type: 'setTheme', layerId: 'missing', accentRgb: 'x', theme: 'cyan' });
      runtime.handleMessage({ type: 'setDensity', layerId: 'missing', density: 1 });
      runtime.handleMessage({ type: 'setRunning', layerId: 'missing', running: true });
      runtime.handleMessage({ type: 'dispose', layerId: 'missing' });
    });
  });

  it('only ticks layers whose running flag is true', () => {
    const { factory, engines } = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime(() => {}, factory, () => 'noop-handle', () => {});

    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'a', effect: 'starfield' }) });
    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'b', effect: 'matrixRain' }) });
    runtime.handleMessage({ type: 'setRunning', layerId: 'b', running: false });

    runtime.tickForTest(123);

    assert.ok(engines.get('starfield').calls.some((c) => c[0] === 'tick' && c[1] === 123));
    assert.ok(!engines.get('matrixRain').calls.some((c) => c[0] === 'tick'));
  });

  it('schedules the shared loop only while at least one layer is running', () => {
    const scheduled = [];
    const { factory } = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime(
      () => {},
      factory,
      (cb) => { scheduled.push(cb); return scheduled.length; },
      () => {},
    );

    // init() defaults the layer to running: true, so the loop should have been scheduled once.
    runtime.handleMessage({ type: 'init', payload: basePayload() });
    assert.equal(scheduled.length, 1);
    assert.ok(runtime.isLoopRunningForTest());

    // A second setRunning:true while a frame is already pending must not double-schedule.
    runtime.handleMessage({ type: 'setRunning', layerId: 'starfield-1', running: true });
    assert.equal(scheduled.length, 1);
  });

  it('disposes a layer, calls Engine.dispose, and stops the loop when nothing else is running', () => {
    const cancelled = [];
    const { factory, engines } = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime(() => {}, factory, () => 'handle', (h) => cancelled.push(h));

    runtime.handleMessage({ type: 'init', payload: basePayload() });
    runtime.handleMessage({ type: 'dispose', layerId: 'starfield-1' });

    assert.ok(engines.get('starfield').calls.some((c) => c[0] === 'dispose'));
    // Further messages for the disposed layer are no-ops, not errors.
    assert.doesNotThrow(() => runtime.handleMessage({ type: 'setPointer', layerId: 'starfield-1', x: 1, y: 1 }));

    runtime.dispose();
    assert.deepEqual(cancelled, ['handle']);
  });
});

describe('VisualWorkerClient', () => {
  function createFakeWorker() {
    const posted = [];
    const listeners = [];
    return {
      posted,
      worker: {
        postMessage: (message, transfer) => posted.push({ message, transfer }),
        addEventListener: (_type, listener) => listeners.push(listener),
        removeEventListener: () => {},
      },
    };
  }

  it('lazily creates exactly one worker no matter how many layers init', () => {
    let factoryCalls = 0;
    const fake = createFakeWorker();
    const client = new VisualWorkerClient(() => {
      factoryCalls++;
      return fake.worker;
    });

    const canvasA = { width: 0, height: 0, getContext: () => createFakeCtx() };
    const canvasB = { width: 0, height: 0, getContext: () => createFakeCtx() };
    client.initLayer(basePayload({ layerId: 'a', canvas: canvasA }), [canvasA]);
    client.initLayer(basePayload({ layerId: 'b', canvas: canvasB }), [canvasB]);

    assert.equal(factoryCalls, 1);
    assert.equal(fake.posted.length, 2);
    assert.equal(fake.posted[0].message.type, 'init');
    assert.equal(fake.posted[0].message.payload.layerId, 'a');
    assert.deepEqual(fake.posted[0].transfer, [canvasA]);
  });

  it('forwards non-init messages verbatim to the worker', () => {
    const fake = createFakeWorker();
    const client = new VisualWorkerClient(() => fake.worker);

    client.initLayer(basePayload(), [basePayload().canvas]);
    client.send({ type: 'setRunning', layerId: 'starfield-1', running: false });
    client.send({ type: 'dispose', layerId: 'starfield-1' });

    const types = fake.posted.map((p) => p.message.type);
    assert.deepEqual(types, ['init', 'setRunning', 'dispose']);
  });

  it('does not touch the worker before the first layer inits', () => {
    let factoryCalls = 0;
    const client = new VisualWorkerClient(() => {
      factoryCalls++;
      return createFakeWorker().worker;
    });

    // No worker should exist yet, so a stray send() before any init is silently dropped.
    assert.doesNotThrow(() => client.send({ type: 'setRunning', layerId: 'x', running: true }));
    assert.equal(factoryCalls, 0);
  });
});
