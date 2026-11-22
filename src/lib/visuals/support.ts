import { isWasmEffect } from './wasm/visualCoreAbi';
import type { EffectKind } from './types';

/** Feature-detect `OffscreenCanvas` + `transferControlToOffscreen` before ever spawning the visuals worker. */
export function supportsOffscreenCanvas(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof OffscreenCanvas === 'undefined') return false;
  return typeof HTMLCanvasElement !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype;
}

export function supportsWebAssembly(): boolean {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
}

/** Whether a worker layer for `effect` may request the WASM core: the core implements it and the browser runs WASM. */
export function supportsWasmVisualCore(effect: EffectKind): boolean {
  return isWasmEffect(effect) && supportsWebAssembly();
}
