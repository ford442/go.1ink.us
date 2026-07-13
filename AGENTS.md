# AGENTS.md

## Project Overview

**go.1ink.us** is a React-based project portfolio dashboard that showcases web projects with a premium, immersive user experience. The application features a futuristic "portal" aesthetic with 3D card effects, dynamic backgrounds, and sophisticated filtering/search capabilities.

This is a single-page application (SPA) built with modern React patterns, served as a static site.

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | ^19.2.0 |
| Build Tool | Vite | ^7.2.4 |
| Styling | Tailwind CSS | ^4.1.18 |
| CSS Processing | PostCSS with @tailwindcss/postcss | ^8.5.6 |
| Linting | ESLint | ^9.39.1 |
| Types | TypeScript (partial — see TypeScript Migration) | ^7.0.2 |
| Deployment | Python + Paramiko (SFTP) | - |

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
│   ├── projectData.ts         # Project data array (typed)
│   ├── constants.ts           # Categories/tags/theme lookups (typed)
│   ├── App.css                # Custom CSS animations and 3D effects
│   └── index.css              # Tailwind CSS import
└── (End of structure)              # E2E test scripts and screenshots
    └── *.png                  # Test result screenshots
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

# Type-check converted .ts/.tsx files (see TypeScript Migration below)
npm run typecheck
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
2. **Custom CSS**: Place complex animations and 3D effects in `App.css`
3. **CSS Variables**: Use for dynamic values (e.g., `--mouse-x`, `--mouse-y`)
4. **Class Naming**: Use kebab-case for custom CSS classes

### Performance Patterns

1. **Memoization**: Use `useMemo` for expensive computations (e.g., `filteredProjects`)
2. **Regex Caching**: Create regex outside render loops
3. **Media Queries**: Check `hover: hover` and `prefers-reduced-motion` before enabling effects
4. **will-change**: Apply to elements with frequent transforms

---

- **Search**: Tests real-time filtering and empty states
- **Visual**: Captures screenshots of hover effects and transitions
- **Data**: Validates all project tags map to defined categories

---

## Deployment Process

### Production Build

```bash
npm run build
```

Output goes to `dist/` directory.

### Deploy to Server

```bash
python deploy.py
```

**Deployment Details:**
- Uses Paramiko for SFTP connection to `1ink.us`
- Parallel file uploads (10 workers)
- Uploads `dist/` contents to remote `go.1ink.us/` directory
- Skips `.git` directories

---

## Architecture Deep Dive

### State Management

- **Local State Only**: No external state management library
- **URL Sync**: Filter and search state sync to URL params for deep linking
- **View Transitions**: Uses `document.startViewTransition` for smooth UI updates

### Context Architecture

All state is still owned by `App.jsx` (no external store), but it is **not**
exposed through one flat context. `src/context/` splits it into six
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
(`ActivityContext`), even though the original proposal grouped them: typing
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
(`context/AppProviders.jsx`) nests the six providers around the tree.

### Key Components

#### App.jsx
- **Categories**: Hierarchical organization (Games, Audio/Visual, Tools, Experiments)
- **Search**: Real-time filtering with keyboard shortcuts (`/` or `Cmd/Ctrl+K`)
- **Background**: Parallax blobs, starfield, interactive grid spotlight
- **Empty State**: "System Alert" with glitch effects

#### components/Card/
The project card was a single ~1200-line file; it's now split by concern,
each file under ~200 LOC:

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
`cardRef` to a DOM node for the `IntersectionObserver` to watch — this
mirrors the pre-decomposition behavior exactly (not a bug introduced by
the split, and not fixed by it, since fixing it would be a behavior
change).

#### Starfield.jsx
- **Memoized**: Prevents unnecessary re-renders
- **Random Generation**: Stars generated once on mount
- **Animations**: Twinkle and shooting star effects

### Data Model

`src/projectData.ts` is typed against `src/types.ts`'s `Project` interface:

```typescript
// src/types.ts
export interface Project {
  id: number;
  title: string;
  description: string;
  url: string;
  image: string;    // Path to screenshot in public/
  icon: string;      // Emoji
  tags: string[];    // Must map to a category in src/constants.ts CATEGORIES
  tech: string[];    // Tech-stack badges
}
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
(the shared domain types), `src/constants.ts`, `src/projectData.ts`.

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
   - Search with keyboard shortcuts
   - Hierarchical filtering (Categories → Tags)
   - Real-time result counts

2. **Aliveness**: Dashboard should breathe
   - Pulsing glows on active filters
   - Mouse-reactive cards and background
   - Animated starfield and blobs

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

1. Add project object to `src/projectData.js`:
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

1. Update `CATEGORIES` object in `src/App.jsx`
2. Add corresponding icon to `CATEGORY_ICONS`

### Modifying Card Effects

- **Tilt Sensitivity**: Edit the rotation multiplier in `components/Card/useCardTilt.js` `handleMouseMove`
- **Hover Delay**: Modify `duration-700` and the 700ms timer in `components/Card/useCardHover.js`
- **Parallax Depth**: Adjust `translateZ` values in `components/Card/CardGridFront.jsx`

---

## Troubleshooting

### Build Issues
- **Missing dist/**: Run `npm run build` before `deploy.py`
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
| `eslint` | Linting |
| `eslint-plugin-react-hooks` | React Hooks rules |
| `eslint-plugin-react-refresh` | Fast Refresh rules |
