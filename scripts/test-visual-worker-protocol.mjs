import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VisualWorkerRuntime } from '../src/lib/visuals/worker/visualWorkerRuntime.ts';
import { VisualWorkerClient } from '../src/lib/visuals/VisualWorkerClient.ts';
import { OffscreenWorkerBackend } from '../src/lib/visuals/backends/OffscreenWorkerBackend.ts';
import { WasmWorkerBackend } from '../src/lib/visuals/backends/WasmWorkerBackend.ts';

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
      setHover: (hovering) => calls.push(['setHover', hovering]),
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
  it('creates an engine on init, calls Engine.init, and posts ready + the engine it chose', () => {
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
    assert.deepEqual(posted, [
      { type: 'ready', layerId: 'starfield-1' },
      { type: 'engine', layerId: 'starfield-1', engine: 'js' },
    ]);
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

  it('routes resize/setTheme/setPointer/setDensity/setHover to the matching layer only', () => {
    const { factory, engines } = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime(() => {}, factory, () => 'noop-handle', () => {});

    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'a', effect: 'starfield' }) });
    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'b', effect: 'matrixRain' }) });

    runtime.handleMessage({ type: 'resize', layerId: 'a', width: 1024, height: 768 });
    runtime.handleMessage({ type: 'setPointer', layerId: 'a', x: 5, y: 6 });
    runtime.handleMessage({ type: 'setHover', layerId: 'a', hovering: true });
    runtime.handleMessage({ type: 'setTheme', layerId: 'b', accentRgb: '1,2,3', theme: 'purple' });
    runtime.handleMessage({ type: 'setDensity', layerId: 'b', density: 2 });

    const starfield = engines.get('starfield');
    const matrix = engines.get('matrixRain');

    assert.deepEqual(
      starfield.calls.filter((c) => c[0] !== 'init'),
      [['resize', 1024, 768], ['setPointer', 5, 6], ['setHover', true]],
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

  it('parks the shared loop once a layer\'s tick() reports no more demand, and wakes it on setPointer', () => {
    const frames = [];
    const { factory, engines } = createFakeEngineFactory();
    let demandsFrame = true;
    const runtime = new VisualWorkerRuntime(
      () => {},
      (effect) => {
        const engine = factory(effect);
        const originalTick = engine.tick;
        engine.tick = (time) => { originalTick(time); return demandsFrame; };
        return engine;
      },
      (cb) => { frames.push(cb); return frames.length; },
      () => {},
    );

    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'a', effect: 'cursorTrail' }) });
    assert.equal(frames.length, 1);

    demandsFrame = false;
    frames[0](100);
    assert.equal(engines.get('cursorTrail').calls.filter((c) => c[0] === 'tick').length, 1);
    assert.equal(frames.length, 1, 'no frame scheduled once the layer reports no more demand');
    assert.ok(!runtime.isLoopRunningForTest());

    runtime.handleMessage({ type: 'setPointer', layerId: 'a', x: 5, y: 5 });
    assert.equal(frames.length, 2, 'setPointer wakes the parked layer and reschedules a frame');
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

describe('OffscreenWorkerBackend', () => {
  // `HTMLCanvasElement.transferControlToOffscreen()` throws the second time it's
  // called on the same element — this fake reproduces that to catch a regression.
  function createFakeCanvasElement() {
    let transferCount = 0;
    return {
      get transferCount() { return transferCount; },
      transferControlToOffscreen() {
        transferCount++;
        if (transferCount > 1) {
          throw new Error("Failed to execute 'transferControlToOffscreen' on 'HTMLCanvasElement': Cannot transfer control from a canvas for more than one time.");
        }
        return { width: 0, height: 0 };
      },
    };
  }

  function createFakeClient() {
    const sent = [];
    const initLayerCalls = [];
    const listeners = new Map();
    return {
      sent,
      initLayerCalls,
      listeners,
      initLayer: (payload, transfer) => initLayerCalls.push({ payload, transfer }),
      send: (message) => sent.push(message),
      onLayerMessage: (layerId, listener) => {
        listeners.set(layerId, listener);
        return () => listeners.delete(layerId);
      },
    };
  }

  it('reuses the still-alive layer instead of re-transferring when a new backend instance inits the same canvas', () => {
    // Mirrors what useVisualLayer's effect does on every run: create a *new*
    // OffscreenWorkerBackend instance and call init() on the same <canvas> —
    // this happens on React StrictMode's dev double-invoke, and on any real
    // disable/re-enable (e.g. prefers-reduced-motion flipping) that leaves the
    // canvas mounted throughout.
    const canvas = createFakeCanvasElement();
    const client = createFakeClient();

    const backendA = new OffscreenWorkerBackend('starfield', client);
    backendA.init(canvas, { width: 100, height: 100, accentRgb: 'a', theme: 'cyan', density: 1 });
    assert.equal(client.initLayerCalls.length, 1);
    const firstLayerId = client.initLayerCalls[0].payload.layerId;

    backendA.dispose();
    assert.deepEqual(client.sent.at(-1), { type: 'setRunning', layerId: firstLayerId, running: false });

    const backendB = new OffscreenWorkerBackend('starfield', client);
    assert.doesNotThrow(() =>
      backendB.init(canvas, { width: 200, height: 150, accentRgb: 'b', theme: 'purple', density: 1 }),
    );

    assert.equal(canvas.transferCount, 1, 'transferControlToOffscreen is called at most once ever for this canvas');
    assert.equal(client.initLayerCalls.length, 1, 'no second init/transfer message sent to the worker');

    const resumed = client.sent.find((m) => m.type === 'setRunning' && m.running === true);
    assert.ok(resumed, 'the reused layer is resumed');
    assert.equal(resumed.layerId, firstLayerId);

    const resized = client.sent.find((m) => m.type === 'resize');
    assert.deepEqual(resized, { type: 'resize', layerId: firstLayerId, width: 200, height: 150 });
  });

  it('transfers each distinct canvas independently', () => {
    const client = createFakeClient();

    new OffscreenWorkerBackend('starfield', client).init(createFakeCanvasElement(), {
      width: 10, height: 10, accentRgb: 'a', theme: 'cyan', density: 1,
    });
    new OffscreenWorkerBackend('starfield', client).init(createFakeCanvasElement(), {
      width: 10, height: 10, accentRgb: 'a', theme: 'cyan', density: 1,
    });

    assert.equal(client.initLayerCalls.length, 2);
    assert.notEqual(client.initLayerCalls[0].payload.layerId, client.initLayerCalls[1].payload.layerId);
  });
});

describe('VisualWorkerRuntime engine selection (WASM -> JS fallback)', () => {
  // A stand-in for the loaded visual core: hands out recording fake engines
  // tagged 'wasm' for the effects it "implements", null for the rest.
  function createFakeCore(effects = ['starfield', 'particleNetwork', 'matrixRain']) {
    const { factory, engines } = createFakeEngineFactory();
    return {
      engines,
      core: {
        effects: new Set(effects),
        createEngine: (effect) => (effects.includes(effect) ? factory(effect) : null),
      },
    };
  }

  function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  }

  function engineMessages(posted) {
    return posted.filter((m) => m.type === 'engine').map((m) => [m.layerId, m.engine]);
  }

  it('runs a wasm request on the JS engine straight away when no loader is wired up', () => {
    const posted = [];
    const js = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime((m) => posted.push(m), js.factory, () => 1, () => {});

    runtime.handleMessage({ type: 'init', payload: basePayload({ engine: 'wasm' }) });

    assert.ok(js.engines.has('starfield'));
    assert.deepEqual(engineMessages(posted), [['starfield-1', 'js']]);
  });

  it('parks a fresh wasm layer until the core loads, then inits the wasm engine from the latest state', async () => {
    const posted = [];
    const js = createFakeEngineFactory();
    const wasm = createFakeCore();
    const load = deferred();
    let loads = 0;
    const runtime = new VisualWorkerRuntime((m) => posted.push(m), js.factory, () => 1, () => {}, () => {
      loads++;
      return load.promise;
    });

    runtime.handleMessage({ type: 'init', payload: basePayload({ engine: 'wasm' }) });
    // State that arrives while the core is still loading must not be lost.
    runtime.handleMessage({ type: 'resize', layerId: 'starfield-1', width: 1280, height: 720 });
    runtime.handleMessage({ type: 'setTheme', layerId: 'starfield-1', accentRgb: '1, 2, 3', theme: 'gold' });
    runtime.handleMessage({ type: 'setPointer', layerId: 'starfield-1', x: 40, y: 50 });
    runtime.handleMessage({ type: 'setHover', layerId: 'starfield-1', hovering: true });
    runtime.handleMessage({ type: 'setDensity', layerId: 'starfield-1', density: 2 });
    runtime.tickForTest(16);

    assert.equal(js.engines.size, 0, 'no JS engine is spun up just to be thrown away');
    assert.equal(engineMessages(posted).length, 0);
    assert.equal(loads, 1);

    load.resolve(wasm.core);
    await runtime.wasmSettledForTest();

    const engine = wasm.engines.get('starfield');
    assert.deepEqual(engine.calls, [
      ['init', engine.calls[0][1], 1280, 720, { accentRgb: '1, 2, 3', theme: 'gold', density: 2 }],
      ['setPointer', 40, 50],
      ['setHover', true],
    ]);
    assert.deepEqual(engineMessages(posted), [['starfield-1', 'wasm']]);

    runtime.tickForTest(32);
    assert.ok(engine.calls.some((c) => c[0] === 'tick' && c[1] === 32));
  });

  it('loads the core once however many layers request it', async () => {
    let loads = 0;
    const wasm = createFakeCore();
    const runtime = new VisualWorkerRuntime(() => {}, createFakeEngineFactory().factory, () => 1, () => {}, async () => {
      loads++;
      return wasm.core;
    });

    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'a', effect: 'starfield', engine: 'wasm' }) });
    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'b', effect: 'particleNetwork', engine: 'wasm' }) });
    await runtime.wasmSettledForTest();
    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'c', effect: 'matrixRain', engine: 'wasm' }) });

    assert.equal(loads, 1);
    assert.deepEqual([...wasm.engines.keys()].sort(), ['matrixRain', 'particleNetwork', 'starfield']);
  });

  it('falls back to JS, and reports the failure once, when the core fails to load', async () => {
    const posted = [];
    const js = createFakeEngineFactory();
    const runtime = new VisualWorkerRuntime((m) => posted.push(m), js.factory, () => 1, () => {}, async () => {
      throw new Error('HTTP 404');
    });

    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'a', effect: 'starfield', engine: 'wasm' }) });
    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'b', effect: 'matrixRain', engine: 'wasm' }) });
    await runtime.wasmSettledForTest();
    // A later request doesn't retry a load that already failed.
    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'c', effect: 'particleNetwork', engine: 'wasm' }) });

    const errors = posted.filter((m) => m.type === 'error');
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /WASM visual core unavailable.*HTTP 404/);
    assert.deepEqual(engineMessages(posted), [['a', 'js'], ['b', 'js'], ['c', 'js']]);
    assert.deepEqual([...js.engines.keys()].sort(), ['matrixRain', 'particleNetwork', 'starfield']);
  });

  it('uses the JS engine for an effect the core does not implement', async () => {
    const posted = [];
    const js = createFakeEngineFactory();
    const wasm = createFakeCore(['starfield']);
    const runtime = new VisualWorkerRuntime((m) => posted.push(m), js.factory, () => 1, () => {}, async () => wasm.core);

    runtime.handleMessage({ type: 'init', payload: basePayload({ layerId: 'cur', effect: 'cursor', engine: 'wasm' }) });
    await runtime.wasmSettledForTest();

    assert.ok(js.engines.has('cursor'));
    assert.deepEqual(engineMessages(posted), [['cur', 'js']]);
  });

  it('swaps a live layer between engines on setEngine, keeping JS running until the core is ready', async () => {
    const posted = [];
    const js = createFakeEngineFactory();
    const wasm = createFakeCore();
    const load = deferred();
    const runtime = new VisualWorkerRuntime((m) => posted.push(m), js.factory, () => 1, () => {}, () => load.promise);

    runtime.handleMessage({ type: 'init', payload: basePayload() });
    const jsEngine = js.engines.get('starfield');

    runtime.handleMessage({ type: 'setEngine', layerId: 'starfield-1', engine: 'wasm' });
    runtime.tickForTest(10);
    assert.ok(jsEngine.calls.some((c) => c[0] === 'tick' && c[1] === 10), 'JS keeps drawing while the core loads');
    assert.ok(!jsEngine.calls.some((c) => c[0] === 'dispose'));

    load.resolve(wasm.core);
    await runtime.wasmSettledForTest();
    assert.ok(jsEngine.calls.some((c) => c[0] === 'dispose'), 'the replaced JS engine is disposed');
    assert.equal(wasm.engines.get('starfield').calls[0][0], 'init');

    // Re-requesting the engine already running is a no-op, not a reseed.
    runtime.handleMessage({ type: 'setEngine', layerId: 'starfield-1', engine: 'wasm' });
    assert.equal(wasm.engines.get('starfield').calls.filter((c) => c[0] === 'init').length, 1);

    runtime.handleMessage({ type: 'setEngine', layerId: 'starfield-1', engine: 'js' });
    assert.ok(wasm.engines.get('starfield').calls.some((c) => c[0] === 'dispose'));
    assert.deepEqual(engineMessages(posted), [['starfield-1', 'js'], ['starfield-1', 'wasm'], ['starfield-1', 'js']]);
  });

  it('wakes the shared loop when a parked wasm layer gets its engine', async () => {
    const frames = [];
    const wasm = createFakeCore();
    const runtime = new VisualWorkerRuntime(
      () => {},
      createFakeEngineFactory().factory,
      (cb) => { frames.push(cb); return frames.length; },
      () => {},
      async () => wasm.core,
    );

    runtime.handleMessage({ type: 'init', payload: basePayload({ engine: 'wasm' }) });
    // The first frame finds no engine yet; the layer parks and the loop stops.
    frames.shift()(16);
    assert.ok(!runtime.isLoopRunningForTest());

    await runtime.wasmSettledForTest();
    assert.ok(runtime.isLoopRunningForTest(), 'attaching the wasm engine reschedules the loop');
  });
});

describe('VisualWorkerClient layer routing', () => {
  it('delivers worker messages to the listener for their layer only', () => {
    let onMessage;
    const client = new VisualWorkerClient(() => ({
      postMessage: () => {},
      addEventListener: (_type, listener) => { onMessage = listener; },
      removeEventListener: () => {},
    }));
    client.initLayer(basePayload({ layerId: 'a' }), []);

    const seenA = [];
    const seenB = [];
    client.onLayerMessage('a', (m) => seenA.push(m));
    const unsubscribeB = client.onLayerMessage('b', (m) => seenB.push(m));

    onMessage({ data: { type: 'engine', layerId: 'a', engine: 'wasm' } });
    unsubscribeB();
    onMessage({ data: { type: 'engine', layerId: 'b', engine: 'js' } });

    assert.deepEqual(seenA, [{ type: 'engine', layerId: 'a', engine: 'wasm' }]);
    assert.deepEqual(seenB, []);
  });
});

describe('WasmWorkerBackend', () => {
  function createFakeCanvasElement() {
    return { dataset: {}, transferControlToOffscreen: () => ({ width: 0, height: 0 }) };
  }

  function createFakeClient() {
    const sent = [];
    const initLayerCalls = [];
    const listeners = new Map();
    return {
      sent,
      initLayerCalls,
      listeners,
      initLayer: (payload, transfer) => initLayerCalls.push({ payload, transfer }),
      send: (message) => sent.push(message),
      onLayerMessage: (layerId, listener) => {
        listeners.set(layerId, listener);
        return () => listeners.delete(layerId);
      },
    };
  }

  const OPTIONS = { width: 100, height: 100, accentRgb: 'a', theme: 'cyan', density: 1 };

  it('requests the wasm engine in its init payload; the JS worker backend requests js', () => {
    const client = createFakeClient();
    new WasmWorkerBackend('particleNetwork', client).init(createFakeCanvasElement(), OPTIONS);
    new OffscreenWorkerBackend('particleNetwork', client).init(createFakeCanvasElement(), OPTIONS);

    assert.equal(client.initLayerCalls[0].payload.engine, 'wasm');
    assert.equal(client.initLayerCalls[1].payload.engine, 'js');
  });

  it('mirrors the engine the worker reports onto the canvas as data-visual-engine', () => {
    const client = createFakeClient();
    const canvas = createFakeCanvasElement();
    new WasmWorkerBackend('starfield', client).init(canvas, OPTIONS);
    const { layerId } = client.initLayerCalls[0].payload;

    client.listeners.get(layerId)({ type: 'ready', layerId });
    assert.equal(canvas.dataset.visualEngine, undefined);
    client.listeners.get(layerId)({ type: 'engine', layerId, engine: 'wasm' });
    assert.equal(canvas.dataset.visualEngine, 'wasm');
  });

  it('re-selects the engine, after the fresh state, when a new backend reuses a transferred canvas', () => {
    // Full mode toggling while the starfield stays mounted: useVisualLayer
    // re-inits with the other backend class against the same <canvas>.
    const client = createFakeClient();
    const canvas = createFakeCanvasElement();
    const first = new OffscreenWorkerBackend('starfield', client);
    first.init(canvas, OPTIONS);
    first.dispose();

    new WasmWorkerBackend('starfield', client).init(canvas, { ...OPTIONS, width: 300 });

    assert.equal(client.initLayerCalls.length, 1, 'still only one transfer');
    const types = client.sent.map((m) => m.type);
    assert.deepEqual(types.slice(-5), ['setRunning', 'resize', 'setTheme', 'setDensity', 'setEngine']);
    assert.deepEqual(client.sent.at(-1), {
      type: 'setEngine',
      layerId: client.initLayerCalls[0].payload.layerId,
      engine: 'wasm',
    });
  });
});
