/*
 * visual-core: C API for the WASM ambient-visuals backend.
 *
 * The C++ side owns simulation state only. Each tick writes a flat *draw
 * list* (32-bit words in linear memory) that the TypeScript adapter
 * (src/lib/visuals/wasm/) replays onto a Canvas2D context inside the visuals
 * worker. Nothing here touches a canvas, the DOM, or JS.
 *
 * Every constant below is mirrored in src/lib/visuals/wasm/visualCoreAbi.ts;
 * scripts/test-visual-core-wasm.mjs parses this header and fails if the two
 * drift. Bump VC_ABI_VERSION on any incompatible change to the functions,
 * effect ids, opcodes, or record layouts.
 */
#ifndef VISUAL_CORE_H
#define VISUAL_CORE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#if defined(__EMSCRIPTEN__) || defined(__wasm__)
#define VC_API __attribute__((used, visibility("default")))
#else
#define VC_API
#endif

#define VC_ABI_VERSION 1u

/* Effect ids accepted by vc_create(). */
#define VC_EFFECT_PARTICLE_NETWORK 1u
#define VC_EFFECT_STARFIELD 2u
#define VC_EFFECT_MATRIX_RAIN 3u

/*
 * Draw-list opcodes. A record is one opcode word followed by its operands;
 * the word count includes the opcode. `rgba` is packed little-endian as
 * r | g << 8 | b << 16 | a << 24 (alpha already quantized to 0-255).
 * Every other operand is an IEEE-754 float32 stored bit-for-bit in the word.
 *
 *   CLEAR_RECT    x y w h                    (5 words)
 *   FILL_RECT     x y w h rgba               (6 words)
 *   FILL_CIRCLE   x y radius rgba            (5 words)
 *   STROKE_LINE   x1 y1 x2 y2 width rgba     (7 words)
 *   FILL_GLYPH    x y glyph font_px rgba     (6 words; glyph is an index into
 *                                             the adapter's glyph table)
 *   STROKE_STREAK x1 y1 x2 y2 width rgba     (7 words; linear gradient that is
 *                                             transparent at both ends and
 *                                             `rgba` at the midpoint)
 */
#define VC_OP_CLEAR_RECT 1u
#define VC_OP_FILL_RECT 2u
#define VC_OP_FILL_CIRCLE 3u
#define VC_OP_STROKE_LINE 4u
#define VC_OP_FILL_GLYPH 5u
#define VC_OP_STROKE_STREAK 6u

/* Size of the glyph table FILL_GLYPH indexes into (matrix rain). */
#define VC_MATRIX_GLYPH_COUNT 61u

/* Hard cap on simulated particles/stars per instance, whatever the density. */
#define VC_MAX_INSTANCE_POINTS 4096u

typedef struct vc_effect_s* vc_handle;

VC_API uint32_t vc_abi_version(void);

/* Returns NULL for an unknown effect id or when allocation fails. */
VC_API vc_handle vc_create(uint32_t effect, uint32_t seed);
VC_API void vc_destroy(vc_handle handle);

/* Sets density, then sizes the instance (which seeds it). Call once, after vc_set_theme. */
VC_API void vc_init(vc_handle handle, float width, float height, float density);
VC_API void vc_resize(vc_handle handle, float width, float height);
VC_API void vc_set_theme(vc_handle handle, uint32_t r, uint32_t g, uint32_t b);
VC_API void vc_set_density(vc_handle handle, float density);
VC_API void vc_set_pointer(vc_handle handle, int32_t has_pointer, float x, float y);

/*
 * Advance one frame at `time_ms` (a rAF-style timestamp) and rebuild the draw
 * list. Returns 1 while the effect wants more frames, 0 to park until the
 * next input. A tick that is throttled (matrix rain runs at 30 fps) leaves an
 * empty draw list but still returns 1.
 */
VC_API int32_t vc_tick(vc_handle handle, double time_ms);

/* Byte offset of the draw list in linear memory; valid until the next call into this instance. */
VC_API uint32_t vc_draw_ptr(vc_handle handle);
/* Length of the draw list in 32-bit words. */
VC_API uint32_t vc_draw_len(vc_handle handle);

#ifdef __cplusplus
} /* extern "C" */
#endif

#endif /* VISUAL_CORE_H */
