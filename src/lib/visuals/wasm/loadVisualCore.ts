import type { Engine } from '../engines/types';
import type { EffectKind } from '../types';
import { WasmEngine } from './WasmEngine';
import {
  REQUIRED_VISUAL_CORE_FUNCTIONS,
  VC_EFFECT,
  VISUAL_CORE_ABI_VERSION,
  WASM_VISUAL_EFFECTS,
  isWasmEffect,
} from './visualCoreAbi';
import type { VisualCoreExports } from './visualCoreAbi';

/** A loaded, ABI-checked visual core: a factory for wasm-backed engines. */
export interface VisualCore {
  readonly effects: ReadonlySet<EffectKind>;
  /** A wasm-backed engine, or null for an effect the core doesn't implement (the caller uses the JS engine). */
  createEngine(effect: EffectKind): Engine | null;
}

/**
 * The module's only import. Standalone Emscripten builds with memory growth
 * call it after `memory.grow`; there is nothing to do here because
 * `WasmEngine` re-creates its typed-array views whenever the buffer changes.
 */
const IMPORTS: WebAssembly.Imports = {
  env: {
    emscripten_notify_memory_growth: () => {},
  },
};

/** Where Vite emits the prebuilt core: a hashed asset outside the modulePreload graph. */
export function visualCoreUrl(): URL {
  return new URL('./visual-core.wasm', import.meta.url);
}

function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}

/** Validates an instantiated `visual-core.wasm` and wraps it. Throws on a missing export or ABI mismatch. */
export function createVisualCore(instance: WebAssembly.Instance): VisualCore {
  const raw = instance.exports as Record<string, unknown>;
  if (!(raw.memory instanceof WebAssembly.Memory)) {
    throw new Error('visual core: missing exported memory');
  }
  for (const name of REQUIRED_VISUAL_CORE_FUNCTIONS) {
    if (typeof raw[name] !== 'function') throw new Error(`visual core: missing export ${name}`);
  }
  // Checked field by field above; the export object's shape can't be narrowed any other way.
  const core = raw as unknown as VisualCoreExports;

  const abi = core.vc_abi_version();
  if (abi !== VISUAL_CORE_ABI_VERSION) {
    throw new Error(`visual core: ABI ${abi}, adapter expects ${VISUAL_CORE_ABI_VERSION}; rebuild with npm run build:wasm`);
  }
  core._initialize?.();

  return {
    effects: WASM_VISUAL_EFFECTS,
    createEngine(effect) {
      if (!isWasmEffect(effect)) return null;
      const handle = core.vc_create(VC_EFFECT[effect], randomSeed());
      return handle ? new WasmEngine(core, effect, handle) : null;
    },
  };
}

export async function instantiateVisualCore(bytes: BufferSource): Promise<VisualCore> {
  const { instance } = await WebAssembly.instantiate(bytes, IMPORTS);
  return createVisualCore(instance);
}

/**
 * Fetches and instantiates the core. Prefers streaming compilation, and
 * falls back to compiling from an ArrayBuffer when a static host serves the
 * file without `Content-Type: application/wasm` (which makes
 * `instantiateStreaming` reject).
 */
export async function loadVisualCore(
  url: URL | string = visualCoreUrl(),
  fetchImpl: typeof fetch = fetch,
): Promise<VisualCore> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`visual core: HTTP ${response.status} fetching ${String(url)}`);

  if (typeof WebAssembly.instantiateStreaming === 'function') {
    const fallback = response.clone();
    let streamed: WebAssembly.WebAssemblyInstantiatedSource;
    try {
      streamed = await WebAssembly.instantiateStreaming(response, IMPORTS);
    } catch {
      return instantiateVisualCore(await fallback.arrayBuffer());
    }
    // Outside the try: an ABI mismatch is a real error, not a reason to re-compile.
    return createVisualCore(streamed.instance);
  }
  return instantiateVisualCore(await response.arrayBuffer());
}
