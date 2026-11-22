// PCG32 (O'Neill, pcg-random.org): small, fast, and statistically far better
// than the effects need. Stands in for Math.random() in the JS engines; the
// adapter seeds each instance from Math.random(), so a WASM layer is no more
// and no less reproducible than its JS counterpart.
#pragma once

#include <stdint.h>

namespace vc {

class Rng {
 public:
  explicit Rng(uint32_t seed) {
    next();
    state_ += seed;
    next();
  }

  uint32_t next() {
    const uint64_t old = state_;
    state_ = old * 6364136223846793005ULL + kIncrement;
    const uint32_t xorshifted = static_cast<uint32_t>(((old >> 18u) ^ old) >> 27u);
    const uint32_t rot = static_cast<uint32_t>(old >> 59u);
    return (xorshifted >> rot) | (xorshifted << ((32u - rot) & 31u));
  }

  // Uniform in [0, 1), like Math.random().
  double unit() { return next() * (1.0 / 4294967296.0); }
  float unitf() { return static_cast<float>(unit()); }

  // Uniform integer in [0, bound), like Math.floor(Math.random() * bound).
  uint32_t below(uint32_t bound) { return static_cast<uint32_t>(unit() * bound); }

 private:
  static constexpr uint64_t kIncrement = 1442695040888963407ULL;
  uint64_t state_ = 0;
};

}  // namespace vc
