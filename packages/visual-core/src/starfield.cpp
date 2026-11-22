#include "starfield.h"

#include <math.h>

namespace vc {
namespace {

constexpr double kStarBaseCount = 75.0;
constexpr double kPi = 3.14159265358979323846;
// Mirrors `@keyframes shoot` (App.base.css): a 10 s cycle, visible for the
// first 10 % of it, fading in over the first 2 %.
constexpr double kCycleMs = 10000.0;
constexpr double kTravelFraction = 0.1;
constexpr double kFadeInFraction = 0.02;
constexpr float kTravelDistance = 1600.0f;
constexpr float kTailLength = 150.0f;
// cos/sin(-pi/4): up-and-right on screen, as in the JS engine.
constexpr float kDirectionX = 0.70710678118654752f;
constexpr float kDirectionY = -0.70710678118654752f;
constexpr Rgb kWhite{255, 255, 255};

struct ShootingStar {
  float x;
  float y;
  double delayMs;
};
constexpr ShootingStar kShootingStars[] = {
    {0.5f, 0.2f, 5000.0},
    {0.3f, 0.6f, 12000.0},
};

}  // namespace

void Starfield::init(float width, float height, float density) {
  density_ = density;
  resize(width, height);
}

void Starfield::resize(float width, float height) {
  width_ = width;
  height_ = height;
  seed();
}

void Starfield::setDensity(float density) {
  density_ = density;
  seed();
}

void Starfield::seed() {
  const uint32_t count = scaledCount(kStarBaseCount, density_);
  if (!stars_.resize(count)) {
    stars_.clear();
    return;
  }
  for (uint32_t i = 0; i < count; ++i) {
    Star& star = stars_[i];
    star.x = rng_.unitf();
    star.y = rng_.unitf();
    // Two independent draws, exactly like the JS ternary chain.
    star.size = rng_.unit() < 0.1 ? 3.0f : (rng_.unit() < 0.4 ? 2.0f : 1.0f);
    star.durationMs = (rng_.unit() * 3.0 + 2.0) * 1000.0;
    star.delayMs = rng_.unit() * 5000.0;
  }
}

bool Starfield::tick(double timeMs) {
  draw_.clear();
  if (!started_) {
    started_ = true;
    startMs_ = timeMs;
  }

  draw_.clearRect(0.0f, 0.0f, width_, height_);

  for (uint32_t i = 0; i < stars_.size(); ++i) {
    const Star& star = stars_[i];
    const double cycle = fmod(timeMs + star.delayMs, star.durationMs) / star.durationMs;
    // 0 -> 1 -> 0 across the cycle, matching the twinkle keyframe's shape.
    const float wave = static_cast<float>(sin(cycle * kPi));
    draw_.fillCircle(star.x * width_, star.y * height_, (star.size / 2.0f) * (0.8f + wave * 0.3f),
                     packRgba(kWhite, 0.3f + wave * 0.7f));
  }

  // Relative to this instance's first tick, so a delay means "this long after
  // the starfield appeared", like CSS animation-delay.
  const double elapsedMs = timeMs - startMs_;
  for (const ShootingStar& star : kShootingStars) {
    drawShootingStar(star.x, star.y, star.delayMs, elapsedMs);
  }
  return true;
}

void Starfield::drawShootingStar(float fx, float fy, double delayMs, double elapsedMs) {
  if (elapsedMs < delayMs) return;
  const double cycle = fmod(elapsedMs - delayMs, kCycleMs) / kCycleMs;
  if (cycle > kTravelFraction) return;

  const double progress = cycle / kTravelFraction;
  const double opacity = cycle < kFadeInFraction ? cycle / kFadeInFraction : 1.0 - progress;
  if (opacity <= 0.0) return;

  const float travel = static_cast<float>(progress) * kTravelDistance;
  const float headX = fx * width_ + kDirectionX * travel;
  const float headY = fy * height_ + kDirectionY * travel;
  const float tailX = headX - kDirectionX * kTailLength;
  const float tailY = headY - kDirectionY * kTailLength;
  draw_.strokeStreak(tailX, tailY, headX, headY, 2.0f,
                     packRgba(kWhite, static_cast<float>(opacity)));
}

}  // namespace vc
