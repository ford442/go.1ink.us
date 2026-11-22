// Minimal growable array for trivially-copyable element types.
//
// The module is built with -fno-exceptions, and std::vector's growth path
// would abort on allocation failure. This reports failure instead, so a
// caller can drop work for one frame rather than take the worker down.
#pragma once

#include <stdint.h>
#include <stdlib.h>

#include <type_traits>

namespace vc {

template <typename T>
class Buffer {
  static_assert(std::is_trivially_copyable<T>::value, "Buffer<T> moves elements with realloc");

 public:
  Buffer() = default;
  ~Buffer() { free(data_); }
  Buffer(const Buffer&) = delete;
  Buffer& operator=(const Buffer&) = delete;

  T* data() { return data_; }
  const T* data() const { return data_; }
  uint32_t size() const { return size_; }

  T& operator[](uint32_t i) { return data_[i]; }
  const T& operator[](uint32_t i) const { return data_[i]; }

  void clear() { size_ = 0; }

  // Ensures room for `capacity` elements, doubling to amortize growth.
  bool reserve(uint32_t capacity) {
    if (capacity <= capacity_) return true;
    uint32_t next = capacity_ ? capacity_ : 16;
    while (next < capacity) next *= 2;
    void* grown = realloc(data_, static_cast<size_t>(next) * sizeof(T));
    if (!grown) return false;
    data_ = static_cast<T*>(grown);
    capacity_ = next;
    return true;
  }

  // Resizes to exactly `size` elements; new elements are uninitialized.
  bool resize(uint32_t size) {
    if (!reserve(size)) return false;
    size_ = size;
    return true;
  }

  // Resizes to `size` elements and sets every element to `value`.
  bool assign(uint32_t size, T value) {
    if (!resize(size)) return false;
    for (uint32_t i = 0; i < size; ++i) data_[i] = value;
    return true;
  }

  // Appends `count` uninitialized elements; returns nullptr if growth fails.
  T* append(uint32_t count) {
    if (!reserve(size_ + count)) return nullptr;
    T* slot = data_ + size_;
    size_ += count;
    return slot;
  }

 private:
  T* data_ = nullptr;
  uint32_t size_ = 0;
  uint32_t capacity_ = 0;
};

}  // namespace vc
