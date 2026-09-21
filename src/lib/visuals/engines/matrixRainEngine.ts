import type { Canvas2D, Engine, EngineInitOptions } from './types';
import type { ThemeId } from '../../../types';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}[]|;:,.<>?/~'.split('');
const FONT_SIZE = 16;
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;

function themeColor(theme: ThemeId): string {
  switch (theme) {
    case 'purple': return '#d946ef'; // fuchsia-500
    case 'emerald': return '#10b981'; // emerald-500
    case 'gold': return '#fbbf24'; // amber-400
    case 'cyan':
    default: return '#06b6d4'; // cyan-500
  }
}

/** Falling-character rain, throttled to 30fps independent of the host's frame rate. */
export class MatrixRainEngine implements Engine {
  private ctx: Canvas2D | null = null;
  private width = 0;
  private height = 0;
  private drops: number[] = [];
  private columns = 0;
  private lastTime = 0;
  private theme: ThemeId = 'cyan';

  init(ctx: Canvas2D, width: number, height: number, options: EngineInitOptions): void {
    this.ctx = ctx;
    this.theme = options.theme;
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.columns = Math.floor(width / FONT_SIZE);
    this.drops = new Array(Math.max(this.columns, 0)).fill(1);
  }

  setPointer(): void {
    // Matrix rain doesn't react to the pointer.
  }

  setTheme(_accentRgb: string, theme: ThemeId): void {
    this.theme = theme;
  }

  setDensity(): void {
    // No density concept for matrix rain — column count is derived from width alone.
  }

  tick(time: number): void {
    if (time - this.lastTime < FRAME_INTERVAL) return;
    this.lastTime = time;

    const ctx = this.ctx;
    if (!ctx) return;

    // Re-seed the drop columns whenever the canvas width changed under us.
    const columns = Math.floor(this.width / FONT_SIZE);
    if (columns !== this.columns) {
      this.columns = columns;
      this.drops = new Array(Math.max(columns, 0)).fill(1);
    }
    const drops = this.drops;

    // Translucent black background to create fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = themeColor(this.theme);
    ctx.font = `${FONT_SIZE}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = CHARS[Math.floor(Math.random() * CHARS.length)]!;
      let drop = drops[i]!;
      ctx.fillText(text, i * FONT_SIZE, drop * FONT_SIZE);

      if (drop * FONT_SIZE > this.height && Math.random() > 0.975) {
        drop = 0;
      }
      drops[i] = drop + 1;
    }
  }

  dispose(): void {
    this.drops = [];
    this.ctx = null;
  }
}
