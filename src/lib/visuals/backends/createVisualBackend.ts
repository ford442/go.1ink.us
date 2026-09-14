import { MainThreadCanvasBackend } from './MainThreadCanvasBackend';
import { OffscreenWorkerBackend } from './OffscreenWorkerBackend';
import { supportsOffscreenCanvas } from '../support';
import type { EffectKind, VisualBackend } from '../types';

/** Picks the worker-backed backend when both the caller wants it and the browser supports `OffscreenCanvas`. */
export function createVisualBackend(kind: EffectKind, preferWorker: boolean): VisualBackend {
  if (preferWorker && supportsOffscreenCanvas()) return new OffscreenWorkerBackend(kind);
  return new MainThreadCanvasBackend(kind);
}
