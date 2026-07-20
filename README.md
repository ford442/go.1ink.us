# go.1ink.us

The central launchpad for 1ink.us projects — a React + Vite dashboard with a
retro-futuristic "terminal OS" aesthetic: 3D holographic project cards, a
command-line interface, a force-graph "Neural Map" view, and a full theming
system, on top of standard search/filter/sort browsing.

## Requirements

- Node.js `^20.19.0 || >=22.12.0` (required by Vite 7)

## Features

- **Project Portfolio**: Card-based grid, list, and dense "matrix" layouts, plus an interactive force-graph "Neural Map" view (`react-force-graph-2d`) that clusters projects by shared tags
- **Search & Filter**: Real-time search with keyboard shortcuts (`/` to focus, `Cmd/Ctrl+K` for the Omni Command Palette), hierarchical category/tag filtering, and sortable results — all synced to the URL (`?filters=&q=&sort=&view=`) for deep linking
- **Terminal**: A command-line bar (backtick to open) with commands like `filter`, `sort`, `view`, `theme`, `sound`, `crt`, `matrix`, `lockdown`, `open <id>`, and `fav <id>` — see `help` in-app for the full list
- **Omni Command Palette**: `Cmd/Ctrl+K` opens a fuzzy-searchable command menu for themes, layout, effects, and navigation
- **Favorites**: Drag-and-drop reorderable favorites list, persisted locally
- **Themes**: Four color themes (cyan/purple/emerald/gold), a CRT scanline/vignette effect, and a Matrix-rain background mode, all toggleable from the header, terminal, or Omni Palette
- **Data Mode (X-ray)**: Hold `Alt` to swap every card for its raw JSON payload
- **God Mode**: Enter the Konami code for an "overclocked" visual state
- **System Lockdown**: A terminal-triggered protocol that blocks interaction with a full-screen alert overlay
- **Idle Screensaver**: Triggers automatically after 60s of inactivity
- **Boot Sequence**: A biometric-style boot screen exists in the code but is bypassed by default for public access; set `sessionStorage.curator_booted` accordingly to re-enable it locally
- **3D Card Effects**: Mouse-tracking tilt, holographic sheen, specular glare, and a flip-to-diagnostics back face, all respecting `prefers-reduced-motion` and disabled on touch devices

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview the production build locally:
   ```bash
   npm run preview
   ```

5. Lint:
   ```bash
   npm run lint
   ```

## Project Structure

```
src/
  app/          # App.jsx (composition root) + context/ (React context providers)
  components/   # UI: header, sidebar, cards, terminal, overlays, holo-terminal
  effects/      # Ambient/decorative visuals: starfield, matrix rain, particle network, radar HUD, screensaver, cursor trail
  hooks/        # Feature and utility hooks (persisted state, URL sync, idle protocol, favorites, toasts, …)
  lib/          # SoundSystem (procedural Web Audio SFX engine)
  data/         # projectData.js (project list) + constants.js (categories/tags)
  styles/       # Tailwind entry point + theme CSS variables
```

See `AGENTS.md` for the full architecture deep dive (context domains, hook composition, Card layout variants, etc.).

## Customization

To add your own projects, edit `src/data/projectData.js` and update the
project objects with your own information (id, title, description, url,
image, icon, tags, tech). Tags must map to a category in
`src/data/constants.js`.

## Deployment

```bash
npm run build
python scripts/deploy.py
```

`scripts/deploy.py` uploads `dist/` to `storage.noahcohn.com`, which
extracts it and pushes the files to the production server. No SFTP
credentials are stored in this repo.

## Privacy & analytics

This dashboard ships **no third-party analytics scripts** (no Google Analytics,
no ad pixels, no social trackers). Usage insight is optional and
privacy-first:

| What | Where | Notes |
|------|-------|-------|
| Project launches | Browser `localStorage` | Counted when you click **Open External** / **Open App** — not on quick-view opens |
| Filter usage | Browser `localStorage` | Aggregate counts per filter tag/category |
| Display mode | Browser `localStorage` | Grid / list / matrix / map switches |
| Operator Profile | Sidebar | Shows your personal launch history from local stats only |
| Optional beacon | Self-hosted endpoint | Only when `VITE_ANALYTICS_BEACON_URL` is set at build time |

**Disable completely**

- **Runtime:** in DevTools console:
  `localStorage.setItem('curator_analytics_disabled', 'true')` then reload.
  Re-enable with `localStorage.removeItem('curator_analytics_disabled')`.
- **Build-time:** set `VITE_ANALYTICS_DISABLED=true` before `npm run build`.

**Optional aggregate beacon**

To POST anonymous event aggregates to a self-hosted endpoint (e.g.
`storage.noahcohn.com`):

```bash
VITE_ANALYTICS_BEACON_URL=https://storage.noahcohn.com/analytics npm run build
```

Payloads contain only `{ event, payload, ts }` — project id, filter name, or
display mode. No cookies, no fingerprinting, no IP stored by the client. Beacon
requests are fire-and-forget (`sendBeacon` / `fetch` with `keepalive`).

Clear local stats: `localStorage.removeItem('curator_operator_stats')`.

## Accessibility

The dashboard targets **keyboard-only** use and screen-reader compatibility:

| Area | Behavior |
|------|----------|
| Search | `/` focuses the sidebar search; results count is announced via a live region |
| Filters | Category/tag buttons are real `<button>` elements with visible labels |
| Projects | Arrow keys move focus between cards; Enter/Space opens quick view |
| Omni palette | `Ctrl/Cmd+K` — dialog with focus trap; ↑↓ navigate, Enter selects |
| Terminal | `` ` `` toggles the command bar; output uses `role="log"` |
| Toasts | `aria-live` region + screen-reader announcements |
| Activity feed | `role="log"` with polite live updates |
| Custom cursor | Disabled when `prefers-reduced-motion` or `forced-colors` is active |
| Motion | Warp/glitch/idle screensaver respect reduced-motion; Lite perf mode disables heavy FX |

Press **`?`** in-app for the full keyboard map (also documented below).

### Keyboard map

| Key | Action |
|-----|--------|
| `/` | Focus project search |
| `Ctrl/Cmd+K` | Omni command palette |
| `` ` `` | Toggle terminal |
| `L` | Cycle layout (grid → matrix → list → map → constellation) |
| `Alt` (hold) | Data mode (raw JSON on cards) |
| `↓` from search | Focus first matching project card |
| Arrow keys | Move between project cards |
| `Enter` / `Space` | Open quick view for focused card |
| `Esc` | Close modal, palette, terminal, or cheatsheet |
| `?` | Toggle keyboard shortcuts cheatsheet |
| Konami code | God Mode |

### CI

`npm run test:a11y` runs Playwright + **axe-core** against the home page and quick-view modal (fails on critical/serious violations) and verifies the keyboard-only browse path.
