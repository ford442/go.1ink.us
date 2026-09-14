import type { Canvas2D, Engine, EngineInitOptions } from './types';
import type { ThemeId } from '../../../types';
import { DEFAULT_ACCENT_RGB } from '../constants';

const LINK_DISTANCE = 118;
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE;
const MOUSE_DISTANCE = 155;
const MOUSE_DISTANCE_SQ = MOUSE_DISTANCE * MOUSE_DISTANCE;
const MAX_PARTICLES = 110;

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;

  constructor(width: number, height: number, isDense: boolean) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    const speedMultiplier = isDense ? 3 : 0.5;
    this.vx = (Math.random() - 0.5) * speedMultiplier;
    this.vy = (Math.random() - 0.5) * speedMultiplier;
    this.radius = Math.random() * (isDense ? 3 : 1.6) + (isDense ? 1 : 0.4);
  }

  update(width: number, height: number): void {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  draw(ctx: Canvas2D, color: string): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, 0.55)`;
    ctx.fill();
  }
}

/**
 * Uniform spatial hash sized to the link radius. Linking every particle to
 * every other is O(n²) — ~6k pair tests per frame at 110 particles — but two
 * particles can only be linked if they share a cell or sit in one of the eight
 * neighbours, so bucketing reduces it to roughly O(n) for a uniform spread.
 */
class SpatialGrid {
  cellSize: number;
  cols: number;
  rows: number;
  cells: number[][];

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    this.cells = Array.from({ length: this.cols * this.rows }, () => []);
  }

  clear(): void {
    for (let i = 0; i < this.cells.length; i++) this.cells[i].length = 0;
  }

  cellIndex(x: number, y: number): number {
    const col = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cellSize)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)));
    return row * this.cols + col;
  }

  insert(index: number, x: number, y: number): void {
    this.cells[this.cellIndex(x, y)].push(index);
  }

  /**
   * Call `visit(otherIndex, isOwnCell)` for each candidate neighbour of the
   * particle at (x, y). Only the forward half of the neighbourhood is scanned
   * — own cell, the cell to the right, and the three below — so a cross-cell
   * pair is visited exactly once, from whichever particle sits in the earlier
   * cell. Within the shared cell both particles see each other, so the caller
   * breaks that tie on index; it must NOT filter by index across cells, or the
   * link is dropped whenever the neighbour happens to have the lower index.
   */
  forEachNeighbor(x: number, y: number, visit: (index: number, isOwnCell: boolean) => void): void {
    const col = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cellSize)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)));

    for (let r = row; r <= Math.min(this.rows - 1, row + 1); r++) {
      const startCol = r === row ? col : Math.max(0, col - 1);
      for (let c = startCol; c <= Math.min(this.cols - 1, col + 1); c++) {
        const isOwnCell = r === row && c === col;
        const cell = this.cells[r * this.cols + c];
        for (let k = 0; k < cell.length; k++) visit(cell[k], isOwnCell);
      }
    }
  }
}

/** Canvas particle field with proximity links and pointer repulsion-free attraction lines. Density 2 = God Mode. */
export class ParticleNetworkEngine implements Engine {
  private ctx: Canvas2D | null = null;
  private width = 0;
  private height = 0;
  private particles: Particle[] = [];
  private grid: SpatialGrid | null = null;
  private accent = DEFAULT_ACCENT_RGB;
  private density = 1;
  private pointer: { x: number | null; y: number | null } = { x: null, y: null };

  init(ctx: Canvas2D, width: number, height: number, options: EngineInitOptions): void {
    this.ctx = ctx;
    this.accent = options.accentRgb;
    this.density = options.density;
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.seed();
  }

  private seed(): void {
    const isDense = this.density > 1;
    const base = Math.min(Math.floor((this.width * this.height) / 14500), MAX_PARTICLES);
    const count = Math.max(0, Math.round(base * this.density));
    this.particles = Array.from({ length: count }, () => new Particle(this.width, this.height, isDense));
    this.grid = new SpatialGrid(this.width, this.height, LINK_DISTANCE);
  }

  setPointer(x: number | null, y: number | null): void {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  setTheme(accentRgb: string, _theme: ThemeId): void {
    this.accent = accentRgb;
  }

  setDensity(density: number): void {
    this.density = density;
    this.seed();
  }

  tick(): void {
    const ctx = this.ctx;
    const grid = this.grid;
    if (!ctx || !grid) return;

    ctx.clearRect(0, 0, this.width, this.height);
    const accent = this.accent;
    const mouse = this.pointer;
    const particles = this.particles;

    grid.clear();
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(this.width, this.height);
      grid.insert(i, particles[i].x, particles[i].y);
    }

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      a.draw(ctx, accent);

      grid.forEachNeighbor(a.x, a.y, (j, isOwnCell) => {
        if (isOwnCell ? j <= i : j === i) return;
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dsq = dx * dx + dy * dy;
        if (dsq >= LINK_DISTANCE_SQ) return;

        const dist = Math.sqrt(dsq);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${accent}, ${0.28 * (1 - dist / LINK_DISTANCE)})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      if (mouse.x != null && mouse.y != null) {
        const dx = a.x - mouse.x;
        const dy = a.y - mouse.y;
        const dsq = dx * dx + dy * dy;
        if (dsq < MOUSE_DISTANCE_SQ) {
          const dist = Math.sqrt(dsq);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${accent}, ${0.55 * (1 - dist / MOUSE_DISTANCE)})`;
          ctx.lineWidth = 1.1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }

  dispose(): void {
    this.particles = [];
    this.grid = null;
    this.ctx = null;
  }
}
