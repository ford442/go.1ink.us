import type { Canvas2D, Engine, EngineInitOptions } from './types';
import type { ThemeId } from '../../../types';
import { DEFAULT_ACCENT_RGB } from '../constants';

interface TrailParticle {
  x: number;
  y: number;
  life: number;
  size: number;
}

// Upper bound on live trail particles. `life` decay (see tick()) already
// retires a particle in ~50 frames, but a burst of pointer moves within that
// window — a fast swipe, or a tick() starved by a busy main thread — can
// spawn faster than they decay; this caps how far that can run away.
const MAX_PARTICLES = 60;

/** Fading particle trail that follows the pointer. Parks itself (via `tick` returning `false`) once it has nothing left to draw. */
export class CursorTrailEngine implements Engine {
  private ctx: Canvas2D | null = null;
  private width = 0;
  private height = 0;
  private particles: TrailParticle[] = [];
  private accent = DEFAULT_ACCENT_RGB;
  private lastSpawn: { x: number | null; y: number | null } = { x: null, y: null };

  init(ctx: Canvas2D, width: number, height: number, options: EngineInitOptions): void {
    this.ctx = ctx;
    this.accent = options.accentRgb;
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setPointer(x: number | null, y: number | null): void {
    if (x == null || y == null) return;
    // Only spawn on an actual pointer move, so an idle cursor lets the trail
    // fade out and the loop park instead of endlessly stamping particles.
    if (x === this.lastSpawn.x && y === this.lastSpawn.y) return;
    this.lastSpawn.x = x;
    this.lastSpawn.y = y;
    this.particles.push({ x, y, life: 1.0, size: Math.random() * 4 + 2 });
    if (this.particles.length > MAX_PARTICLES) this.particles.shift();
  }

  setTheme(accentRgb: string, _theme: ThemeId): void {
    this.accent = accentRgb;
  }

  setDensity(): void {
    // No density concept for the cursor trail.
  }

  setHover(): void {
    // Cursor trail doesn't react to hover.
  }

  tick(): boolean {
    const ctx = this.ctx;
    if (!ctx || this.particles.length === 0) return false;

    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= 0.02;
      p.y -= 0.5;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        if (this.particles.length === 0) {
          // Clear once more so no stale pixels linger once the last particle dies.
          ctx.clearRect(0, 0, this.width, this.height);
        }
        continue;
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(${this.accent}, ${p.life * 0.5})`;
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    return true;
  }

  dispose(): void {
    this.particles = [];
    this.ctx = null;
  }
}
