# AGENTS.md

## Project Overview

**go.1ink.us** is a React-based project portfolio dashboard that showcases web projects with a premium, immersive "terminal OS" user experience: 3D holographic project cards, a command-line interface, an Omni Command Palette, an interactive force-graph map view, and dynamic backgrounds/theming.

This is a single-page application (SPA) built with modern React patterns, served as a static site.

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | ^19.2.0 |
| Build Tool | Vite | ^7.2.4 |
| Styling | Tailwind CSS | ^4.1.18 |
| CSS Processing | PostCSS with @tailwindcss/postcss | ^8.5.6 |
| Animation | Framer Motion | ^12.40.0 |
| Map View | react-force-graph-2d | ^1.29.1 |
| Linting | ESLint | ^9.39.1 |
| Types | TypeScript (100% of `src/` — see TypeScript Migration) | ^7.0.2 |
| Deployment | Python + Paramiko (SFTP) | - |
| Deployment | Python (HTTP upload to storage.noahcohn.com) | - |

Every file under `src/` is TypeScript (`.ts`/`.tsx`); see "TypeScript
Migration" below for how that happened and the conventions to keep it that
way.

---

## Project Structure

```
go.1ink.us/
├── index.html                 # Entry HTML file
├── package.json               # NPM dependencies and scripts
├── vite.config.js             # Vite configuration with custom plugin
├── tailwind.config.js         # Tailwind CSS theme extensions
├── postcss.config.js          # PostCSS plugins config
├── eslint.config.js           # ESLint flat config
├── tsconfig.json               # TypeScript config (see TypeScript Migration below)
├── deploy.py                  # SFTP deployment script
├── public/                    # Static assets
│   ├── *.png                  # Project screenshots
│   ├── title.png              # Site header image
│   ├── go1inkus.png           # Footer logo
│   └── vite.svg               # Favicon
├── src/                       # Source code
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Main app component (filtering, search, layout)
│   ├── types.ts                # Shared domain types (Project, Category, DisplayMode, …)
│   ├── components/Card/       # Project card: shell + layout variants (grid/list/matrix/data-mode)
│   ├── Starfield.tsx          # Animated starfield background
│   ├── data/
│   │   ├── projects.json      # Project catalog (edit here)
│   │   ├── projectData.ts     # Validates + re-exports projects.json
│   ├── constants.ts           # Single runtime + validation source for categories/tags
│   ├── App.css                # Entry point: @imports the App.*.css partials below
│   ├── App.base.css           # Root layout, glass/3D card styling, entrance + star-field animations
│   ├── App.effects.css        # Boot sequence, theme pulse glows, card hover effects
│   ├── App.retro.css          # CRT/retro effects, global scrollbar, a11y overrides
│   └── index.css              # Tailwind CSS import
└── (End of structure)              # E2E test scripts and screenshots
    └── *.png                  # Test result screenshots
```

---

## Build and Development Commands

**Compile pipeline:** This project has **no** `compile_commands.json`, CMake, or native toolchain. The sole compile step is **Vite 7** (Rollup for production). Future WASM work would add its own build step separately.

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production (outputs to dist/)
# prebuild: optimize-images | postbuild: check-bundle-budget
npm run build

# Preview production build locally (strict port, host exposed)
npm run preview

# Regenerate WebP/AVIF assets from assets-source/
npm run optimize-images

# Refresh stale browserslist data (run periodically / in CI)
npm run browserslist:update

# Run ESLint
npm run lint

# Type-check converted .ts/.tsx files (see TypeScript Migration below)
npm run typecheck

# Playwright smoke tests (requires build + preview server)
npm run test:e2e
```

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every PR and push to `main`:

1. `npm ci` → `lint` → `typecheck` → `build`
2. Playwright smoke tests against the production preview server

Branch protection should require the **CI** checks to pass before merge.

---

### Bundle budget

Production build enforces an **initial JS gzip budget of 130 KB** (entry + modulepreloaded vendor chunks, actual ~116 KB) via `scripts/check-bundle-budget.mjs`. Heavy views are code-split with `React.lazy`:

| Chunk | Loads when |
|-------|------------|
| `SystemMap` + `vendor-force-graph` | Map view opened |
| `SystemConstellation` | Constellation view opened |
| `HoloTerminal` | Holo terminal opened |
| `ProjectQuickView` | A project quick view opened |
| `MatrixRain` | Matrix mode enabled |
| `OmniPalette` / `Screensaver` / `ShortcutCheatsheet` | First open / idle / cheatsheet |
| `vendor-motion` (`framer-motion`) | Only with `ShortcutCheatsheet` — no longer on the critical path |

`vite.config.js` sets `manualChunks` for `vendor-react` and `vendor-motion`, `sourcemap: false` in prod, and `reportCompressedSize: true`. `react-force-graph-2d` ships inside the lazy `SystemMap` chunk (not preloaded).

`framer-motion` was previously pulled into the entry bundle because `MainContent`, `Toast`, and `SystemOverlays` imported it eagerly (~41 KB gzip). `MainContent.tsx` was split into `src/components/MainContent/` (`MainContent.tsx` orchestrator, `ViewToolbar`, `ProjectGridView`, `Pagination`, `EmptyState`, `useGridPerspective`), and the card-grid entrance/hover animation and `Toast` enter/exit now use CSS keyframes in `App.css` (`animate-card-enter`, `animate-slide-in-right` / `animate-fade-out-right`) instead of `motion.div`/`AnimatePresence`. `ShortcutCheatsheet` is the only remaining `framer-motion` consumer and is already behind a lazy boundary, so `vendor-motion` no longer ships until it's opened.

---

## Code Style Guidelines

### TypeScript/React Conventions

1. **Module Type**: ESM (`"type": "module"` in package.json)
2. **File Extensions**: Use `.tsx` for React components, `.ts` for everything else
3. **Imports**: Group by external deps, then internal modules
4. **Hooks Order**: `useState`, `useMemo`, `useEffect`, `useRef`
5. **Event Handlers**: Prefix with `handle` (e.g., `handleMouseMove`)

### CSS Conventions

1. **Tailwind First**: Use Tailwind utilities for layout and common styles
2. **Custom CSS**: Place complex animations and 3D effects in the `app/App.*.css` partials (imported by `App.css`), grouped by responsibility; keep each partial well under 700 lines
3. **CSS Variables**: Use for dynamic values (e.g., `--mouse-x`, `--mouse-y`)
4. **Class Naming**: Use kebab-case for custom CSS classes

### Performance Patterns

1. **Memoization**: Use `useMemo` for expensive computations (e.g., `filteredProjects`); `useCallback` for handlers threaded into memoized context values
2. **Regex Caching**: Create regex outside render loops
3. **Media Queries**: Check `hover: hover` and `prefers-reduced-motion` before enabling effects
4. **will-change**: Apply to elements with frequent transforms
5. **Context Domain Isolation**: Read from the narrowest context hook you need (see Context Architecture) rather than a broader one, so unrelated state changes don't re-render your component

### Performance Modes

`src/lib/performanceMode.ts` resolves a `PerformanceMode` preference (`auto | full | balanced | lite | random`, persisted to `localStorage` under `curator_perf`) into an effective mode and a `PerformanceFlags` object of 14 booleans (`starfield`, `particleNetwork`, `matrixRain`, `customCursor`, `warpTransition`, `cursorTrail`, `parallaxGrids`, `scrollVelocity`, `filmGrain`, `radarHud`, `card3d`, `floatingDebris`, `ambientOrbs`, `constellation3d`) gating individual visual-effect layers. `prefers-reduced-motion` and an explicit `lite`/`full`/`balanced`/`random` preference are hard floors that always win over `auto`'s device-based detection.

**Auto Detection Defaults**:
- `auto` detection prioritizes 60 FPS readability and smoothness: typical desktops and laptops (<= 8 cores or < 16GB RAM), as well as mobile/touch pointers, default to `balanced` (or `lite` if cores <= 2, saveData enabled, or reduced-motion requested).
- Only dedicated high-end workstations (12+ cores, >= 16GB RAM) detect `full` by default.
- Users can switch explicitly to `full` anytime via the header `PERF` button, Omni Palette (`Cmd+K` -> `Performance: Full`), or terminal (`perf full`).

**Dense Layout Effect Gating**:
- In `dense` catalog mode, heavy DOM/canvas overhead (`card3d` command table tilt perspective and `ConstellationOverlay` tag network lines) is automatically suppressed unless the user is explicitly in `full` mode or has rolled those flags in `random` mode.

`random` mode rolls a weighted, session-stable subset instead of a fixed preset — variety without running every effect at once:

- Flags are grouped into three tiers with independent per-flag roll chances: cheap ambient (`starfield`, `filmGrain`, `parallaxGrids`, 80%), medium (`cursorTrail`, `card3d`, `ambientOrbs`, `floatingDebris`, `radarHud`, 50%), heavy (`particleNetwork`, `matrixRain`, `constellation3d`, `warpTransition`, `scrollVelocity`, `customCursor`, 30%).
- The result is clamped to 6-8 active flags (topping up from cheap tiers first if under, trimming from heavy tiers first if over) so a roll is never all-off or effectively `full`.
- The roll is persisted to `sessionStorage` (`curator_perf_random_roll`, not `localStorage`) so a page refresh keeps the same combination, while a new tab/session gets a fresh one.
- The terminal `reroll` command (alias `fx-reroll`) and the 🎲 Omni Palette entry clear the session roll, generate a new one, and switch `performanceMode` to `random` if it wasn't already. `prefers-reduced-motion` still forces `lite` regardless of reroll.

---

## Deployment Process

### Production Build

```bash
npm run build
```

Output goes to `dist/` directory.

### Deploy to Server

```bash
python scripts/deploy.py
```

**Deployment Details:**
- Zips `dist/` and uploads it via HTTPS to `storage.noahcohn.com`
- The remote server extracts the archive and pushes the files to the production server (`go.1ink.us/`) over its own persistent connection
- No SFTP passwords or other credentials are stored in this repo

---

## Architecture Deep Dive

### State Management

- **Local State Only**: No external state management library
- **URL Sync**: Filter, search, sort, and view mode sync to URL params (`?filters=&q=&sort=&view=`) for deep linking
- **View Transitions**: Uses `document.startViewTransition` for smooth UI updates

### App.tsx as Composition Root

`App.tsx` (254 LOC, down from 786 before this refactor) no longer owns most of its state and
side effects directly — it calls a set of focused hooks under `src/hooks/`
and wires their results together, then hands seven memoized values to
`AppProviders`:

| Hook | Owns |
|---|---|
| `usePersistedState(key, default, opts)` | generic localStorage-backed `useState` (used for sound/CRT/matrix/theme) |
| `useUrlSyncedFilters()` | filters/search/sort/view, synced both ways with the URL (`?filters=&q=&sort=&view=`) and `view` additionally to localStorage |
| `useIdleProtocol({ timeoutMs, isBooting })` | activity tracking + the 60s idle flag that triggers the screensaver |
| `useToasts()` | toast queue |
| `useFavorites({ isLockdown, addToast, addActivityLog })` | favorites list (persisted) + drag-and-drop reordering |
| `useQuickViewModal({ isLockdown, addToast, addActivityLog, setIsWarping, warpTransition })` | quick-view modal open/close, performance-gated warp transition, image reset, focus trap, body scroll lock |
| `useContextMenu()` | right-click context menu open/close + outside-click dismissal |
| `useLayoutGlitchTransition(displayMode)` | the brief glitch animation played on layout switch |
| `usePagination({ displayMode, activeFilters, searchQuery, sortOption })` | current page, items-per-page, and keyboard-focused card index |
| `useAppFeatures(...)` | wires `useProjectBrowser`, `useTerminalController`, `useGlobalShortcuts`, and `useBackgroundEffects` together — the four hooks that derive behavior from persisted/URL state rather than owning their own |
| `useAppProviderValues(...)` | builds the seven memoized context values (see below) from everything else `App.tsx` assembled |

`App.tsx` itself is left owning only what doesn't cleanly belong in one of
the above: `hoveredTag`, `isMobileFiltersOpen`, `isGodMode`, `randomSeed`,
`isOmniOpen`, `isLockdown`, `isWarping`, `changeTheme`, `handleCopyLink`,
`handleDisplayModeChange`, and the scroll-velocity/sound/theme side-effect
`useEffect`s — plus the JSX shell.

### Context Architecture

All state is still owned by `app/App.tsx` (no external store), but it is
**not** exposed through one flat context. `app/context/` splits it into
seven domain-scoped contexts so a component only re-renders when the domain
it actually reads changes:

| Context | File | Holds | Typical consumers |
|---|---|---|---|
| `SettingsContext` | `context/SettingsContext.ts` | theme, CRT, matrix rain, sound, display mode, god mode | `CommandHeader`, `BackgroundElements`, `MainContent` |
| `BrowserContext` | `context/BrowserContext.ts` | filters, search, sort, pagination, favorites | `Sidebar`, `MainContent`, `SystemMap` |
| `LoadoutContext` | `context/LoadoutContext.ts` | loadout list, active id, CRUD, import/export/share | `LoadoutPanel` |
| `TerminalContext` | `context/TerminalContext.ts` | terminal/holo-terminal open state, history, input | `TerminalBar`, `HoloTerminal` |
| `OverlayContext` | `context/OverlayContext.ts` | toasts, omni palette, context menu, quick-view modal, lockdown, idle, warp | `ProjectQuickView`, `ContextMenu`, `SystemOverlays` |
| `EffectsContext` | `context/EffectsContext.ts` | background refs only (starfield/grids/cursor-trail canvas) — stable for the app's lifetime | `BackgroundElements` |
| `ActivityContext` | `context/ActivityContext.ts` | boot sequence + running activity log | `BootScreen`, `Sidebar`, `ActivityFeed` |

`EffectsContext` is deliberately split off from boot/activity-log state
(`ActivityContext`), even though an early proposal grouped them: typing
in the search box calls `addActivityLog` once the query is 3+ characters,
so bundling that with the starfield/grid refs would re-render the
background on every few keystrokes. For the same reason, don't fold a
future ground-station or worker-handle context into either `EffectsContext`
or `BrowserContext` — give it its own domain.

`LoadoutContext` was split out of `BrowserContext` for the same reason:
`loadouts`/`activeLoadoutId`/CRUD were originally bolted onto
`BrowserContextValue`, so every keystroke in search (which changes
`BrowserContext`'s memoized value) re-rendered `LoadoutPanel` even though
it never reads filter/search/sort state, and applying a loadout re-rendered
every other `BrowserContext` consumer. `App.tsx` still owns the full
`useLoadouts()` API (`renameLoadout`, `applyLoadoutByName`,
`shareUrlForLoadout`, etc., used by the terminal's `loadout` command via
`lib/loadoutTerminal.ts` directly against `localStorage`, not through
context) — only the subset `LoadoutPanel` needs is exposed through
`LoadoutContextValue`.

A wide domain can optionally split further into a state context and an
actions context (stable `useCallback` references only, so an actions-only
consumer never re-renders when state changes) — `createDomainContext` can
be called twice for this. `BrowserContext` was considered for this split
but deferred: every current consumer (`Sidebar`, `MainContent`, `SystemMap`)
reads state and calls actions together in the same JSX, so splitting them
wouldn't reduce re-renders without also restructuring those components.
Revisit this (or `use-context-selector`, weighed against the 130 KB gzip
initial-JS budget) if a future `BrowserContext` consumer only needs a
narrow slice.

Each context's value is built with `useMemo` in `hooks/useAppProviderValues.ts`
(called from `App.tsx`), and the callbacks that go into those values
(`changeTheme`, `toggleFavorite`, `handleProjectSelect`, drag handlers,
etc.) are wrapped in `useCallback` so the memoized objects don't change
identity on unrelated renders. The 1Hz system-stats ticker (`CommandHeader`)
is local `useState` inside `CommandHeader` itself — it never touches
App-level state, so it can't force a re-render anywhere else.

Consumers import the specific hook(s) they need, e.g.
`useSettingsContext()`, `useBrowserContext()`; a component that spans
domains (e.g. `MainContent`, which reads filters, display mode, and the
quick-view modal state) calls more than one. `AppProviders`
(`app/context/AppProviders.tsx`) nests the seven providers around the tree.

`toggleFilter`/`handleTagClick`/`handlePageChange`
(`hooks/useProjectBrowser.ts`) and the terminal key/submit handlers
(`hooks/useTerminalController.ts`) are `useCallback`-stabilized. The seven
provider values are assembled in `useAppProviderValues`, with complete
domain-specific dependency lists so unrelated context identities stay stable.

#### The `createDomainContext` factory

`context/createDomainContext.ts` builds each `[Context, useXContext]` pair
from one call:

```ts
export const [BrowserContext, useBrowserContext] = createDomainContext<BrowserContextValue>({
  hookName: 'useBrowserContext',   // used in the "must be used within its matching Provider" error
  displayName: 'BrowserContext',   // shown as the Context's name in React DevTools
});
```

`displayName` defaults to `hookName` if omitted, but every domain sets it
explicitly so DevTools reads `BrowserContext` rather than `Context.Provider`.
Adding a new domain (e.g. a future ground-station or share-link context)
means: add its `*ContextValue` interface to `contextTypes.ts`, add it to
`AppContextValues`, create `context/<Name>Context.ts` calling the factory,
add its provider to `AppProviders.tsx`, and add its `useDomainValue(...)`
block to `useAppProviderValues.ts`. Don't add fields to an existing
domain's `*ContextValue` without a comment explaining why they belong
there — the Loadout split above is what widening `BrowserContextValue`
without that discipline eventually costs.

### Hooks (`src/hooks/`)

| Hook | Purpose |
|---|---|
| `useProjectBrowser` | Filtering, sorting, search-matching, and pagination math over the project list |
| `useTerminalController` | Parses and executes terminal commands (`filter`, `sort`, `view`, `theme`, `sound`, `crt`, `matrix`, `lockdown`, `open`, `fav`, `stats`, `clear`, `exit`, …), owns terminal history/input state |
| `useGlobalShortcuts` | Keyboard shortcuts: `/` and `Cmd/Ctrl+K` for search/Omni Palette, Escape to close whatever's open, arrow-key card navigation, the Konami code for God Mode, hold-`Alt` for Data Mode |
| `useBackgroundEffects` | Owns the refs + rAF loop for the parallax starfield, grid spotlight, and cursor-trail canvas |
| `useBootSequence` | Boot log/scan-progress state machine, activity log, tactical click-ripple effects — the boot *screen* is bypassed by default (see below) but this hook still owns the activity log used elsewhere |
| `useVoiceCommand` | Web Speech API wrapper for voice-driven theme/search/layout/lockdown commands |
| `useAudioWaveform` | Shared canvas waveform-drawing loop used by both `AudioVisualizer` components (see below) |

### Terminal, Omni Palette, and Map View

- **Terminal** (`components/TerminalBar.tsx`, backtick to open): a command
  bar over `useTerminalController`. Type `help` for the full command list.
  `components/HoloTerminal/` is a second, floating "holo-terminal" panel
  variant with the same command engine plus a live audio waveform and
  system monitor. It is lazy-loaded and mounted from `App.tsx`; the `holo`
  terminal command and its Omni Palette item toggle it.
- **Omni Command Palette** (`components/OmniPalette.tsx`, `Cmd/Ctrl+K`): a
  fuzzy-searchable command menu for themes, layout mode, effects toggles,
  and filter/navigation actions — the fast path for anything the terminal
  can also do.
- **Neural Map view** (`components/SystemMap.tsx`, `view=map` / the map
  icon in the layout toggle): renders projects as a `react-force-graph-2d`
  graph, linking projects that share tags (Jaccard similarity), with
  click-to-open on nodes.

### Boot Sequence

A full biometric-style boot screen (`components/BootScreen.tsx`) exists in
the code — animated boot logs, a hold-to-scan biometric gate — but is
**bypassed by default** so public visitors land directly in the project
grid. To exercise it locally, clear `sessionStorage.curator_booted` (or see
`scripts/bypass_boot.py` for the inverse: a Playwright script that sets it
so automated screenshots skip the boot screen).

### Key Components

#### app/App.tsx
Thin composition root only — see Context Architecture above. It retains only
composition-level state/callbacks, delegates persistence and feature behavior
to focused hooks, wires loadout bootstrap state, builds the seven context values
through `useAppProviderValues`, and renders the layout shell.

#### components/Card/
The project card was a single ~1200-line file; it's split by concern, each
file under ~250 LOC:

- `Card.tsx` — shell. Owns the shared hooks/state (tilt, hover-delay,
  image loading, favorite burst, search-highlight regex, complexity
  score) and switches to the right layout component based on the
  `layout`/`isDataMode` props.
- `CardGrid.tsx` / `CardGridFront.tsx` / `CardGridBack.tsx` / `CardGridEffects.tsx` — default 3D-tilt layout, split into the flip shell, front face, diagnostics back face, and the purely-decorative CSS-var-driven hover overlays.
- `CardMatrix.tsx`, `CardList.tsx`, `CardDataMode.tsx` — the other three layout variants.
- `useCardTilt.ts` — mouse-tracking rotation (max 15deg) gated behind `hover: hover` + `prefers-reduced-motion`.
- `useCardHover.ts` — hover state + 700ms-delayed "deep focus" state + probe latency readout when build-time health data exists.
- `useCardMedia.ts` — image load/error state + the scroll-triggered decrypt IntersectionObserver.
- `useFavoriteBurst.ts` / `CardFavoriteBurst.tsx` — the favorite-toggle particle animation.
- `CardMedia.tsx`, `CardTagList.tsx`, `CardTechBadges.tsx`, `ComplexityMeter.tsx`, `CardFavoriteButton.tsx`, `CardCopyLinkButton.tsx` — presentational pieces shared across layout variants (each takes a `variant` prop for per-layout styling differences).
- `highlightMatch.tsx`, `cardStyles.ts` — small shared helpers.

Note: `isVisible` (from `useCardMedia`) is only ever driven to `true` while
the grid layout is mounted, because only `CardGrid` attaches the shared
`cardRef` to a DOM node for the `IntersectionObserver` to watch — this is
pre-existing behavior, not a bug.

#### Clocks
`components/Clock.tsx` is the single implementation behind both header
clocks: `precision="seconds"` (1Hz, labeled "SYS.TIME:") and
`precision="milliseconds"` (50ms, the unlabeled ticker at the far right).
The 50ms tick is intentional — a fast-ticking readout fits the dashboard's
"everything is always live" aesthetic — and only re-renders that one leaf
component, not the rest of the app.

#### Audio Visualizers
Two components draw a live waveform from `lib/SoundSystem.ts`'s analyser
data: `components/AudioVisualizer.tsx` (CommandHeader's compact themed
meter) and `components/HoloTerminal/AudioVisualizer.tsx` (the larger,
always-cyan panel inside the holo-terminal). They share their drawing loop
via `hooks/useAudioWaveform.ts` and only differ in canvas sizing/color.

#### Ambient visuals (`src/lib/visuals/`)

`effects/Starfield.tsx`, `effects/ParticleNetwork.tsx`, `effects/MatrixRain.tsx`,
and `effects/CursorTrail.tsx` (the trail canvas `BackgroundElements` used to
draw inline, now split out) are thin `<canvas>` wrappers around one shared
system rather than four independent rAF loops:

| Layer | Responsibility |
|---|---|
| `lib/visuals/engines/*Engine.ts` | Pure simulation + draw step per effect (`starfieldEngine`, `particleNetworkEngine`, `matrixRainEngine`, `cursorTrailEngine`), framework- and canvas-implementation-free — each works against any object satisfying `engines/types.ts`'s `Canvas2D` (a structural subset both `CanvasRenderingContext2D` and `OffscreenCanvasRenderingContext2D` already implement) |
| `lib/visuals/types.ts` | `VisualBackend` — the `init/resize/setTheme/setPointer/setDensity/setRunning/tick/dispose` protocol every backend implements |
| `lib/visuals/backends/MainThreadCanvasBackend.ts` | Runs an engine directly against a normal `<canvas>`, ticked by the host's own rAF |
| `lib/visuals/backends/OffscreenWorkerBackend.ts` + `VisualWorkerClient.ts` | Transfers the canvas to one shared `visualWorker` (via `transferControlToOffscreen`) and proxies every call over `postMessage`; one `Worker` backs every layer on the page, not one per effect |
| `lib/visuals/worker/visualWorkerRuntime.ts` | The worker-side protocol handler — owns every layer's engine + canvas and runs one shared frame loop for all of them. Decoupled from `self`/`postMessage` so it's testable under Node (`scripts/test-visual-worker-protocol.mjs`, with a fake worker/canvas) |
| `lib/visuals/ambientSignals.ts` | One shared pointer (`mousemove`/`mouseout`) + theme-accent (`getComputedStyle` on `data-theme` change) reader for every layer, instead of each effect running its own listener |
| `hooks/useVisualLayer.ts` | The React hook every `effects/*` component calls: picks `OffscreenWorkerBackend` when `lib/visuals/support.ts`'s `supportsOffscreenCanvas()` passes, else falls back to `MainThreadCanvasBackend`; wires resize/pointer/theme/density updates and the rAF (`useAnimationLoop`) or visibility-gate (`hooks/useVisibilityGate.ts`) loop appropriately |

**`prefers-reduced-motion` never spawns the worker** — `useVisualLayer` skips
creating a backend at all when reduced motion is active, so there's nothing to
isolate for an effect that won't animate. `performanceMode === 'lite'` never
reaches this code either: its flags are all `false`, so no `effects/*`
component mounts.

The worker entry (`lib/visuals/worker/visualWorker.ts`) is loaded via
`new Worker(new URL('./worker/visualWorker.ts', import.meta.url), { type: 'module' })`,
which Vite (`worker: { format: 'es' }` in `vite.config.js`) emits as its own
chunk (`visualWorker-*.js`) outside the `modulePreload` graph — it never counts
against the initial JS budget (see `scripts/check-bundle-budget.mjs`'s "Lazy /
on-demand chunks" output). It imports only this project's own engines/runtime
— no `three`, no other `node_modules` dependency.

### Data Model

Project records live in `src/data/projects.json` (editable without touching
TypeScript) and are validated at load time by `src/data/projectData.ts` via
`src/lib/validateProjects.ts`. Every tag must exist in `CATEGORIES`
(`src/constants.ts`, the single runtime and validation source); invalid tags fail
`npm run validate:projects` and CI.

Quick View resolves `relatedIds` into in-hub navigation, exposes `repo` as a
secure external source link, and renders `changelog` in a native accessible
disclosure. The modal is lazy-loaded on first open.

```typescript
// src/types.ts
export type ProjectStatus = 'live' | 'beta' | 'archived' | 'wip';

export interface Project {
  id: number;
  title: string;
  description: string;
  url: string;
  image: string;       // Path to screenshot slug in public/ (see projectImages.ts)
  icon: string;        // Emoji
  tags: string[];      // Must ⊆ CATEGORIES tags
  tech: string[];      // Tech-stack badges
  featured: boolean;
  year: number;
  status: ProjectStatus;
  repo: string | null;
  embedUrl: string | null;
  accent: string | null;   // Per-project neon (#RRGGBB) for future theming
  relatedIds: number[];    // Other project ids in this hub
  changelog: string | null;
  healthOverride?: 'live' | 'degraded' | 'unknown' | null; // optional manual reachability override
}
```

### Catalog reachability (build-time health)

Reachability is **not** measured in the browser (zero impact on TTI). CI /
local `npm run check:health` probes each `project.url` and writes
`src/data/projectHealth.json`, which is bundled at build time.

| Health | Meaning |
|--------|---------|
| `LIVE` | Probe returned HTTP 2xx/3xx |
| `DEGRADED` | HTTP 4xx/5xx |
| `UNKNOWN` | Probe failed or no snapshot yet |

Optional per-project `healthOverride` in `projects.json` wins over probe
data (useful for staging URLs or manual incident flags).

**Privacy:** probes run server-side in CI or on a developer machine only.
The static site displays precomputed results — no user tracking, no runtime
fetch from visitor browsers, no third-party analytics.

Command header **NET** shows `live/total` reachable nodes; cards show a
connectivity badge (`ProjectConnectivityBadge`) separate from catalog
lifecycle status (`ProjectStatusBadge`: beta/wip/archived).

```bash
npm run check:health          # refresh projectHealth.json
npm run check:health -- --strict  # exit 1 if any node degraded/unknown
```

---

### Ground station / orbital visibility (`src/ground/`)

A dependency-free, framework-free TypeScript module for "what can I see from
here". It is pure computation — no React, no three.js — so it can run in a
worker, in tests, or inline in a render loop.

| File | Responsibility |
|------|----------------|
| `geodesy.ts` | WGS84 constants, geodetic <-> ECEF, GMST, ECI <-> ECEF, topocentric look angles |
| `GroundStation.ts` | Station model, preset cities, validation, opt-in geolocation, `stationFrame()` precompute |
| `propagator.ts` | `SatellitePropagator` interface + built-in Keplerian/J2 propagator |
| `tle.ts` | TLE parsing (single set and catalog blobs) -> elements -> propagator |
| `visibility.ts` | Per-satellite horizon test and whole-constellation evaluation |
| `footprint.ts` | Coverage spherical cap, boundary ring as lat/lon or unit vectors |
| `passes.ts` | AOS / culmination / LOS prediction with max elevation |

**Hot path.** `stationFrame()` precomputes the station's ECEF position and
zenith unit vector once. The per-frame test is then `isAboveHorizon()`: three
subtracts, a dot product, one square root, one compare — cheap enough to fold
into an existing per-satellite loop without a second pass over the data.

**Propagator swap.** Everything downstream of `SatellitePropagator` is
model-agnostic. The built-in Keplerian+J2 model is fine for footprints and for
shortlisting passes, but it is *not* SGP4: quoting AOS times to the minute
against reference tools needs a real SGP4 behind `propagatorFromFunction()` (or
by replacing the body of `propagatorFromTle()`). The pass search refines
crossings by bisection to sub-second precision, so prediction accuracy is
bounded by the propagator, not by the search.

**Geolocation is strictly opt-in.** `requestGeolocationStation()` is the only
code that touches `navigator.geolocation`, it is never called at import time,
and it rejects rather than falling back to a default location so a refused
permission leaves the current station untouched.

```bash
npm run test:unit   # includes scripts/test-ground-station.mjs
```

---

## TypeScript Migration

The stack is TypeScript + React 19 + Vite 7. Migration ran gradually,
file-by-file, rather than in one pass; `tsconfig.json`'s `allowJs: true` +
`checkJs: false` existed to let `.ts`/`.tsx` and `.js`/`.jsx` coexist while it
was in progress.

**Current state**: migration complete — every file under `src/` is
`.ts`/`.tsx` (81 `.ts`, 66 `.tsx`; zero `.js`/`.jsx`). `strict: true` applies
across the whole tree. `allowJs`/`checkJs: false` stay in `tsconfig.json`
harmlessly (nothing left for them to affect) rather than being pulled to
avoid churning the config for its own sake; a follow-up can drop them.
`eslint.config.js` has a matching `**/*.{ts,tsx}` block (see "Linting
converted TypeScript" below) so every file is both type-checked and linted.
`app/context/contextTypes.ts`, the generic context factory, seven domain
contexts, `AppProviders.tsx`, and `useAppProviderValues.ts` enforce the
provider contracts. `src/constants.ts` is the only category/tag constants
module used by validation and runtime UI.

**Phased plan** (each phase should leave `npm run typecheck` and
`npm run build` both clean):

1. ~~Add `tsconfig.json` (`allowJs` + `checkJs: false`) and a `typecheck` script~~ — done
2. ~~Type the data layer: `src/types.ts` (`Project`, `Category`, `DisplayMode`, `ThemeId`, `SortOption`, …), then convert `constants.js` → `constants.ts` and `projectData.js` → `projectData.ts`~~ — done
3. ~~Convert every hook (`src/hooks/*.js` → `.ts`) and type the context/provider boundary~~ — done
4. ~~Convert components (`.jsx` → `.tsx`), leaf-first (`Tooltip`, `Clock`, `DecryptText`) before container components (`App.tsx`, `MainContent.tsx`)~~ — done: leaf presentational components and Card hooks, then `SoundSystem`/`loadoutsStub`, then the remaining mid-level components (effects/, HoloTerminal/, MainContent/ sections, OmniPalette, SystemMap/SystemConstellation, ProjectQuickView, CommandHeader, …), then containers (`Card.tsx`, `MainContent.tsx`, `Sidebar.tsx`, `App.tsx`, `main.tsx`) last
5. ~~Enable `strict: true` for converted TypeScript while retaining `checkJs: false` for JSX~~ — done

**Conventions for new/converted files**:
- New files should be written in TypeScript (`.ts`/`.tsx`) rather than JS
- Reuse the shared types in `src/types.ts` (`Project`, `Category`,
  `DisplayMode`, `ThemeId`, `SortOption`, `FilterTarget`) instead of
  re-declaring equivalent unions locally
- Prefer `interface` for object shapes that might be extended (e.g.
  props), `type` for unions/aliases
- Don't add `any` to unblock a conversion — leave the file as `.js` a
  little longer instead, or use a narrower type plus a `// TODO` comment
  explaining what's missing

**Linting converted TypeScript**: `eslint.config.js` has a `**/*.{ts,tsx}`
block using `typescript-eslint`'s (non type-aware) `recommended` config;
`npm run typecheck` (`tsc --noEmit`) already covers type errors for this
surface, so linting doesn't need to enable the `project` service.
`typescript-eslint` doesn't yet support
TypeScript 7's native compiler API (see
[the TS 7 side-by-side note](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)
and [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)),
so `package.json` aliases `typescript` itself to the API-compatible
`@typescript/typescript6` package (consumed by `require('typescript')`,
i.e. `typescript-eslint`) and adds `@typescript/native` as `npm:typescript@^7.0.2`
for the real native compiler, whose `tsc` binary is what `npm run typecheck`
actually runs (`@typescript/typescript6` only ships a `tsc6` binary, so
there's no collision). Drop this split once `typescript-eslint` supports TS 7.

## UX/UI Philosophy

### Core Principles

1. **Discovery**: Users need help finding things
   - Search with keyboard shortcuts, Omni Palette, terminal commands
   - Hierarchical filtering (Categories → Tags)
   - Real-time result counts

2. **Aliveness**: Dashboard should breathe
   - Pulsing glows on active filters
   - Mouse-reactive cards and background
   - Animated starfield, blobs, and (optionally) Matrix rain

3. **Depth**: Create sense of space
   - Layering: Background → Grid → Cards → Overlays
   - 3D perspective on cards
   - Parallax movement on scroll

### Visual Effects Patterns

#### 3D Card Effects
- **Preserving 3D Context**: Parent cannot use `overflow: hidden`
- **Solution**: Apply rounding to child elements instead
- **"Window" Pivot**: Card rotates to face cursor (positive rotation)
- **Parallax Depth**: Small `translateZ` values (30-50px) create significant depth

#### Hover States
- **Weighty Feel**: 700ms delay on image zooms feels deliberate
- **Spotlight Effect**: CSS radial gradient follows mouse position
- **Neon Border**: Animated border glow using mask-image

#### Grid Patterns
- **Base Grid**: Low opacity with radial fade mask
- **Spotlight Grid**: Revealed by mouse position, cyan color

---

## Security Considerations

1. **External Links**: All project links use `target="_blank"` with `rel="noopener noreferrer"`
2. **No User Input**: Search is local-only, no server-side processing
3. **Static Site**: No backend API, all data bundled at build time

---

## Common Development Tasks

### Adding a New Project

1. Add an entry to `src/data/projects.json` (copy an existing object as a template):
   ```json
   {
     "id": 17,
     "title": "New Project",
     "description": "Description here",
     "url": "https://go.1ink.us/new-project",
     "image": "/new-project.png",
     "icon": "🚀",
     "tags": ["Game", "Fun"],
     "tech": ["React"],
     "featured": false,
     "year": 2025,
     "status": "live",
     "repo": null,
     "embedUrl": null,
     "accent": null,
     "relatedIds": [],
     "changelog": null
   }
   ```
   Run `npm run validate:projects` locally — tags must already exist in
   `CATEGORIES`; add new tags there first (see below).

2. Add a screenshot source under `assets-source/` and run `npm run optimize-images`
   (or add optimized variants under `public/images/projects/`).

3. Optional fields: set `featured: true` for homepage prominence,
   `status: "beta"` / `"wip"` while not production-ready, `repo` for GitHub links,
   `relatedIds` for cross-links, `accent` for per-card neon theming.

### Adding a New Category

1. Update `CATEGORIES` in `src/constants.ts`
2. Add corresponding icon to `CATEGORY_ICONS` in the same file

### Modifying Card Effects

- **Tilt Sensitivity**: Edit the rotation multiplier in `components/Card/useCardTilt.ts` `handleMouseMove`
- **Hover Delay**: Modify `duration-700` and the 700ms timer in `components/Card/useCardHover.ts`
- **Parallax Depth**: Adjust `translateZ` values in `components/Card/CardGridFront.tsx`

---

## Troubleshooting

### Build Issues
- **Missing dist/**: Run `npm run build` before `python scripts/deploy.py`
- **CSS not loading**: Check `postcss.config.js` has correct plugins

### Development Issues
- **Hot reload not working**: Ensure `vite.config.js` plugins are correct
- **ESLint errors**: Check `eslint.config.js` for React version compatibility

### Visual Issues
- **3D effects not working**: Check `perspective-container` has `perspective: 1000px`
- **Animations jerky**: Add `will-change: transform` to animated elements
- **Touch devices**: Effects automatically disable on devices without hover support

---

## Dependencies to Know

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | Core React |
| `vite` | Build tool and dev server |
| `@vitejs/plugin-react` | React Fast Refresh |
| `tailwindcss` | Utility-first CSS |
| `@tailwindcss/postcss` | Tailwind PostCSS plugin |
| `framer-motion` | Scroll velocity tracking, toast/modal animations |
| `react-force-graph-2d` | Neural Map view's force-directed graph |
| `eslint` | Linting |
| `eslint-plugin-react-hooks` | React Hooks rules |
| `eslint-plugin-react-refresh` | Fast Refresh rules |

---

## Cursor Cloud specific instructions

- Pure static Vite/React SPA — no backend, database, or external services. The dev server (`npm run dev`, http://localhost:5173) is the only process to run for local development. Dependencies are refreshed automatically on startup via `npm ci`.
- `npm run lint`, `npm run typecheck`, `npm run test:unit`, and `npm run build` are expected to pass clean. Treat failures in these gates as regressions to investigate.
- `npm run build` runs a `prebuild` (`optimize-images` + `generate-pwa-icons`, both use `sharp`) and a `postbuild` bundle-budget check, so a full build takes ~40s. Playwright browsers are not installed by the update script; run `npm run test:e2e:install` first if you need `npm run test:e2e` / `test:a11y`.
