// Port of src/lib/visuals/engines/starfieldEngine.ts: twinkling stars plus
// two periodic shooting stars on the original CSS keyframe timing.
#pragma once

#include "buffer.h"
#include "effect.h"

namespace vc {

class Starfield final : public Effect {
 public:
  explicit Starfield(uint32_t seed) : Effect(seed) {}

  void init(float width, float height, float density) override;
  void resize(float width, float height) override;
  void setDensity(float density) override;
  bool tick(double timeMs) override;

  uint32_t starCount() const { return stars_.size(); }

 private:
  struct Star {
    float x;  // fraction of width, 0-1
    float y;  // fraction of height, 0-1
    float size;
    double durationMs;
    double delayMs;
  };

  void seed();
  void drawShootingStar(float fx, float fy, double delayMs, double elapsedMs);

  float width_ = 0.0f;
  float height_ = 0.0f;
  float density_ = 1.0f;
  bool started_ = false;
  double startMs_ = 0.0;
  Buffer<Star> stars_;
};

}  // namespace vc
