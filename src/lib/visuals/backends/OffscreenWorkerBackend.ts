import { getVisualWorkerClient } from '../VisualWorkerClient';
import type { VisualWorkerClient } from '../VisualWorkerClient';
import type { TransferableCanvas } from '../engines/types';
import type { LayerInitPayload } from '../protocol';
import type { EffectKind, VisualBackend, VisualInitOptions } from '../types';
import type { ThemeId } from '../../../types';

let nextLayerId = 0;

// `HTMLCanvasElement.transferControlToOffscreen()` can only ever succeed once
// for a given canvas — a second call throws `InvalidStateError`, permanently.
// React (StrictMode in dev, or a real prop change that disables then
// re-enables an effect while its <canvas> stays mounted, e.g.
// prefers-reduced-motion flipping mid-session) can run this backend's
// init()/dispose() pair more than once against the *same* canvas element, so
// every transfer this module has ever made is tracked here and reused
// instead of re-transferred.
const activeTransfers = new WeakMap<HTMLCanvasElement, string>();

/** Transfers the canvas to the shared visuals worker and proxies every call over `postMessage`. */
export class OffscreenWorkerBackend implements VisualBackend {
  readonly kind: EffectKind;
  private layerId: string;
  private readonly client: VisualWorkerClient;

  constructor(kind: EffectKind, client: VisualWorkerClient = getVisualWorkerClient()) {
    this.kind = kind;
    this.layerId = `${kind}-${++nextLayerId}`;
    this.client = client;
  }

  init(canvas: HTMLCanvasElement, options: VisualInitOptions): void {
    const existingLayerId = activeTransfers.get(canvas);
    if (existingLayerId) {
      // Reuse the still-alive worker layer from this canvas's earlier transfer
      // (see `activeTransfers` above) instead of transferring again.
      this.layerId = existingLayerId;
      this.client.send({ type: 'setRunning', layerId: this.layerId, running: true });
      this.resize(options.width, options.height);
      this.setTheme(options.accentRgb, options.theme);
      this.setDensity(options.density);
      return;
    }

    const offscreen = canvas.transferControlToOffscreen();
    activeTransfers.set(canvas, this.layerId);
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
    // Pause rather than a true worker-side teardown: the canvas this layer
    // owns can never be reconnected to a fresh layer once transferred (see
    // `activeTransfers`), so this layer has to stay alive, idle, in case
    // init() runs again for the same canvas.
    this.client.send({ type: 'setRunning', layerId: this.layerId, running: false });
  }
}
