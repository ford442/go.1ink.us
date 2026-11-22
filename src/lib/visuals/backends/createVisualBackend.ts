import { MainThreadCanvasBackend } from './MainThreadCanvasBackend';
import { OffscreenWorkerBackend } from './OffscreenWorkerBackend';
import { WasmWorkerBackend } from './WasmWorkerBackend';
import { supportsOffscreenCanvas, supportsWasmVisualCore } from '../support';
import type { EffectKind, VisualBackend } from '../types';

export interface VisualBackendPreference {
  /** Run in the shared visuals worker when the browser supports `OffscreenCanvas`. */
  worker: boolean;
  /** Within the worker, drive the layer with the C++ visual core when it implements this effect. */
  wasm: boolean;
}

/**
 * The host-side half of the fallback chain, cheapest capability first:
 * WASM worker -> JS worker -> main-thread canvas. (The worker adds one more
 * step of its own: a WASM layer whose core fails to load runs on JS.)
 */
export function createVisualBackend(kind: EffectKind, preference: VisualBackendPreference): VisualBackend {
  if (preference.worker && supportsOffscreenCanvas()) {
    if (preference.wasm && supportsWasmVisualCore(kind)) return new WasmWorkerBackend(kind);
    return new OffscreenWorkerBackend(kind);
  }
  return new MainThreadCanvasBackend(kind);
}
