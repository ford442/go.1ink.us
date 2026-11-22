// Draw-list encoder. Record layouts are documented next to the opcodes in
// include/visual_core.h and decoded by src/lib/visuals/wasm/drawList.ts.
#pragma once

#include <stdint.h>
#include <string.h>

#include "buffer.h"
#include "visual_core.h"

namespace vc {

struct Rgb {
  uint8_t r;
  uint8_t g;
  uint8_t b;
};

// Canvas backing stores keep 8 bits of alpha, so quantizing here loses
// nothing visible. A fully transparent primitive packs to alpha 0, which the
// encoder below drops instead of emitting an invisible draw call.
inline uint32_t packRgba(Rgb color, float alpha) {
  if (!(alpha > 0.0f)) alpha = 0.0f;  // also catches NaN
  if (alpha > 1.0f) alpha = 1.0f;
  const uint32_t a = static_cast<uint32_t>(alpha * 255.0f + 0.5f);
  return static_cast<uint32_t>(color.r) | (static_cast<uint32_t>(color.g) << 8) |
         (static_cast<uint32_t>(color.b) << 16) | (a << 24);
}

inline bool isTransparent(uint32_t rgba) { return (rgba >> 24) == 0; }

class DrawList {
 public:
  void clear() { words_.clear(); }
  const uint32_t* data() const { return words_.data(); }
  uint32_t size() const { return words_.size(); }

  void clearRect(float x, float y, float w, float h) {
    uint32_t* out = words_.append(5);
    if (!out) return;
    out[0] = VC_OP_CLEAR_RECT;
    put(out + 1, x);
    put(out + 2, y);
    put(out + 3, w);
    put(out + 4, h);
  }

  void fillRect(float x, float y, float w, float h, uint32_t rgba) {
    if (isTransparent(rgba)) return;
    uint32_t* out = words_.append(6);
    if (!out) return;
    out[0] = VC_OP_FILL_RECT;
    put(out + 1, x);
    put(out + 2, y);
    put(out + 3, w);
    put(out + 4, h);
    out[5] = rgba;
  }

  void fillCircle(float x, float y, float radius, uint32_t rgba) {
    if (isTransparent(rgba)) return;
    uint32_t* out = words_.append(5);
    if (!out) return;
    out[0] = VC_OP_FILL_CIRCLE;
    put(out + 1, x);
    put(out + 2, y);
    put(out + 3, radius);
    out[4] = rgba;
  }

  void strokeLine(float x1, float y1, float x2, float y2, float width, uint32_t rgba) {
    segment(VC_OP_STROKE_LINE, x1, y1, x2, y2, width, rgba);
  }

  void strokeStreak(float x1, float y1, float x2, float y2, float width, uint32_t rgba) {
    segment(VC_OP_STROKE_STREAK, x1, y1, x2, y2, width, rgba);
  }

  void fillGlyph(float x, float y, uint32_t glyph, float fontPx, uint32_t rgba) {
    if (isTransparent(rgba)) return;
    uint32_t* out = words_.append(6);
    if (!out) return;
    out[0] = VC_OP_FILL_GLYPH;
    put(out + 1, x);
    put(out + 2, y);
    out[3] = glyph;
    put(out + 4, fontPx);
    out[5] = rgba;
  }

 private:
  static void put(uint32_t* slot, float value) { memcpy(slot, &value, sizeof(float)); }

  void segment(uint32_t op, float x1, float y1, float x2, float y2, float width, uint32_t rgba) {
    if (isTransparent(rgba)) return;
    uint32_t* out = words_.append(7);
    if (!out) return;
    out[0] = op;
    put(out + 1, x1);
    put(out + 2, y1);
    put(out + 3, x2);
    put(out + 4, y2);
    put(out + 5, width);
    out[6] = rgba;
  }

  Buffer<uint32_t> words_;
};

}  // namespace vc
