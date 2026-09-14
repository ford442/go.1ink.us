import { getVisualWorkerClient } from '../VisualWorkerClient';
import type { VisualWorkerClient } from '../VisualWorkerClient';
import type { TransferableCanvas } from '../engines/types';
import type { LayerInitPayload } from '../protocol';
import type { EffectKind, VisualBackend, VisualInitOptions } from '../types';
import type { ThemeId } from '../../../types';

let nextLayerId = 0;

/** Transfers the canvas to the shared visuals worker and proxies every call over `postMessage`. */
export class OffscreenWorkerBackend implements VisualBackend {
  readonly kind: EffectKind;
  private readonly layerId: string;
  private readonly client: VisualWorkerClient;

  constructor(kind: EffectKind, client: VisualWorkerClient = getVisualWorkerClient()) {
    this.kind = kind;
    this.layerId = `${kind}-${++nextLayerId}`;
    this.client = client;
  }

  init(canvas: HTMLCanvasElement, options: VisualInitOptions): void {
    const offscreen = canvas.transferControlToOffscreen();
    const payload: LayerInitPayload = {
      layerId: this.layerId,
      effect: this.kind,
      // Real OffscreenCanvas at runtime; narrowed to the protocol's minimal
      // structural type since `getContext`'s DOM overload set doesn't collapse
      // onto TransferableCanvas's single non-overloaded signature.
      canvas: offscreen as unknown as TransferableCanvas,
      width: options.width,
      height: options.height,
      accentRgb: options.accentRgb,
      theme: options.theme,
      density: options.density,
    };
    this.client.initLayer(payload, [offscreen]);
  }

  resize(width: number, height: number): void {
    this.client.send({ type: 'resize', layerId: this.layerId, width, height });
  }

  setTheme(accentRgb: string, theme: ThemeId): void {
    this.client.send({ type: 'setTheme', layerId: this.layerId, accentRgb, theme });
  }

  setPointer(x: number | null, y: number | null): void {
    this.client.send({ type: 'setPointer', layerId: this.layerId, x, y });
  }

  setDensity(density: number): void {
    this.client.send({ type: 'setDensity', layerId: this.layerId, density });
  }

  setRunning(running: boolean): void {
    this.client.send({ type: 'setRunning', layerId: this.layerId, running });
  }

  tick(): void {
    // The worker drives its own shared frame loop for this layer.
  }

  dispose(): void {
    this.client.send({ type: 'dispose', layerId: this.layerId });
  }
}
