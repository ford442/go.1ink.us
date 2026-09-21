import type { Canvas2D, Engine, EngineInitOptions } from './types';
import type { ThemeId } from '../../../types';

const DOT_RADIUS = 3;
const RING_RADIUS = 16;
const RING_HOVER_SCALE = 1.5;
const RING_EASE = 0.15;
// Frames the ring may keep lerping after the pointer stops before tick() asks
// to park — mirrors the DOM version's IDLE_FRAME_BUDGET at 0.15 easing.
const IDLE_FRAME_BUDGET = 45;

const DOT_COLOR = '34, 211, 238'; // cyan-400
const RING_COLOR = '6, 182, 212'; // cyan-500
const RING_HOVER_FILL = 'rgba(6, 182, 212, 0.1)';
const TELEMETRY_IDLE_COLOR = 'rgba(6, 182, 212, 0.7)';
const TELEMETRY_HOVER_COLOR = '34, 211, 238';

/**
 * Canvas re-implementation of the DOM cursor (dot + lerped ring + crosshair +
 * hover brackets + X/Y telemetry readout). Trades the DOM version's
 * CSS-transition polish (animated bracket rotation/scale on hover) for
 * running through the same tick-driven protocol as every other ambient
 * effect — including, when `OffscreenCanvas` is supported, off the main
 * thread entirely via `OffscreenWorkerBackend`.
 */
export class CursorEngine implements Engine {
  private ctx: Canvas2D | null = null;
  private width = 0;
  private height = 0;
  private mouseX = 0;
  private mouseY = 0;
  private ringX = 0;
  private ringY = 0;
  private hasPointer = false;
  private hovering = false;
  private idleFrames = 0;

  init(ctx: Canvas2D, width: number, height: number, _options: EngineInitOptions): void {
    this.ctx = ctx;
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setPointer(x: number | null, y: number | null): void {
    if (x == null || y == null) return; // Keep the last known position, same as cursorTrailEngine.
    this.mouseX = x;
    this.mouseY = y;
    this.hasPointer = true;
    this.idleFrames = 0;
  }

  setTheme(_accentRgb: string, _theme: ThemeId): void {
    // The cursor is always cyan, matching the DOM version — theme doesn't affect it.
  }

  setDensity(): void {
    // No density concept for the cursor.
  }

  setHover(hovering: boolean): void {
    this.hovering = hovering;
    this.idleFrames = 0;
  }

  tick(): boolean {
    const ctx = this.ctx;
    if (!ctx || !this.hasPointer) return false;

    this.ringX += (this.mouseX - this.ringX) * RING_EASE;
    this.ringY += (this.mouseY - this.ringY) * RING_EASE;

    ctx.clearRect(0, 0, this.width, this.height);
    // Ring (and its crosshair, which passes straight through the dot's
    // center) first, dot on top — matches the DOM version's z-index stack
    // where the dot (z-[9999]) sat above the ring (z-[9998]).
    this.drawRing(ctx);
    this.drawDot(ctx);
    this.drawTelemetry(ctx);

    const dx = this.mouseX - this.ringX;
    const dy = this.mouseY - this.ringY;
    if (dx * dx + dy * dy < 0.01) this.idleFrames++;
    else this.idleFrames = 0;

    return this.idleFrames < IDLE_FRAME_BUDGET;
  }

  private drawDot(ctx: Canvas2D): void {
    ctx.beginPath();
    ctx.fillStyle = `rgba(${DOT_COLOR}, 1)`;
    ctx.arc(this.mouseX, this.mouseY, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRing(ctx: Canvas2D): void {
    const radius = this.hovering ? RING_RADIUS * RING_HOVER_SCALE : RING_RADIUS;
    const cx = this.ringX;
    const cy = this.ringY;

    if (this.hovering) {
      ctx.beginPath();
      ctx.fillStyle = RING_HOVER_FILL;
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${RING_COLOR}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair.
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${RING_COLOR}, ${this.hovering ? 1 : 0.5})`;
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    if (this.hovering) this.drawBrackets(ctx, cx, cy, radius);
  }

  private drawBrackets(ctx: Canvas2D, cx: number, cy: number, radius: number): void {
    const armLength = radius * 0.35;
    const corners = [
      { x: cx - radius, y: cy - radius, dx: 1, dy: 1 },
      { x: cx + radius, y: cy - radius, dx: -1, dy: 1 },
      { x: cx - radius, y: cy + radius, dx: 1, dy: -1 },
      { x: cx + radius, y: cy + radius, dx: -1, dy: -1 },
    ];

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${DOT_COLOR}, 1)`;
    ctx.lineWidth = 2;
    for (const corner of corners) {
      ctx.moveTo(corner.x + corner.dx * armLength, corner.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(corner.x, corner.y + corner.dy * armLength);
    }
    ctx.stroke();
  }

  private drawTelemetry(ctx: Canvas2D): void {
    ctx.fillStyle = this.hovering ? `rgba(${TELEMETRY_HOVER_COLOR}, 1)` : TELEMETRY_IDLE_COLOR;
    ctx.font = '10px monospace';
    const label = `X:${Math.round(this.mouseX)} Y:${Math.round(this.mouseY)}${this.hovering ? ' LOCK' : ''}`;
    ctx.fillText(label, this.mouseX + 20, this.mouseY + 20);
  }

  dispose(): void {
    this.ctx = null;
  }
}
