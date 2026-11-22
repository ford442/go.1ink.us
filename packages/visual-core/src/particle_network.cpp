#include "particle_network.h"

#include <math.h>

namespace vc {
namespace {

constexpr float kLinkDistance = 118.0f;
constexpr float kLinkDistanceSq = kLinkDistance * kLinkDistance;
constexpr float kPointerDistance = 155.0f;
constexpr float kPointerDistanceSq = kPointerDistance * kPointerDistance;
constexpr double kAreaPerParticle = 14500.0;
constexpr double kMaxBaseParticles = 110.0;

// Clamps a cell coordinate in the float domain first, so an off-canvas
// particle (one frame past an edge, before its bounce) never hits an
// out-of-range float-to-int conversion.
uint32_t clampCell(float coordinate, uint32_t cells) {
  const float cell = floorf(coordinate / kLinkDistance);
  if (!(cell > 0.0f)) return 0;
  const float last = static_cast<float>(cells - 1);
  return cell >= last ? cells - 1 : static_cast<uint32_t>(cell);
}

}  // namespace

void ParticleNetwork::init(float width, float height, float density) {
  density_ = density;
  resize(width, height);
}

void ParticleNetwork::resize(float width, float height) {
  width_ = width;
  height_ = height;
  seed();
}

void ParticleNetwork::setDensity(float density) {
  density_ = density;
  seed();
}

void ParticleNetwork::setPointer(bool hasPointer, float x, float y) {
  hasPointer_ = hasPointer;
  pointerX_ = x;
  pointerY_ = y;
}

void ParticleNetwork::seed() {
  const bool dense = density_ > 1.0f;
  const double area = static_cast<double>(width_) * static_cast<double>(height_);
  double base = floor(area / kAreaPerParticle);
  if (base > kMaxBaseParticles) base = kMaxBaseParticles;
  const uint32_t count = scaledCount(base, density_);

  cols_ = width_ > 0.0f ? static_cast<uint32_t>(ceilf(width_ / kLinkDistance)) : 1;
  rows_ = height_ > 0.0f ? static_cast<uint32_t>(ceilf(height_ / kLinkDistance)) : 1;
  if (cols_ < 1) cols_ = 1;
  if (rows_ < 1) rows_ = 1;
  const uint32_t cells = cols_ * rows_;

  const bool allocated = x_.resize(count) && y_.resize(count) && vx_.resize(count) &&
                         vy_.resize(count) && radius_.resize(count) &&
                         cellStart_.resize(cells + 1) && cellCursor_.resize(cells) &&
                         cellItems_.resize(count) && particleCell_.resize(count);
  if (!allocated) {
    count_ = 0;
    return;
  }

  // Same draw order and ranges as the JS Particle constructor.
  const float speed = dense ? 3.0f : 0.5f;
  const float radiusRange = dense ? 3.0f : 1.6f;
  const float radiusMin = dense ? 1.0f : 0.4f;
  for (uint32_t i = 0; i < count; ++i) {
    x_[i] = rng_.unitf() * width_;
    y_[i] = rng_.unitf() * height_;
    vx_[i] = (rng_.unitf() - 0.5f) * speed;
    vy_[i] = (rng_.unitf() - 0.5f) * speed;
    radius_[i] = rng_.unitf() * radiusRange + radiusMin;
  }
  count_ = count;
}

uint32_t ParticleNetwork::cellOf(float x, float y) const {
  return clampCell(y, rows_) * cols_ + clampCell(x, cols_);
}

bool ParticleNetwork::tick(double /*timeMs*/) {
  draw_.clear();
  draw_.clearRect(0.0f, 0.0f, width_, height_);

  const uint32_t n = count_;
  float* x = x_.data();
  float* y = y_.data();
  float* vx = vx_.data();
  float* vy = vy_.data();

  for (uint32_t i = 0; i < n; ++i) {
    x[i] += vx[i];
    y[i] += vy[i];
    if (x[i] < 0.0f || x[i] > width_) vx[i] = -vx[i];
    if (y[i] < 0.0f || y[i] > height_) vy[i] = -vy[i];
  }

  // Counting sort into the grid. Filling in particle order keeps each cell's
  // items ascending, which the own-cell tie-break in linkNeighbours relies on.
  const uint32_t cells = cols_ * rows_;
  uint32_t* start = cellStart_.data();
  uint32_t* cursor = cellCursor_.data();
  uint32_t* items = cellItems_.data();
  uint32_t* cellOfParticle = particleCell_.data();
  for (uint32_t c = 0; c <= cells; ++c) start[c] = 0;
  for (uint32_t i = 0; i < n; ++i) {
    const uint32_t c = cellOf(x[i], y[i]);
    cellOfParticle[i] = c;
    ++start[c + 1];
  }
  for (uint32_t c = 0; c < cells; ++c) {
    start[c + 1] += start[c];
    cursor[c] = start[c];
  }
  for (uint32_t i = 0; i < n; ++i) items[cursor[cellOfParticle[i]]++] = i;

  const uint32_t dotColor = packRgba(accent_, 0.55f);
  for (uint32_t i = 0; i < n; ++i) {
    draw_.fillCircle(x[i], y[i], radius_[i], dotColor);
    linkNeighbours(i);

    if (hasPointer_) {
      const float dx = x[i] - pointerX_;
      const float dy = y[i] - pointerY_;
      const float dsq = dx * dx + dy * dy;
      if (dsq < kPointerDistanceSq) {
        const float dist = sqrtf(dsq);
        draw_.strokeLine(x[i], y[i], pointerX_, pointerY_, 1.1f,
                         packRgba(accent_, 0.55f * (1.0f - dist / kPointerDistance)));
      }
    }
  }
  return true;
}

// Scans only the forward half of the 3x3 neighbourhood (own cell, the cell
// to the right, the three below) so each cross-cell pair is visited once.
// Inside the shared cell both particles would see each other, so the lower
// index wins the tie; across cells no index filter applies.
void ParticleNetwork::linkNeighbours(uint32_t i) {
  const float* x = x_.data();
  const float* y = y_.data();
  const uint32_t* start = cellStart_.data();
  const uint32_t* items = cellItems_.data();

  const uint32_t cell = particleCell_[i];
  const uint32_t col = cell % cols_;
  const uint32_t row = cell / cols_;
  const uint32_t lastRow = row + 1 < rows_ ? row + 1 : rows_ - 1;
  const uint32_t lastCol = col + 1 < cols_ ? col + 1 : cols_ - 1;
  const float xi = x[i];
  const float yi = y[i];

  for (uint32_t r = row; r <= lastRow; ++r) {
    const uint32_t firstCol = r == row ? col : (col > 0 ? col - 1 : 0);
    for (uint32_t c = firstCol; c <= lastCol; ++c) {
      const bool ownCell = r == row && c == col;
      const uint32_t index = r * cols_ + c;
      for (uint32_t k = start[index]; k < start[index + 1]; ++k) {
        const uint32_t j = items[k];
        if (ownCell ? j <= i : j == i) continue;
        const float dx = xi - x[j];
        const float dy = yi - y[j];
        const float dsq = dx * dx + dy * dy;
        if (dsq >= kLinkDistanceSq) continue;
        const float dist = sqrtf(dsq);
        draw_.strokeLine(xi, yi, x[j], y[j], 0.6f,
                         packRgba(accent_, 0.28f * (1.0f - dist / kLinkDistance)));
      }
    }
  }
}

}  // namespace vc
