#include "matrix_rain.h"

#include <math.h>

namespace vc {
namespace {

constexpr float kFontPx = 16.0f;
constexpr double kFrameIntervalMs = 1000.0 / 30.0;
constexpr Rgb kBlack{0, 0, 0};

uint32_t columnsFor(float width) {
  const float columns = floorf(width / kFontPx);
  if (!(columns > 0.0f)) return 0;
  if (columns > VC_MAX_INSTANCE_POINTS) return VC_MAX_INSTANCE_POINTS;
  return static_cast<uint32_t>(columns);
}

}  // namespace

void MatrixRain::init(float width, float height, float /*density*/) {
  // Matrix rain has no density: the column count comes from the width alone.
  resize(width, height);
}

void MatrixRain::resize(float width, float height) {
  width_ = width;
  height_ = height;
  if (!drops_.assign(columnsFor(width), 1.0f)) drops_.clear();
}

bool MatrixRain::tick(double timeMs) {
  draw_.clear();
  if (timeMs - lastFrameMs_ < kFrameIntervalMs) return true;
  lastFrameMs_ = timeMs;

  // Translucent black over the previous frame is what draws the fading tails.
  draw_.fillRect(0.0f, 0.0f, width_, height_, packRgba(kBlack, 0.05f));

  const uint32_t glyphColor = packRgba(color_, 1.0f);
  for (uint32_t i = 0; i < drops_.size(); ++i) {
    float drop = drops_[i];
    draw_.fillGlyph(static_cast<float>(i) * kFontPx, drop * kFontPx, rng_.below(VC_MATRIX_GLYPH_COUNT),
                    kFontPx, glyphColor);
    if (drop * kFontPx > height_ && rng_.unit() > 0.975) drop = 0.0f;
    drops_[i] = drop + 1.0f;
  }
  return true;
}

}  // namespace vc
