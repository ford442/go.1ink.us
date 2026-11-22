import type { Canvas2D, Engine, EngineInitOptions } from '../engines/types';
import type { EngineImpl } from '../types';
import type { ThemeId } from '../../../types';

/**
 * The `Engine` each worker layer holds. It records the latest host state
 * (canvas context, size, theme, density, pointer, hover) and forwards every
 * call to an inner engine that can be replaced at any time: when the WASM
 * core finishes loading, when it fails and the layer falls back to JS, or
 * when the host re-selects the engine for a live layer. The replacement is
 * initialized from the recorded state, so a swap never needs the host to
 * resend anything, or to re-transfer a canvas it can only transfer once.
 *
 * Until it has an inner engine (a `'wasm'` layer whose core is still
 * loading), `tick()` returns false, so the shared loop parks the layer
 * instead of spinning on nothing.
 */
export class LayerEngine implements Engine {
  private inner: Engine | null = null;
  private innerImpl: EngineImpl | null = null;
  private ctx: Canvas2D | null = null;
  private width = 0;
  private height = 0;
  private options: EngineInitOptions = { accentRgb: '', theme: 'cyan', density: 1 };
  private pointerX: number | null = null;
  private pointerY: number | null = null;
  private hovering = false;

  /** The engine currently driving the layer, or null while none is attached. */
  get impl(): EngineImpl | null {
    return this.innerImpl;
  }

  /** Replaces the inner engine, disposing the old one and initializing the new one from the recorded state. */
  use(engine: Engine, impl: EngineImpl): void {
    this.inner?.dispose();
    this.inner = engine;
    this.innerImpl = impl;
    if (!this.ctx) return;
    engine.init(this.ctx, this.width, this.height, { ...this.options });
    // Only replay inputs that differ from a fresh engine's defaults.
    if (this.pointerX !== null || this.pointerY !== null) engine.setPointer(this.pointerX, this.pointerY);
    if (this.hovering) engine.setHover(true);
  }

  init(ctx: Canvas2D, width: number, height: number, options: EngineInitOptions): void {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.options = { ...options };
    this.inner?.init(ctx, width, height, { ...options });
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.inner?.resize(width, height);
  }

  setPointer(x: number | null, y: number | null): void {
    this.pointerX = x;
    this.pointerY = y;
    this.inner?.setPointer(x, y);
  }

  setTheme(accentRgb: string, theme: ThemeId): void {
    this.options.accentRgb = accentRgb;
    this.options.theme = theme;
    this.inner?.setTheme(accentRgb, theme);
  }

  setDensity(density: number): void {
    this.options.density = density;
    this.inner?.setDensity(density);
  }

  setHover(hovering: boolean): void {
    this.hovering = hovering;
    this.inner?.setHover(hovering);
  }

  tick(time: number): boolean | void {
    return this.inner ? this.inner.tick(time) : false;
  }

  dispose(): void {
    this.inner?.dispose();
    this.inner = null;
    this.innerImpl = null;
    this.ctx = null;
  }
}
