import type { ThemeId } from '../../../types';

/**
 * The subset of `CanvasRenderingContext2D` / `OffscreenCanvasRenderingContext2D`
 * every engine actually uses. Both real context types implement the same
 * `CanvasFillStrokeStyles`/`CanvasPath`/`CanvasText`/... mixins from `lib.dom.d.ts`
 * (hence the plain `CanvasGradient`/`CanvasPattern` references below, not a
 * custom stand-in), so both satisfy this structurally without a cast.
 */
export interface Canvas2D {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  globalAlpha: number;
  beginPath(): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  stroke(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
}

/**
 * Structural subset of `OffscreenCanvas` (and, pre-transfer, `HTMLCanvasElement`)
 * the worker runtime needs. Kept separate from the real DOM `OffscreenCanvas`
 * type because its `getContext` overload set doesn't collapse cleanly onto a
 * single non-overloaded signature — see the cast in `OffscreenWorkerBackend`.
 */
export interface TransferableCanvas {
  width: number;
  height: number;
  getContext(contextId: '2d'): Canvas2D | null;
}

export interface EngineInitOptions {
  accentRgb: string;
  theme: ThemeId;
  density: number;
}

/**
 * Pure, DOM-adjacent-but-not-DOM-dependent simulation + draw step for one
 * ambient effect. Framework-free and canvas-implementation-free (works
 * against a plain `CanvasRenderingContext2D` or `OffscreenCanvasRenderingContext2D`)
 * so the exact same code runs whether it's driven by `MainThreadCanvasBackend`
 * or inside the visuals worker.
 */
export interface Engine {
  init(ctx: Canvas2D, width: number, height: number, options: EngineInitOptions): void;
  resize(width: number, height: number): void;
  setPointer(x: number | null, y: number | null): void;
  setTheme(accentRgb: string, theme: ThemeId): void;
  setDensity(density: number): void;
  /** Hover-target signal (true while the pointer is over an interactive element). Only the cursor engine reacts to it; every other engine no-ops it, same as their unused setPointer/setDensity hooks. */
  setHover(hovering: boolean): void;
  /** Return `false` to ask the (main-thread) host to park its rAF loop until the next pointer/theme change. */
  tick(time: number): boolean | void;
  dispose(): void;
}
