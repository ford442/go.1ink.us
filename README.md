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
