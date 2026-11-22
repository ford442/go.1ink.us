// Port of src/lib/visuals/engines/matrixRainEngine.ts: falling glyph columns
// over a translucent fade, throttled to 30 fps whatever the host's rate.
#pragma once

#include "buffer.h"
#include "effect.h"

namespace vc {

class MatrixRain final : public Effect {
 public:
  explicit MatrixRain(uint32_t seed) : Effect(seed) {}

  void init(float width, float height, float density) override;
  void resize(float width, float height) override;
  void setTheme(Rgb color) override { color_ = color; }
  bool tick(double timeMs) override;

  uint32_t columnCount() const { return drops_.size(); }

 private:
  float width_ = 0.0f;
  float height_ = 0.0f;
  double lastFrameMs_ = 0.0;
  Rgb color_{6, 182, 212};  // cyan-500, the JS engine's default theme colour
  Buffer<float> drops_;     // row index of each column's head
};

}  // namespace vc
