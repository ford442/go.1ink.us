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
| Types | TypeScript (partial — see TypeScript Migration) | ^7.0.2 |
| Deployment | Python + Paramiko (SFTP) | - |
| Deployment | Python (HTTP upload to storage.noahcohn.com) | - |

No TypeScript — `.jsx`/`.js` throughout. `@types/react`/`@types/react-dom`
are devDependencies purely for editor intellisense, not compilation.

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
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Main app component (filtering, search, layout)
│   ├── types.ts                # Shared domain types (Project, Category, DisplayMode, …)
│   ├── components/Card/       # Project card: shell + layout variants (grid/list/matrix/data-mode)
│   ├── Starfield.jsx          # Animated starfield background
│   ├── data/
│   │   ├── projects.json      # Project catalog (edit here)
│   │   ├── projectData.ts     # Validates + re-exports projects.json
│   │   └── constants.js       # Runtime CATEGORIES (mirrors src/constants.ts)
│   ├── constants.ts           # Categories/tags/theme lookups (typed)
│   ├── App.css                # Custom CSS animations and 3D effects
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

Production build enforces an **initial JS gzip budget of ~150 KB** (entry + modulepreloaded vendor chunks) via `scripts/check-bundle-budget.mjs`. Heavy views are code-split with `React.lazy`:

| Chunk | Loads when |
|-------|------------|
| `SystemMap` + `vendor-force-graph` | Map view opened |
| `HoloTerminal` | Holo terminal opened |
| `MatrixRain` | Matrix mode enabled |
| `OmniPalette` / `Screensaver` / `ShortcutCheatsheet` | First open / idle / cheatsheet |

`vite.config.js` sets `manualChunks` for `vendor-react` and `vendor-motion`, `sourcemap: false` in prod, and `reportCompressedSize: true`. `react-force-graph-2d` ships inside the lazy `SystemMap` chunk (not preloaded).

---

## Code Style Guidelines

### JavaScript/React Conventions

1. **Module Type**: ESM (`"type": "module"` in package.json)
2. **File Extensions**: Use `.jsx` for React components
3. **Imports**: Group by external deps, then internal modules
4. **Hooks Order**: `useState`, `useMemo`, `useEffect`, `useRef`
5. **Event Handlers**: Prefix with `handle` (e.g., `handleMouseMove`)

### CSS Conventions

1. **Tailwind First**: Use Tailwind utilities for layout and common styles
2. **Custom CSS**: Place complex animations and 3D effects in `app/App.css`
3. **CSS Variables**: Use for dynamic values (e.g., `--mouse-x`, `--mouse-y`)
4. **Class Naming**: Use kebab-case for custom CSS classes

### Performance Patterns

1. **Memoization**: Use `useMemo` for expensive computations (e.g., `filteredProjects`); `useCallback` for handlers threaded into memoized context values
2. **Regex Caching**: Create regex outside render loops
3. **Media Queries**: Check `hover: hover` and `prefers-reduced-motion` before enabling effects
4. **will-change**: Apply to elements with frequent transforms
5. **Context Domain Isolation**: Read from the narrowest context hook you need (see Context Architecture) rather than a broader one, so unrelated state changes don't re-render your component

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

### App.jsx as Composition Root

`App.jsx` (~255 LOC, down from ~840) no longer owns most of its state and
side effects directly — it calls a set of focused hooks under `src/hooks/`
and wires their results together, then hands six memoized values to
`AppProviders`:

| Hook | Owns |
|---|---|
| `usePersistedState(key, default, opts)` | generic localStorage-backed `useState` (used for sound/CRT/matrix/theme) |
| `useUrlSyncedFilters()` | filters/search/sort/view, synced both ways with the URL (`?filters=&q=&sort=&view=`) and `view` additionally to localStorage |
| `useIdleProtocol({ timeoutMs, isBooting })` | activity tracking + the 60s idle flag that triggers the screensaver |
| `useToasts()` | toast queue |
| `useFavorites({ isLockdown, addToast, addActivityLog })` | favorites list (persisted) + drag-and-drop reordering |
| `useQuickViewModal({ isLockdown, addToast, addActivityLog, setIsWarping })` | quick-view modal open/close, warp transition, focus trap, body scroll lock |
| `useContextMenu()` | right-click context menu open/close + outside-click dismissal |
| `useLayoutGlitchTransition(displayMode)` | the brief glitch animation played on layout switch |
| `usePagination({ displayMode, activeFilters, searchQuery, sortOption })` | current page, items-per-page, and keyboard-focused card index |
| `useAppFeatures(...)` | wires `useProjectBrowser`, `useTerminalController`, `useGlobalShortcuts`, and `useBackgroundEffects` together — the four hooks that derive behavior from persisted/URL state rather than owning their own |
| `useAppProviderValues(...)` | builds the six memoized context values (see below) from everything else `App.jsx` assembled |

`App.jsx` itself is left owning only what doesn't cleanly belong in one of
the above: `hoveredTag`, `isMobileFiltersOpen`, `isGodMode`, `randomSeed`,
`isOmniOpen`, `isLockdown`, `isWarping`, `changeTheme`, `handleCopyLink`,
`handleDisplayModeChange`, and the scroll-velocity/sound/theme side-effect
`useEffect`s — plus the JSX shell.

### Context Architecture

All state is still owned by `app/App.jsx` (no external store), but it is
**not** exposed through one flat context. `app/context/` splits it into six
domain-scoped contexts so a component only re-renders when the domain it
actually reads changes:

| Context | File | Holds | Typical consumers |
|---|---|---|---|
| `SettingsContext` | `context/SettingsContext.js` | theme, CRT, matrix rain, sound, display mode, god mode | `CommandHeader`, `BackgroundElements`, `MainContent` |
| `BrowserContext` | `context/BrowserContext.js` | filters, search, sort, pagination, favorites | `Sidebar`, `MainContent`, `SystemMap` |
| `TerminalContext` | `context/TerminalContext.js` | terminal/holo-terminal open state, history, input | `TerminalBar`, `HoloTerminal` |
| `OverlayContext` | `context/OverlayContext.js` | toasts, omni palette, context menu, quick-view modal, lockdown, idle, warp | `ProjectQuickView`, `ContextMenu`, `SystemOverlays` |
| `EffectsContext` | `context/EffectsContext.js` | background refs only (starfield/grids/cursor-trail canvas) — stable for the app's lifetime | `BackgroundElements` |
| `ActivityContext` | `context/ActivityContext.js` | boot sequence + running activity log | `BootScreen`, `Sidebar`, `ActivityFeed` |

`EffectsContext` is deliberately split off from boot/activity-log state
(`ActivityContext`), even though an early proposal grouped them: typing
in the search box calls `addActivityLog` once the query is 3+ characters,
so bundling that with the starfield/grid refs would re-render the
background on every few keystrokes.

Each context's value is built with `useMemo` in `hooks/useAppProviderValues.js`
(called from `App.jsx`), and the callbacks that go into those values
(`changeTheme`, `toggleFavorite`, `handleProjectSelect`, drag handlers,
etc.) are wrapped in `useCallback` so the memoized objects don't change
identity on unrelated renders. The 1Hz system-stats ticker (`CommandHeader`)
is local `useState` inside `CommandHeader` itself — it never touches
App-level state, so it can't force a re-render anywhere else.

Consumers import the specific hook(s) they need, e.g.
`useSettingsContext()`, `useBrowserContext()`; a component that spans
domains (e.g. `MainContent`, which reads filters, display mode, and the
quick-view modal state) calls more than one. `AppProviders`
(`app/context/AppProviders.jsx`) nests the six providers around the tree.

Known gap: `toggleFilter`/`handleTagClick`/`handlePageChange`
(`hooks/useProjectBrowser.js`) and the terminal's key/submit handlers
(`hooks/useTerminalController.js`) are not yet `useCallback`-stabilized
internally, so `BrowserContext`/`TerminalContext` still recompute on every
`App` render even when unrelated domains change. This doesn't break the
domain isolation (those two contexts just don't get the full memoization
benefit yet) — a good next step if further profiling shows it matters.

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

- **Terminal** (`components/TerminalBar.jsx`, backtick to open): a command
  bar over `useTerminalController`. Type `help` for the full command list.
  `components/HoloTerminal/` is a second, floating "holo-terminal" panel
  variant with the same command engine plus a live audio waveform and
  system monitor — currently implemented but not mounted anywhere in the
  render tree (no trigger wires it up yet).
- **Omni Command Palette** (`components/OmniPalette.jsx`, `Cmd/Ctrl+K`): a
  fuzzy-searchable command menu for themes, layout mode, effects toggles,
  and filter/navigation actions — the fast path for anything the terminal
  can also do.
- **Neural Map view** (`components/SystemMap.jsx`, `view=map` / the map
  icon in the layout toggle): renders projects as a `react-force-graph-2d`
  graph, linking projects that share tags (Jaccard similarity), with
  click-to-open on nodes.

### Boot Sequence

A full biometric-style boot screen (`components/BootScreen.jsx`) exists in
the code — animated boot logs, a hold-to-scan biometric gate — but is
**bypassed by default** so public visitors land directly in the project
grid. To exercise it locally, clear `sessionStorage.curator_booted` (or see
`scripts/bypass_boot.py` for the inverse: a Playwright script that sets it
so automated screenshots skip the boot screen).

### Key Components

#### app/App.jsx
Composition root only — see Context Architecture above. Owns URL/localStorage-backed settings, the idle/lockdown/warp/glitch state, favorites drag-and-drop, toasts, and the context menu, then wires ~9 feature hooks together and renders the layout shell.

#### components/Card/
The project card was a single ~1200-line file; it's split by concern, each
file under ~250 LOC:

- `Card.jsx` — shell. Owns the shared hooks/state (tilt, hover-delay,
  image loading, favorite burst, search-highlight regex, complexity
  score) and switches to the right layout component based on the
  `layout`/`isDataMode` props.
- `CardGrid.jsx` / `CardGridFront.jsx` / `CardGridBack.jsx` / `CardGridEffects.jsx` — default 3D-tilt layout, split into the flip shell, front face, diagnostics back face, and the purely-decorative CSS-var-driven hover overlays.
- `CardMatrix.jsx`, `CardList.jsx`, `CardDataMode.jsx` — the other three layout variants.
- `useCardTilt.js` — mouse-tracking rotation (max 15deg) gated behind `hover: hover` + `prefers-reduced-motion`.
- `useCardHover.js` — hover state + 700ms-delayed "deep focus" state + probe latency readout when build-time health data exists.
- `useCardMedia.js` — image load/error state + the scroll-triggered decrypt IntersectionObserver.
- `useFavoriteBurst.js` / `CardFavoriteBurst.jsx` — the favorite-toggle particle animation.
- `CardMedia.jsx`, `CardTagList.jsx`, `CardTechBadges.jsx`, `ComplexityMeter.jsx`, `CardFavoriteButton.jsx`, `CardCopyLinkButton.jsx` — presentational pieces shared across layout variants (each takes a `variant` prop for per-layout styling differences).
- `highlightMatch.jsx`, `cardStyles.js` — small shared helpers.

Note: `isVisible` (from `useCardMedia`) is only ever driven to `true` while
the grid layout is mounted, because only `CardGrid` attaches the shared
`cardRef` to a DOM node for the `IntersectionObserver` to watch — this is
pre-existing behavior, not a bug.

#### Clocks
`components/Clock.jsx` is the single implementation behind both header
clocks: `precision="seconds"` (1Hz, labeled "SYS.TIME:") and
`precision="milliseconds"` (50ms, the unlabeled ticker at the far right).
The 50ms tick is intentional — a fast-ticking readout fits the dashboard's
"everything is always live" aesthetic — and only re-renders that one leaf
component, not the rest of the app.

#### Audio Visualizers
Two components draw a live waveform from `lib/SoundSystem.js`'s analyser
data: `components/AudioVisualizer.jsx` (CommandHeader's compact themed
meter) and `components/HoloTerminal/AudioVisualizer.jsx` (the larger,
always-cyan panel inside the holo-terminal). They share their drawing loop
via `hooks/useAudioWaveform.js` and only differ in canvas sizing/color.

#### effects/Starfield.jsx
- **Memoized**: Prevents unnecessary re-renders
- **Random Generation**: Stars generated once on mount
- **Animations**: Twinkle and shooting star effects

### Data Model

Project records live in `src/data/projects.json` (editable without touching
TypeScript) and are validated at load time by `src/data/projectData.ts` via
`src/lib/validateProjects.ts`. Every tag must exist in `CATEGORIES`
(`src/constants.ts` / `src/data/constants.js`); invalid tags fail
`npm run validate:projects` and CI.

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

## TypeScript Migration

The stack is JS + React 19 + Vite 7; `@types/react`/`@types/react-dom` were
already installed but no `.ts`/`.tsx` sources existed until this migration
started. TS is being adopted gradually rather than in one pass — mixing
`.ts`/`.tsx` and `.js`/`.jsx` is fully supported by Vite (esbuild
transpiles both) and by `tsconfig.json`'s `allowJs: true`.

**Current state**: `tsconfig.json` has `checkJs: false`, so `.js`/`.jsx`
files are included for module resolution but not type-checked — only
already-converted `.ts`/`.tsx` files are held to account by
`npm run typecheck` (`tsc --noEmit`). Converted so far: `src/types.ts`
(the shared domain types), `src/constants.ts`, `src/data/projectData.ts`,
`src/lib/validateProjects.ts`.

**Phased plan** (each phase should leave `npm run typecheck` and
`npm run build` both clean):

1. ~~Add `tsconfig.json` (`allowJs` + `checkJs: false`) and a `typecheck` script~~ — done
2. ~~Type the data layer: `src/types.ts` (`Project`, `Category`, `DisplayMode`, `ThemeId`, `SortOption`, …), then convert `constants.js` → `constants.ts` and `projectData.js` → `projectData.ts`~~ — done
3. Convert hooks (`src/hooks/*.js` → `.ts`) — start with the ones with the least cross-file coupling (`useAudioWaveform`, `useBackgroundEffects`) before the terminal/browser hooks that touch most of the app's state shape
4. Convert components (`.jsx` → `.tsx`), leaf-first (`Tooltip`, `Clock`, `DecryptText`) before container components (`App.jsx`, `MainContent.jsx`)
5. Turn `strict: true` on in `tsconfig.json` once most of the codebase is converted, then fix whatever strict-mode errors that surfaces

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

1. Update `CATEGORIES` object in `src/data/constants.js`
2. Add corresponding icon to `CATEGORY_ICONS` in the same file

### Modifying Card Effects

- **Tilt Sensitivity**: Edit the rotation multiplier in `components/Card/useCardTilt.js` `handleMouseMove`
- **Hover Delay**: Modify `duration-700` and the 700ms timer in `components/Card/useCardHover.js`
- **Parallax Depth**: Adjust `translateZ` values in `components/Card/CardGridFront.jsx`

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
