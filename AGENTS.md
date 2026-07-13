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
| Deployment | Python (HTTP upload to storage.noahcohn.com) | - |

No TypeScript — `.jsx`/`.js` throughout. `@types/react`/`@types/react-dom`
are devDependencies purely for editor intellisense, not compilation.

---

## Project Structure

```
go.1ink.us/
├── index.html                 # Entry HTML file
├── package.json                # NPM dependencies and scripts
├── vite.config.js              # Vite configuration with custom plugin
├── tailwind.config.js          # Tailwind CSS theme extensions
├── postcss.config.js           # PostCSS plugins config
├── eslint.config.js            # ESLint flat config
├── scripts/                    # Dev tooling (not part of the app bundle)
│   ├── deploy.py                # Production deploy (see Deployment Process)
│   ├── bypass_boot.py            # Playwright script: skip the boot screen locally
│   └── take_screenshot.py        # Playwright script: capture a view for review
├── public/                     # Static assets served as-is
│   ├── *.png                    # Project screenshots
│   ├── title.png                 # Site header image
│   ├── go1inkus.png               # Footer logo
│   └── vite.svg                    # Favicon
└── src/                        # Source code
    ├── main.jsx                 # Vite/React entry point
    ├── app/                      # Composition root
    │   ├── App.jsx                 # Calls hooks, wires results, renders the layout shell
    │   ├── App.css                  # 3D/animation CSS that doesn't fit Tailwind utilities
    │   └── context/                 # Six domain-scoped React contexts (see below)
    ├── components/                # UI: header, sidebar, terminal, overlays, cards, holo-terminal
    │   ├── Card/                     # Project card: shell + grid/list/matrix/data-mode variants
    │   └── HoloTerminal/              # Floating "holo-terminal" panel (see below)
    ├── effects/                   # Ambient/decorative visuals (no business logic)
    │   ├── Starfield.jsx, MatrixRain.jsx, ParticleNetwork.jsx
    │   ├── RadarHUD.jsx, Screensaver.jsx, CustomCursor.jsx
    │   └── ConstellationOverlay.jsx
    ├── hooks/                     # Feature hooks (project browser, terminal, shortcuts, …)
    ├── lib/                       # SoundSystem.js — procedural Web Audio SFX engine
    ├── data/                      # projectData.js (project list) + constants.js (categories/tags)
    └── styles/                    # index.css — Tailwind entry point + theme CSS variables
```

---

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

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

Each context's value is built with `useMemo` in `App.jsx`, and the
callbacks that go into those values (`changeTheme`, `toggleFavorite`,
`handleProjectSelect`, drag handlers, etc.) are wrapped in `useCallback` so
the memoized objects don't change identity on unrelated renders. The 1Hz
system-stats ticker (`CommandHeader`) is local `useState` inside
`CommandHeader` itself — it never touches App-level state, so it can't
force a re-render anywhere else.

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
- `useCardHover.js` — hover state + 700ms-delayed "deep focus" state + simulated ping readout.
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

```javascript
// src/data/projectData.js
{
  id: number,
  title: string,
  description: string,
  url: string,
  image: string,    // Path to screenshot in public/
  icon: string,     // Emoji
  tags: string[],   // Must map to a category in src/data/constants.js
  tech: string[]    // Optional; tech-stack badges
}
```

---

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

1. Add project object to `src/data/projectData.js`:
   ```javascript
   {
     id: 16,
     title: "New Project",
     description: "Description here",
     url: "https://go.1ink.us/new-project",
     image: "/new-project.png",
     icon: "🚀",
     tags: ["Game", "Fun"]  // Must exist in CATEGORIES
   }
   ```

2. Add screenshot to `public/new-project.png`

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
