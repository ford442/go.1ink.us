import type { TransferableCanvas } from './engines/types';
import type { EffectKind, EngineImpl } from './types';
import type { ThemeId } from '../../types';

export interface LayerInitPayload {
  layerId: string;
  effect: EffectKind;
  canvas: TransferableCanvas;
  width: number;
  height: number;
  accentRgb: string;
  theme: ThemeId;
  density: number;
  /** Engine to drive the layer with; defaults to `'js'`. A `'wasm'` request falls back to `'js'` if the core can't load. */
  engine?: EngineImpl;
}

export type HostToWorkerMessage =
  | { type: 'init'; payload: LayerInitPayload }
  | { type: 'resize'; layerId: string; width: number; height: number }
  | { type: 'setTheme'; layerId: string; accentRgb: string; theme: ThemeId }
  | { type: 'setPointer'; layerId: string; x: number | null; y: number | null }
  | { type: 'setDensity'; layerId: string; density: number }
  | { type: 'setHover'; layerId: string; hovering: boolean }
  | { type: 'setRunning'; layerId: string; running: boolean }
  /** Re-select the engine for a live layer (e.g. Full mode toggled) without re-transferring its canvas. */
  | { type: 'setEngine'; layerId: string; engine: EngineImpl }
  | { type: 'dispose'; layerId: string };

export type WorkerToHostMessage =
  | { type: 'ready'; layerId: string }
  /** The engine now driving the layer, sent whenever it's chosen or swapped. */
  | { type: 'engine'; layerId: string; engine: EngineImpl }
  | { type: 'error'; layerId?: string; message: string };
