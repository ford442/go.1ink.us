import type { TransferableCanvas } from './engines/types';
import type { EffectKind } from './types';
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
}

export type HostToWorkerMessage =
  | { type: 'init'; payload: LayerInitPayload }
  | { type: 'resize'; layerId: string; width: number; height: number }
  | { type: 'setTheme'; layerId: string; accentRgb: string; theme: ThemeId }
  | { type: 'setPointer'; layerId: string; x: number | null; y: number | null }
  | { type: 'setDensity'; layerId: string; density: number }
  | { type: 'setHover'; layerId: string; hovering: boolean }
  | { type: 'setRunning'; layerId: string; running: boolean }
  | { type: 'dispose'; layerId: string };

export type WorkerToHostMessage =
  | { type: 'ready'; layerId: string }
  | { type: 'error'; layerId?: string; message: string };
