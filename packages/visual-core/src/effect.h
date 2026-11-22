// Base class for one ambient effect instance. Mirrors the TypeScript
// `Engine` interface (src/lib/visuals/engines/types.ts) minus drawing: tick()
// fills draw_ instead of calling a canvas.
#pragma once

#include <math.h>
#include <stdint.h>

#include "draw_list.h"
#include "rng.h"

namespace vc {

// Math.round() semantics (round half up), which differ from lround()'s
// round-half-away-from-zero only for negative inputs, never hit here.
inline double roundHalfUp(double value) { return floor(value + 0.5); }

// Count = round(base * density), clamped to [0, VC_MAX_INSTANCE_POINTS].
inline uint32_t scaledCount(double base, double density) {
  const double count = roundHalfUp(base * density);
  if (!(count > 0.0)) return 0;
  if (count > VC_MAX_INSTANCE_POINTS) return VC_MAX_INSTANCE_POINTS;
  return static_cast<uint32_t>(count);
}

class Effect {
 public:
  explicit Effect(uint32_t seed) : rng_(seed) {}
  virtual ~Effect() = default;
  Effect(const Effect&) = delete;
  Effect& operator=(const Effect&) = delete;

  virtual void init(float width, float height, float density) = 0;
  virtual void resize(float width, float height) = 0;
  virtual void setDensity(float /*density*/) {}
  virtual void setTheme(Rgb /*color*/) {}
  virtual void setPointer(bool /*hasPointer*/, float /*x*/, float /*y*/) {}
  // Rebuilds draw_; returns false to park the host loop until the next input.
  virtual bool tick(double timeMs) = 0;

  const DrawList& drawList() const { return draw_; }

 protected:
  Rng rng_;
  DrawList draw_;
};

}  // namespace vc
