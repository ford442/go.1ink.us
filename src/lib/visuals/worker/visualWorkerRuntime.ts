import { createEngine } from '../engines/createEngine';
import type { Engine, TransferableCanvas } from '../engines/types';
import type { HostToWorkerMessage, LayerInitPayload, WorkerToHostMessage } from '../protocol';
import type { EffectKind, EngineImpl } from '../types';
import type { VisualCore } from '../wasm/loadVisualCore';
import { LayerEngine } from './layerEngine';

interface Layer {
  canvas: TransferableCanvas;
  effect: EffectKind;
  engine: LayerEngine;
  /** What the host asked for; `engine.impl` is what's actually running (they differ while WASM loads, or after it fails). */
  requested: EngineImpl;
  running: boolean;
  /** Whether this layer's last tick() asked to keep going (false = parked until something wakes it). */
  demandsFrame: boolean;
}

export type PostMessageFn = (message: WorkerToHostMessage) => void;
export type EngineFactory = (effect: LayerInitPayload['effect']) => Engine;
export type ScheduleFrameFn = (callback: (time: number) => void) => unknown;
export type CancelFrameFn = (handle: unknown) => void;
/** Loads the WASM visual core. Called at most once, on the first layer that requests `'wasm'`. */
export type WasmCoreLoader = () => Promise<VisualCore>;

function defaultSchedule(callback: (time: number) => void): unknown {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  // Dedicated workers don't reliably expose requestAnimationFrame; fall back to a ~60fps timer.
  return setTimeout(() => callback(performance.now()), 16);
}

function defaultCancel(handle: unknown): void {
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(handle as number);
  else clearTimeout(handle as ReturnType<typeof setTimeout>);
}

/**
 * Protocol handler that owns every visual layer running inside the visuals
 * worker and drives one shared frame loop for all of them (rather than one
 * rAF per effect). Deliberately decoupled from `self`/`postMessage` — the
 * real worker entry (`visualWorker.ts`) just wires this up — so it can run,
 * and be exercised with a fake worker/canvas, under Node in
 * scripts/test-visual-worker-protocol.mjs.
 */
export class VisualWorkerRuntime {
  private layers = new Map<string, Layer>();
  private loopHandle: unknown = null;
  /** undefined: not loaded (or loading); null: failed, every layer runs JS. */
  private wasmCore: VisualCore | null | undefined = undefined;
  private wasmLoad: Promise<void> | null = null;

  constructor(
    private postMessage: PostMessageFn,
    private engineFactory: EngineFactory = createEngine,
    private scheduleFrame: ScheduleFrameFn = defaultSchedule,
    private cancelFrame: CancelFrameFn = defaultCancel,
    /** Without a loader, `'wasm'` requests run on the JS engines. */
    private loadWasmCore: WasmCoreLoader | null = null,
  ) {}

  handleMessage(message: HostToWorkerMessage): void {
    switch (message.type) {
      case 'init':
        this.handleInit(message.payload);
        break;
      case 'resize':
        this.withLayer(message.layerId, (layer) => {
          layer.canvas.width = message.width;
          layer.canvas.height = message.height;
          layer.engine.resize(message.width, message.height);
          layer.demandsFrame = true;
        });
        this.ensureLoop();
        break;
      case 'setTheme':
        this.withLayer(message.layerId, (layer) => {
          layer.engine.setTheme(message.accentRgb, message.theme);
          layer.demandsFrame = true;
        });
        this.ensureLoop();
        break;
      case 'setPointer':
        this.withLayer(message.layerId, (layer) => {
          layer.engine.setPointer(message.x, message.y);
          layer.demandsFrame = true;
        });
        this.ensureLoop();
        break;
      case 'setDensity':
        this.withLayer(message.layerId, (layer) => {
          layer.engine.setDensity(message.density);
          layer.demandsFrame = true;
        });
        this.ensureLoop();
        break;
      case 'setHover':
        this.withLayer(message.layerId, (layer) => {
          layer.engine.setHover(message.hovering);
          layer.demandsFrame = true;
        });
        this.ensureLoop();
        break;
      case 'setRunning':
        this.withLayer(message.layerId, (layer) => {
          layer.running = message.running;
          if (message.running) layer.demandsFrame = true;
        });
        this.ensureLoop();
        break;
      case 'setEngine':
        this.withLayer(message.layerId, (layer) => {
          layer.requested = message.engine;
          this.selectEngine(message.layerId, layer);
        });
        this.ensureLoop();
        break;
      case 'dispose':
        this.withLayer(message.layerId, (layer) => layer.engine.dispose());
        this.layers.delete(message.layerId);
        break;
    }
  }

  private withLayer(layerId: string, fn: (layer: Layer) => void): void {
    const layer = this.layers.get(layerId);
    if (layer) fn(layer);
  }

  private handleInit(payload: LayerInitPayload): void {
    const ctx = payload.canvas.getContext('2d');
    if (!ctx) {
      this.postMessage({ type: 'error', layerId: payload.layerId, message: '2D context unavailable' });
      return;
    }
    payload.canvas.width = payload.width;
    payload.canvas.height = payload.height;

    const engine = new LayerEngine();
    engine.init(ctx, payload.width, payload.height, {
      accentRgb: payload.accentRgb,
      theme: payload.theme,
      density: payload.density,
    });

    const layer: Layer = {
      canvas: payload.canvas,
      effect: payload.effect,
      engine,
      requested: payload.engine ?? 'js',
      running: true,
      demandsFrame: true,
    };
    this.layers.set(payload.layerId, layer);
    this.postMessage({ type: 'ready', layerId: payload.layerId });
    this.selectEngine(payload.layerId, layer);
    this.ensureLoop();
  }

  /**
   * Points the layer at the engine it should run now. The fallback chain
   * inside the worker: the WASM core when requested and available, else the
   * JS engine. While the core is still loading, a fresh layer waits (parked,
   * drawing nothing) and a running JS layer keeps running until the swap.
   */
  private selectEngine(layerId: string, layer: Layer): void {
    const wantsWasm = layer.requested === 'wasm' && this.loadWasmCore !== null;
    if (wantsWasm) {
      if (layer.engine.impl === 'wasm') return;
      if (this.wasmCore === undefined) {
        this.startWasmLoad();
        return;
      }
      const wasm = this.wasmCore?.createEngine(layer.effect) ?? null;
      if (wasm) {
        this.attach(layerId, layer, wasm, 'wasm');
        return;
      }
    }
    if (layer.engine.impl !== 'js') this.attach(layerId, layer, this.engineFactory(layer.effect), 'js');
  }

  private attach(layerId: string, layer: Layer, engine: Engine, impl: EngineImpl): void {
    layer.engine.use(engine, impl);
    layer.demandsFrame = true;
    this.postMessage({ type: 'engine', layerId, engine: impl });
  }

  private startWasmLoad(): void {
    const load = this.loadWasmCore;
    if (this.wasmLoad || !load) return;
    // Starts the fetch now; the executor also turns a synchronous throw into a rejection.
    this.wasmLoad = new Promise<VisualCore>((resolve) => resolve(load()))
      .then(
        (core) => {
          this.wasmCore = core;
        },
        (error: unknown) => {
          this.wasmCore = null;
          const reason = error instanceof Error ? error.message : String(error);
          this.postMessage({ type: 'error', message: `WASM visual core unavailable, using JS engines: ${reason}` });
        },
      )
      .then(() => {
        for (const [layerId, layer] of this.layers) {
          if (layer.requested === 'wasm') this.selectEngine(layerId, layer);
        }
        this.ensureLoop();
      });
  }

  /** Test-only: resolves once a pending WASM core load has settled and waiting layers were re-pointed. */
  wasmSettledForTest(): Promise<void> {
    return this.wasmLoad ?? Promise.resolve();
  }

  private hasFrameDemand(): boolean {
    return Array.from(this.layers.values()).some((layer) => layer.running && layer.demandsFrame);
  }

  private ensureLoop(): void {
    if (!this.hasFrameDemand() || this.loopHandle !== null) return;

    const step = (time: number) => {
      this.loopHandle = null;
      for (const layer of this.layers.values()) {
        if (!layer.running || !layer.demandsFrame) continue;
        if (layer.engine.tick(time) === false) layer.demandsFrame = false;
      }
      if (this.hasFrameDemand()) this.loopHandle = this.scheduleFrame(step);
    };
    this.loopHandle = this.scheduleFrame(step);
  }

  /** Test-only escape hatch: advance every running layer by one frame without a real timer. */
  tickForTest(time: number): void {
    for (const layer of this.layers.values()) {
      if (layer.running) layer.engine.tick(time);
    }
  }

  /** Test-only: whether the shared loop is currently scheduled. */
  isLoopRunningForTest(): boolean {
    return this.loopHandle !== null;
  }

  dispose(): void {
    if (this.loopHandle !== null) this.cancelFrame(this.loopHandle);
    this.loopHandle = null;
    for (const layer of this.layers.values()) layer.engine.dispose();
    this.layers.clear();
  }
}
