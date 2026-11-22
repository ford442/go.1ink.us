import type { Canvas2D } from '../engines/types';
import { VC_OP, VC_OP_WORDS } from './visualCoreAbi';

const TAU = Math.PI * 2;
// Bounds the cache across theme changes; one theme needs a handful of entries.
const MAX_CACHED_COLORS = 1024;
const ALPHA = Float64Array.from({ length: 256 }, (_, i) => i / 255);

/** Memoizes the CSS strings for the packed colours the core emits. */
export class ColorCache {
  private readonly opaqueStrings = new Map<number, string>();
  private readonly alphaStrings = new Map<number, string>();

  /** `rgb(r, g, b)` for the low 24 bits; the alpha byte is applied through `globalAlpha` instead. */
  opaque(rgba: number): string {
    const rgb = rgba & 0x00ffffff;
    let css = this.opaqueStrings.get(rgb);
    if (css === undefined) {
      if (this.opaqueStrings.size >= MAX_CACHED_COLORS) this.opaqueStrings.clear();
      css = `rgb(${rgb & 0xff}, ${(rgb >>> 8) & 0xff}, ${(rgb >>> 16) & 0xff})`;
      this.opaqueStrings.set(rgb, css);
    }
    return css;
  }

  /** `rgba(r, g, b, a)`, for gradient stops, where `globalAlpha` can't vary per stop. */
  withAlpha(rgba: number): string {
    let css = this.alphaStrings.get(rgba);
    if (css === undefined) {
      if (this.alphaStrings.size >= MAX_CACHED_COLORS) this.alphaStrings.clear();
      // Four decimals still round-trip every 8-bit alpha level exactly.
      const alpha = Number(ALPHA[rgba >>> 24]!.toFixed(4));
      css = `rgba(${rgba & 0xff}, ${(rgba >>> 8) & 0xff}, ${(rgba >>> 16) & 0xff}, ${alpha})`;
      this.alphaStrings.set(rgba, css);
    }
    return css;
  }
}

/**
 * Replays one tick's draw list (`[start, end)` in 32-bit words) onto a
 * Canvas2D context. `words` and `floats` are two views over the same wasm
 * memory: opcodes, colours and glyph indices are read as uint32, every other
 * operand as float32.
 *
 * Each primitive's alpha goes through `globalAlpha` over an opaque
 * `rgb(...)` style, the way the JS starfield already draws, rather than a
 * fresh `rgba(...)` string per primitive the way the JS particle network
 * does. The pixels are identical, but the canvas only parses a colour string
 * when the RGB changes (about once per frame per effect) instead of once per
 * link. `globalAlpha` is restored to 1 afterwards, which every engine
 * assumes on entry.
 *
 * Stops at the first unknown opcode or truncated record rather than
 * misreading the rest of the buffer. Returns the number of records drawn.
 */
export function replayDrawList(
  ctx: Canvas2D,
  words: Uint32Array,
  floats: Float32Array,
  start: number,
  end: number,
  colors: ColorCache,
  glyphs: readonly string[],
): number {
  const limit = Math.min(end, words.length);
  // Last values written, so unchanged state isn't re-assigned (-1: not yet set this replay).
  let fillRgb = -1;
  let strokeRgb = -1;
  let alpha = -1;
  let lineWidth = -1;
  let fontPx = -1;
  let records = 0;
  let i = start;

  while (i < limit) {
    const op = words[i]!;
    const size = VC_OP_WORDS[op];
    if (size === undefined || i + size > limit) break;

    switch (op) {
      case VC_OP.CLEAR_RECT:
        ctx.clearRect(floats[i + 1]!, floats[i + 2]!, floats[i + 3]!, floats[i + 4]!);
        break;

      case VC_OP.FILL_RECT: {
        const rgba = words[i + 5]!;
        const rgb = rgba & 0x00ffffff;
        if (rgb !== fillRgb) ctx.fillStyle = colors.opaque((fillRgb = rgb));
        const a = ALPHA[rgba >>> 24]!;
        if (a !== alpha) ctx.globalAlpha = alpha = a;
        ctx.fillRect(floats[i + 1]!, floats[i + 2]!, floats[i + 3]!, floats[i + 4]!);
        break;
      }

      case VC_OP.FILL_CIRCLE: {
        ctx.beginPath();
        ctx.arc(floats[i + 1]!, floats[i + 2]!, floats[i + 3]!, 0, TAU);
        const rgba = words[i + 4]!;
        const rgb = rgba & 0x00ffffff;
        if (rgb !== fillRgb) ctx.fillStyle = colors.opaque((fillRgb = rgb));
        const a = ALPHA[rgba >>> 24]!;
        if (a !== alpha) ctx.globalAlpha = alpha = a;
        ctx.fill();
        break;
      }

      case VC_OP.STROKE_LINE: {
        ctx.beginPath();
        const rgba = words[i + 6]!;
        const rgb = rgba & 0x00ffffff;
        if (rgb !== strokeRgb) ctx.strokeStyle = colors.opaque((strokeRgb = rgb));
        const a = ALPHA[rgba >>> 24]!;
        if (a !== alpha) ctx.globalAlpha = alpha = a;
        const width = floats[i + 5]!;
        if (width !== lineWidth) ctx.lineWidth = lineWidth = width;
        ctx.moveTo(floats[i + 1]!, floats[i + 2]!);
        ctx.lineTo(floats[i + 3]!, floats[i + 4]!);
        ctx.stroke();
        break;
      }

      case VC_OP.FILL_GLYPH: {
        const rgba = words[i + 5]!;
        const rgb = rgba & 0x00ffffff;
        if (rgb !== fillRgb) ctx.fillStyle = colors.opaque((fillRgb = rgb));
        const a = ALPHA[rgba >>> 24]!;
        if (a !== alpha) ctx.globalAlpha = alpha = a;
        const px = floats[i + 4]!;
        if (px !== fontPx) {
          fontPx = px;
          ctx.font = `${px}px monospace`;
        }
        ctx.fillText(glyphs[words[i + 3]!] ?? '', floats[i + 1]!, floats[i + 2]!);
        break;
      }

      case VC_OP.STROKE_STREAK: {
        const x1 = floats[i + 1]!;
        const y1 = floats[i + 2]!;
        const x2 = floats[i + 3]!;
        const y2 = floats[i + 4]!;
        const rgba = words[i + 6]!;
        const clear = colors.withAlpha(rgba & 0x00ffffff);
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, clear);
        gradient.addColorStop(0.5, colors.withAlpha(rgba));
        gradient.addColorStop(1, clear);
        // The stops carry the alpha; globalAlpha would multiply into them.
        if (alpha !== 1) ctx.globalAlpha = alpha = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        const width = floats[i + 5]!;
        if (width !== lineWidth) ctx.lineWidth = lineWidth = width;
        ctx.strokeStyle = gradient;
        strokeRgb = -1;
        ctx.stroke();
        break;
      }
    }

    records++;
    i += size;
  }

  if (alpha !== -1 && alpha !== 1) ctx.globalAlpha = 1;
  return records;
}
