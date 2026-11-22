// Port of src/lib/visuals/engines/particleNetworkEngine.ts: drifting
// particles, proximity links, and pointer links. Same constants, same
// bounce rule, same forward-half spatial-hash link pass, same draw order.
#pragma once

#include "buffer.h"
#include "effect.h"

namespace vc {

class ParticleNetwork final : public Effect {
 public:
  explicit ParticleNetwork(uint32_t seed) : Effect(seed) {}

  void init(float width, float height, float density) override;
  void resize(float width, float height) override;
  void setDensity(float density) override;
  void setTheme(Rgb color) override { accent_ = color; }
  void setPointer(bool hasPointer, float x, float y) override;
  bool tick(double timeMs) override;

  uint32_t particleCount() const { return count_; }

 private:
  void seed();
  uint32_t cellOf(float x, float y) const;
  void linkNeighbours(uint32_t i);

  float width_ = 0.0f;
  float height_ = 0.0f;
  float density_ = 1.0f;
  Rgb accent_{34, 211, 238};
  bool hasPointer_ = false;
  float pointerX_ = 0.0f;
  float pointerY_ = 0.0f;

  // Particles, structure-of-arrays.
  uint32_t count_ = 0;
  Buffer<float> x_;
  Buffer<float> y_;
  Buffer<float> vx_;
  Buffer<float> vy_;
  Buffer<float> radius_;

  // Uniform grid, cell size = link distance, rebuilt every tick by counting
  // sort: cellStart_[c]..cellStart_[c + 1] indexes cellItems_ for cell c, and
  // each cell's items stay in ascending particle order.
  uint32_t cols_ = 1;
  uint32_t rows_ = 1;
  Buffer<uint32_t> cellStart_;
  Buffer<uint32_t> cellCursor_;
  Buffer<uint32_t> cellItems_;
  Buffer<uint32_t> particleCell_;
};

}  // namespace vc
