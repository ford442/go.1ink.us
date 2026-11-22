// extern "C" surface over the effect classes. Handles are opaque pointers;
// every entry point tolerates NULL so a stale or failed handle on the JS side
// can't fault the module.
#include <new>

#include "effect.h"
#include "matrix_rain.h"
#include "particle_network.h"
#include "starfield.h"
#include "visual_core.h"

namespace {

vc::Effect* unwrap(vc_handle handle) { return reinterpret_cast<vc::Effect*>(handle); }
vc_handle wrap(vc::Effect* effect) { return reinterpret_cast<vc_handle>(effect); }

uint8_t channel(uint32_t value) { return value > 255u ? 255u : static_cast<uint8_t>(value); }

}  // namespace

extern "C" {

VC_API uint32_t vc_abi_version(void) { return VC_ABI_VERSION; }

VC_API vc_handle vc_create(uint32_t effect, uint32_t seed) {
  switch (effect) {
    case VC_EFFECT_PARTICLE_NETWORK:
      return wrap(new (std::nothrow) vc::ParticleNetwork(seed));
    case VC_EFFECT_STARFIELD:
      return wrap(new (std::nothrow) vc::Starfield(seed));
    case VC_EFFECT_MATRIX_RAIN:
      return wrap(new (std::nothrow) vc::MatrixRain(seed));
    default:
      return nullptr;
  }
}

VC_API void vc_destroy(vc_handle handle) { delete unwrap(handle); }

VC_API void vc_init(vc_handle handle, float width, float height, float density) {
  if (vc::Effect* effect = unwrap(handle)) effect->init(width, height, density);
}

VC_API void vc_resize(vc_handle handle, float width, float height) {
  if (vc::Effect* effect = unwrap(handle)) effect->resize(width, height);
}

VC_API void vc_set_theme(vc_handle handle, uint32_t r, uint32_t g, uint32_t b) {
  if (vc::Effect* effect = unwrap(handle)) effect->setTheme(vc::Rgb{channel(r), channel(g), channel(b)});
}

VC_API void vc_set_density(vc_handle handle, float density) {
  if (vc::Effect* effect = unwrap(handle)) effect->setDensity(density);
}

VC_API void vc_set_pointer(vc_handle handle, int32_t has_pointer, float x, float y) {
  if (vc::Effect* effect = unwrap(handle)) effect->setPointer(has_pointer != 0, x, y);
}

VC_API int32_t vc_tick(vc_handle handle, double time_ms) {
  vc::Effect* effect = unwrap(handle);
  return effect && effect->tick(time_ms) ? 1 : 0;
}

VC_API uint32_t vc_draw_ptr(vc_handle handle) {
  vc::Effect* effect = unwrap(handle);
  return effect ? static_cast<uint32_t>(reinterpret_cast<uintptr_t>(effect->drawList().data())) : 0;
}

VC_API uint32_t vc_draw_len(vc_handle handle) {
  vc::Effect* effect = unwrap(handle);
  return effect ? effect->drawList().size() : 0;
}

}  // extern "C"
