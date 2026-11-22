import type { EffectKind } from '../types';

/**
 * TypeScript mirror of packages/visual-core/include/visual_core.h. Kept
 * hand-written (no codegen step) and pinned by scripts/test-visual-core-wasm.mjs,
 * which parses the header and fails on any drift. This module is constants
 * only, so the host can import `WASM_VISUAL_EFFECTS` without pulling the
 * adapter or the `.wasm` anywhere near the entry chunk.
 */
export const VISUAL_CORE_ABI_VERSION = 1;

/** Effect ids for `vc_create`. Effects missing here always run on the JS engines. */
export const VC_EFFECT = {
  particleNetwork: 1,
  starfield: 2,
  matrixRain: 3,
} as const satisfies Partial<Record<EffectKind, number>>;

export type WasmEffectKind = keyof typeof VC_EFFECT;

export const WASM_VISUAL_EFFECTS: ReadonlySet<EffectKind> = new Set(Object.keys(VC_EFFECT) as WasmEffectKind[]);

export function isWasmEffect(effect: EffectKind): effect is WasmEffectKind {
  return WASM_VISUAL_EFFECTS.has(effect);
}

/** Draw-list opcodes; see the record layouts documented in visual_core.h. */
export const VC_OP = {
  CLEAR_RECT: 1,
  FILL_RECT: 2,
  FILL_CIRCLE: 3,
  STROKE_LINE: 4,
  FILL_GLYPH: 5,
  STROKE_STREAK: 6,
} as const;

/** Words per record, opcode included. */
export const VC_OP_WORDS: Readonly<Record<number, number>> = {
  [VC_OP.CLEAR_RECT]: 5,
  [VC_OP.FILL_RECT]: 6,
  [VC_OP.FILL_CIRCLE]: 5,
  [VC_OP.STROKE_LINE]: 7,
  [VC_OP.FILL_GLYPH]: 6,
  [VC_OP.STROKE_STREAK]: 7,
};

export const VC_MATRIX_GLYPH_COUNT = 61;
export const VC_MAX_INSTANCE_POINTS = 4096;

/** Opaque `vc_handle` — a pointer into the module's linear memory; 0 is NULL. */
export type VcHandle = number;

/** The exports `visual_core.wasm` must provide; checked at instantiation by `createVisualCore`. */
export interface VisualCoreExports {
  memory: WebAssembly.Memory;
  /** Reactor-module constructor runner emitted by `--no-entry` builds; call once before anything else. */
  _initialize?: () => void;
  vc_abi_version(): number;
  vc_create(effect: number, seed: number): VcHandle;
  vc_destroy(handle: VcHandle): void;
  vc_init(handle: VcHandle, width: number, height: number, density: number): void;
  vc_resize(handle: VcHandle, width: number, height: number): void;
  vc_set_theme(handle: VcHandle, r: number, g: number, b: number): void;
  vc_set_density(handle: VcHandle, density: number): void;
  vc_set_pointer(handle: VcHandle, hasPointer: number, x: number, y: number): void;
  vc_tick(handle: VcHandle, timeMs: number): number;
  vc_draw_ptr(handle: VcHandle): number;
  vc_draw_len(handle: VcHandle): number;
}

export const REQUIRED_VISUAL_CORE_FUNCTIONS = [
  'vc_abi_version',
  'vc_create',
  'vc_destroy',
  'vc_init',
  'vc_resize',
  'vc_set_theme',
  'vc_set_density',
  'vc_set_pointer',
  'vc_tick',
  'vc_draw_ptr',
  'vc_draw_len',
] as const satisfies readonly (keyof VisualCoreExports)[];
