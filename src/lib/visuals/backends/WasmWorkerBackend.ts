import { OffscreenWorkerBackend } from './OffscreenWorkerBackend';
import type { VisualWorkerClient } from '../VisualWorkerClient';
import type { EffectKind } from '../types';

/**
 * Worker-backed layer driven by the C++ visual core (`packages/visual-core/`)
 * instead of the JS engines. Same transfer and `postMessage` proxying as
 * `OffscreenWorkerBackend`; the only difference is the engine it requests.
 * The host never loads WASM itself: the worker fetches the core on the first
 * such request, and if it can't (fetch, compile, or ABI failure) it runs this
 * layer on the JS engine instead. That is the WASM worker -> JS worker step
 * of the fallback chain, with no round trip to the host.
 */
export class WasmWorkerBackend extends OffscreenWorkerBackend {
  constructor(kind: EffectKind, client?: VisualWorkerClient) {
    super(kind, client, 'wasm');
  }
}
