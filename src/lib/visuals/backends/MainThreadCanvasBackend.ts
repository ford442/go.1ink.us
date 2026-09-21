import { createEngine } from '../engines/createEngine';
import type { Engine } from '../engines/types';
import type { EffectKind, VisualBackend, VisualInitOptions } from '../types';
import type { ThemeId } from '../../../types';

/** Runs an engine directly against a normal (non-offscreen) `<canvas>`, ticked by the caller's own rAF loop. */
export class MainThreadCanvasBackend implements VisualBackend {
  readonly kind: EffectKind;
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;

  constructor(kind: EffectKind) {
    this.kind = kind;
  }

  init(canvas: HTMLCanvasElement, options: VisualInitOptions): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.canvas = canvas;
    canvas.width = options.width;
    canvas.height = options.height;

    this.engine = createEngine(this.kind);
    this.engine.init(ctx, options.width, options.height, {
      accentRgb: options.accentRgb,
      theme: options.theme,
      density: options.density,
    });
  }

  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.engine?.resize(width, height);
  }

  setTheme(accentRgb: string, theme: ThemeId): void {
    this.engine?.setTheme(accentRgb, theme);
  }

  setPointer(x: number | null, y: number | null): void {
    this.engine?.setPointer(x, y);
  }

  setDensity(density: number): void {
    this.engine?.setDensity(density);
  }

  setHover(hovering: boolean): void {
    this.engine?.setHover(hovering);
  }

  setRunning(): void {
    // The host's own rAF gate (useAnimationLoop) already stops calling tick()
    // when the tab is hidden or the target scrolls off-screen, so a main-thread
    // layer doesn't need a separate play/pause signal.
  }

  tick(time: number): boolean | void {
    return this.engine?.tick(time);
  }

  dispose(): void {
    this.engine?.dispose();
    this.engine = null;
    this.canvas = null;
  }
}
