import type { ThemeId } from '../../types';

/** Every ambient background effect that can be driven through a `VisualBackend`. */
export type EffectKind = 'starfield' | 'particleNetwork' | 'matrixRain' | 'cursorTrail';

export interface VisualInitOptions {
  width: number;
  height: number;
  accentRgb: string;
  theme: ThemeId;
  /** 1 = normal; effects that support it (e.g. God Mode particles) scale up from here. */
  density: number;
}

/**
 * Backend-agnostic handle to one running visual layer. `MainThreadCanvasBackend`
 * runs the simulation in-page; `OffscreenWorkerBackend` transfers the canvas to
 * the shared visuals worker and proxies these calls over `postMessage`. Both
 * implementations share the same `src/lib/visuals/engines/*` simulation code.
 */
export interface VisualBackend {
  readonly kind: EffectKind;
  init(canvas: HTMLCanvasElement, options: VisualInitOptions): void;
  resize(width: number, height: number): void;
  setTheme(accentRgb: string, theme: ThemeId): void;
  setPointer(x: number | null, y: number | null): void;
  setDensity(density: number): void;
  /** Play/pause signal for backends that run their own loop outside this frame's rAF (i.e. workers). */
  setRunning(running: boolean): void;
  /** Advance one frame. No-op for backends that drive their own loop (i.e. workers). */
  tick(time: number): boolean | void;
  dispose(): void;
}
