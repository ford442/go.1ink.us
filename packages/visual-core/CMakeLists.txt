# visual-core: C++ simulation core for the WASM ambient-visuals backend.
#
#   WASM (what ships):   npm run build:wasm
#                        (= emcmake cmake -S packages/visual-core -B packages/visual-core/build
#                             -DCMAKE_EXPORT_COMPILE_COMMANDS=ON && cmake --build packages/visual-core/build)
#   Native (IDE only):   cmake -S packages/visual-core -B packages/visual-core/build
#                        Builds a static library with the host compiler so clangd gets a
#                        compile_commands.json without an Emscripten install.
#
# Either way, compile_commands.json lands in packages/visual-core/build/ (gitignored), which
# is where the repo-root .clangd points. The JS app has no compile_commands.json.
cmake_minimum_required(VERSION 3.20)
project(visual_core LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

set(VISUAL_CORE_SOURCES
  src/api.cpp
  src/matrix_rain.cpp
  src/particle_network.cpp
  src/starfield.cpp
)

# Keep in sync with include/visual_core.h.
set(VISUAL_CORE_EXPORTS
  _vc_abi_version
  _vc_create
  _vc_destroy
  _vc_init
  _vc_resize
  _vc_set_theme
  _vc_set_density
  _vc_set_pointer
  _vc_tick
  _vc_draw_ptr
  _vc_draw_len
)
list(JOIN VISUAL_CORE_EXPORTS "," VISUAL_CORE_EXPORTS_CSV)

if(EMSCRIPTEN)
  # Make compile_commands.json self-describing for clangd. Emscripten's
  # toolchain file hides include paths in an @includes_CXX.rsp file, and em++
  # supplies the wasm target and sysroot implicitly, so clangd (which parses
  # the command with its own clang, not em++) would find neither the headers
  # nor <cmath>/<new>. Spelling out what em++ already passes keeps the build
  # byte-identical and needs no `--query-driver` in the editor.
  set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_INCLUDES OFF)
  add_executable(visual_core ${VISUAL_CORE_SOURCES})
  set_target_properties(visual_core PROPERTIES SUFFIX ".wasm")
  target_compile_options(visual_core PRIVATE
    --target=wasm32-unknown-emscripten
    "--sysroot=${EMSCRIPTEN_SYSROOT}"
    # Warnings are errors only under the pinned Emscripten toolchain (CI), not
    # for whatever host compiler an IDE-only native configure happens to use.
    -Werror
  )
  target_link_options(visual_core PRIVATE
    -O3
    # A reactor module: no main(), no Emscripten JS glue. The TypeScript
    # adapter instantiates the .wasm directly with zero imports.
    --no-entry
    -sSTANDALONE_WASM=1
    -sFILESYSTEM=0
    -sMALLOC=emmalloc
    -sALLOW_MEMORY_GROWTH=1
    -sINITIAL_MEMORY=1MB
    -sSTACK_SIZE=64KB
    -sERROR_ON_UNDEFINED_SYMBOLS=1
    "-sEXPORTED_FUNCTIONS=${VISUAL_CORE_EXPORTS_CSV}"
  )
else()
  add_library(visual_core STATIC ${VISUAL_CORE_SOURCES})
endif()

target_include_directories(visual_core PRIVATE include)
target_compile_options(visual_core PRIVATE
  -fno-exceptions
  -fno-rtti
  -Wall
  -Wextra
  -Wpedantic
  -Wshadow
)
