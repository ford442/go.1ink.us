import { createEngine } from '../engines/createEngine';
import type { Engine, TransferableCanvas } from '../engines/types';
import type { HostToWorkerMessage, LayerInitPayload, WorkerToHostMessage } from '../protocol';

interface Layer {
  canvas: TransferableCanvas;
  engine: Engine;
  running: boolean;
  /** Whether this layer's last tick() asked to keep going (false = parked until something wakes it). */
  demandsFrame: boolean;
}

export type PostMessageFn = (message: WorkerToHostMessage) => void;
export type EngineFactory = (effect: LayerInitPayload['effect']) => Engine;
export type ScheduleFrameFn = (callback: (time: number) => void) => unknown;
export type CancelFrameFn = (handle: unknown) => void;

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

  constructor(
    private postMessage: PostMessageFn,
    private engineFactory: EngineFactory = createEngine,
    private scheduleFrame: ScheduleFrameFn = defaultSchedule,
    private cancelFrame: CancelFrameFn = defaultCancel,
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
      case 'setRunning':
        this.withLayer(message.layerId, (layer) => {
          layer.running = message.running;
          if (message.running) layer.demandsFrame = true;
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

    const engine = this.engineFactory(payload.effect);
    engine.init(ctx, payload.width, payload.height, {
      accentRgb: payload.accentRgb,
      theme: payload.theme,
      density: payload.density,
    });

    this.layers.set(payload.layerId, { canvas: payload.canvas, engine, running: true, demandsFrame: true });
    this.postMessage({ type: 'ready', layerId: payload.layerId });
    this.ensureLoop();
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
