# visual-core

C++20 simulation core for the hub's ambient visuals, compiled to WebAssembly with Emscripten. It
ports three of the TypeScript engines in `src/lib/visuals/engines/`: `particleNetworkEngine`,
`starfieldEngine` and `matrixRainEngine`. The visuals worker runs it in Full performance mode
through `WasmWorkerBackend`.

The core only simulates. Each `vc_tick` writes a flat draw list into linear memory, and
`src/lib/visuals/wasm/drawList.ts` replays it onto the layer's canvas, so text, gradients and
anti-aliasing still come from the browser. The module is a standalone reactor (`--no-entry`), so
there is no Emscripten JS glue: its one import is `env.emscripten_notify_memory_growth`.

## Building

You only need this when changing the C++. `npm run build` uses the committed
`src/lib/visuals/wasm/visual-core.wasm`.

```bash
# once: the version CI pins (see EMSDK_VERSION)
git clone https://github.com/emscripten-core/emsdk.git
./emsdk/emsdk install 4.0.15 && ./emsdk/emsdk activate 4.0.15
source ./emsdk/emsdk_env.sh

# from the repo root: configure, build, copy the .wasm into src/, then commit it
npm run build:wasm
npm run test:unit
```

The build is byte-for-byte deterministic for a given Emscripten version, so CI
(`.github/workflows/wasm.yml`) rebuilds it and fails if the committed binary is stale.

## Editor support (clangd / Cursor)

The build writes `build/compile_commands.json`, plus a `compile_commands.json` symlink here (both
gitignored), and the repo-root `.clangd` points at it. CMake spells out em++'s implicit wasm target
and sysroot, so clangd resolves `<cmath>`/`<new>` without `--query-driver`. With no Emscripten
installed, a native configure produces the same database for IDE use:

```bash
cmake -S packages/visual-core -B packages/visual-core/build
```

(`npm run build:wasm` replaces a native build tree automatically.)

## Changing the ABI

`include/visual_core.h` is the contract: functions, effect ids, draw-list opcodes and record
layouts. `src/lib/visuals/wasm/visualCoreAbi.ts` mirrors it by hand, and
`scripts/test-visual-core-wasm.mjs` parses the header and fails on drift. For any incompatible
change, bump `VC_ABI_VERSION` in both places. A stale binary is then rejected at load time and the
worker falls back to the JS engines, rather than misreading memory. New exports also go in
`VISUAL_CORE_EXPORTS` in `CMakeLists.txt`.

## Conventions

- Build flags: `-O3 -fno-exceptions -fno-rtti`, and `-Werror` under Emscripten. Growable storage
  goes through `src/buffer.h`, which reports allocation failure instead of aborting.
- Keep each port's behaviour aligned with its TS engine: constants, bounce and wrap rules, draw
  order. The Node tests compare the two.
- No SIMD (`-msimd128`) until a measurement justifies it (`npm run bench:visual-core`).
