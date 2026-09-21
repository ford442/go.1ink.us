import type { Canvas2D, Engine, EngineInitOptions } from './types';
import type { ThemeId } from '../../../types';

interface Star {
  x: number; // fraction of canvas width, 0-1
  y: number; // fraction of canvas height, 0-1
  size: number;
  duration: number; // ms, matches the CSS `animation-duration` random range
  delay: number; // ms, matches the CSS `animation-delay` random range
}

interface ShootingStar {
  x: number; // fraction of canvas width, 0-1
  y: number; // fraction of canvas height, 0-1
  delay: number; // ms, matches the original `.shooting-star` animationDelay
}

const STAR_BASE_COUNT = 75;
// Mirrors `@keyframes shoot` (App.base.css): a 10s cycle, visible only for the
// first 10% of it, fading in over the first 2%.
const CYCLE_MS = 10000;
const TRAVEL_FRACTION = 0.1;
const FADE_IN_FRACTION = 0.02;
const TRAVEL_DISTANCE = 1600;
const TAIL_LENGTH = 150;
// The original DOM streaks sat in a container rotated 315deg (-45deg); a
// local +x translate under that rotation reads on screen as up-and-right.
const DIRECTION = { x: Math.cos(-Math.PI / 4), y: Math.sin(-Math.PI / 4) };

/** Canvas re-implementation of the DOM/CSS starfield: twinkling stars + two periodic shooting stars. */
export class StarfieldEngine implements Engine {
  private ctx: Canvas2D | null = null;
  private width = 0;
  private height = 0;
  private density = 1;
  private stars: Star[] = [];
  private startTime: number | null = null;
  private readonly shootingStars: ShootingStar[] = [
    { x: 0.5, y: 0.2, delay: 5000 },
    { x: 0.3, y: 0.6, delay: 12000 },
  ];

  init(ctx: Canvas2D, width: number, height: number, options: EngineInitOptions): void {
    this.ctx = ctx;
    this.density = options.density;
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.seed();
  }

  private seed(): void {
    const count = Math.max(0, Math.round(STAR_BASE_COUNT * this.density));
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() < 0.1 ? 3 : Math.random() < 0.4 ? 2 : 1,
      duration: (Math.random() * 3 + 2) * 1000,
      delay: Math.random() * 5000,
    }));
  }

  setPointer(_x: number | null, _y: number | null): void {
    // Starfield doesn't react to the pointer.
  }

  setTheme(_accentRgb: string, _theme: ThemeId): void {
    // Stars are always white; theme doesn't affect the starfield.
  }

  setDensity(density: number): void {
    this.density = density;
    this.seed();
  }

  setHover(): void {
    // Starfield doesn't react to hover.
  }

  tick(time: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.startTime === null) this.startTime = time;

    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#fff';
    for (const star of this.stars) {
      const cycle = ((time + star.delay) % star.duration) / star.duration;
      // 0 -> 1 -> 0 across the cycle, matching the twinkle keyframe's 0%/50%/100% shape.
      const wave = Math.sin(cycle * Math.PI);
      ctx.globalAlpha = 0.3 + wave * 0.7;
      ctx.beginPath();
      ctx.arc(star.x * this.width, star.y * this.height, (star.size / 2) * (0.8 + wave * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Relative to this engine's own first tick, not the rAF/worker timestamp
    // origin, so `delay` always means "this long after the starfield appeared" —
    // matching CSS `animation-delay` semantics — regardless of when it mounted.
    const elapsed = time - this.startTime;
    for (const star of this.shootingStars) this.drawShootingStar(ctx, star, elapsed);
  }

  private drawShootingStar(ctx: Canvas2D, star: ShootingStar, elapsed: number): void {
    if (elapsed < star.delay) return;
    const cycle = ((elapsed - star.delay) % CYCLE_MS) / CYCLE_MS;
    if (cycle > TRAVEL_FRACTION) return;

    const progress = cycle / TRAVEL_FRACTION;
    const opacity = cycle < FADE_IN_FRACTION ? cycle / FADE_IN_FRACTION : 1 - progress;
    if (opacity <= 0) return;

    const startX = star.x * this.width;
    const startY = star.y * this.height;
    const travel = progress * TRAVEL_DISTANCE;
    const headX = startX + DIRECTION.x * travel;
    const headY = startY + DIRECTION.y * travel;
    const tailX = headX - DIRECTION.x * TAIL_LENGTH;
    const tailY = headY - DIRECTION.y * TAIL_LENGTH;

    const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, `rgba(255,255,255,${opacity})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(headX, headY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }

  dispose(): void {
    this.stars = [];
    this.ctx = null;
  }
}
