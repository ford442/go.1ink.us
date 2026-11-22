import { DEFAULT_ACCENT_RGB } from '../constants';
import { MATRIX_GLYPHS, matrixThemeColor } from '../engines/matrixRainEngine';
import type { Canvas2D, Engine, EngineInitOptions } from '../engines/types';
import { ColorCache, replayDrawList } from './drawList';
import type { VcHandle, VisualCoreExports, WasmEffectKind } from './visualCoreAbi';
import type { ThemeId } from '../../../types';

type Rgb = readonly [number, number, number];

const DEFAULT_RGB: Rgb = parseRgb(DEFAULT_ACCENT_RGB) ?? [34, 211, 238];

/** Parses the `"r, g, b"` triplet `--rgb-accent-400` holds (the form every JS engine splices into `rgba(...)`). */
export function parseRgb(value: string): Rgb | null {
  const parts = value.split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.length !== 3 || !parts.every((n) => Number.isFinite(n))) return null;
  const [r, g, b] = parts.map((n) => Math.max(0, Math.min(255, Math.round(n)))) as [number, number, number];
  return [r, g, b];
}

function hexToRgb(hex: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const n = Number.parseInt(match[1]!, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * The colour each effect's C++ side is themed with — the same source its JS
 * engine reads: matrix rain uses the theme's fixed rain colour, every other
 * effect the live accent (the starfield ignores it; its stars are white).
 */
function themeRgb(effect: WasmEffectKind, accentRgb: string, theme: ThemeId): Rgb {
  if (effect === 'matrixRain') return hexToRgb(matrixThemeColor(theme)) ?? DEFAULT_RGB;
  return parseRgb(accentRgb) ?? DEFAULT_RGB;
}

/**
 * `Engine` adapter over one C++ effect instance in the visual core. The
 * simulation runs in wasm; each tick the core writes a draw list into its
 * linear memory and this replays it onto the layer's Canvas2D context, so
 * text, gradients and anti-aliasing all still come from the browser's canvas
 * exactly as they do for the JS engines.
 */
export class WasmEngine implements Engine {
  private ctx: Canvas2D | null = null;
  private handle: VcHandle;
  private readonly colors = new ColorCache();
  // Views are rebuilt whenever memory grows (growth detaches the old buffer).
  private buffer: ArrayBuffer | null = null;
  private words = new Uint32Array(0);
  private floats = new Float32Array(0);

  constructor(
    private readonly core: VisualCoreExports,
    readonly effect: WasmEffectKind,
    handle: VcHandle,
  ) {
    this.handle = handle;
  }

  init(ctx: Canvas2D, width: number, height: number, options: EngineInitOptions): void {
    this.ctx = ctx;
    this.setTheme(options.accentRgb, options.theme);
    this.core.vc_init(this.handle, width, height, options.density);
  }

  resize(width: number, height: number): void {
    this.core.vc_resize(this.handle, width, height);
  }

  setPointer(x: number | null, y: number | null): void {
    const hasPointer = x != null && y != null;
    this.core.vc_set_pointer(this.handle, hasPointer ? 1 : 0, hasPointer ? x : 0, hasPointer ? y : 0);
  }

  setTheme(accentRgb: string, theme: ThemeId): void {
    const [r, g, b] = themeRgb(this.effect, accentRgb, theme);
    this.core.vc_set_theme(this.handle, r, g, b);
  }

  setDensity(density: number): void {
    this.core.vc_set_density(this.handle, density);
  }

  setHover(): void {
    // None of the effects the core implements react to hover.
  }

  tick(time: number): boolean {
    const ctx = this.ctx;
    if (!ctx || !this.handle) return false;

    const keepRunning = this.core.vc_tick(this.handle, time) !== 0;
    const length = this.core.vc_draw_len(this.handle);
    if (length > 0) {
      const buffer = this.core.memory.buffer;
      if (buffer !== this.buffer) {
        this.buffer = buffer;
        this.words = new Uint32Array(buffer);
        this.floats = new Float32Array(buffer);
      }
      const start = this.core.vc_draw_ptr(this.handle) >>> 2;
      replayDrawList(ctx, this.words, this.floats, start, start + length, this.colors, MATRIX_GLYPHS);
    }
    return keepRunning;
  }

  dispose(): void {
    if (this.handle) this.core.vc_destroy(this.handle);
    this.handle = 0;
    this.ctx = null;
    this.buffer = null;
  }
}
