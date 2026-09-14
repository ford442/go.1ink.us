# grok.md — Grok AI Assistant Guide for go.1ink.us

> Read this first. For the full architecture deep dive, see `AGENTS.md`.

## Project Overview
**go.1ink.us** is the central launchpad and hub for all 1ink.us web apps and
experiments — a retro-futuristic "terminal OS" style project dashboard.

- **Role**: The "front door" to the entire creative ecosystem.
- **Importance**: High — this is often the first thing people see.

## Technology Stack
- TypeScript (React 19 + Vite 7) — every file under `src/` is `.ts`/`.tsx`; see AGENTS.md's "TypeScript Migration" section for conventions (reuse `src/types.ts`, no `any`)
- Tailwind CSS
- WebGL via `@react-three/fiber`/`three` powers the 3D Constellation view (`src/components/SystemConstellation.tsx`), with a canvas-2D `react-force-graph-2d` Neural Map (`src/components/SystemMap.tsx`) as its fallback

## Grok Guidelines
- **Clarity & Polish**: The site should feel clean, fast, and welcoming while showcasing the work beautifully.
- **Discoverability**: Make it easy for visitors to find and explore different projects (search, filters, the Omni Command Palette, the Neural Map view).
- **Consistency**: Visual language and navigation should feel cohesive across the four themes and layout modes.
- **Performance**: Fast loading is critical for a portal site — see AGENTS.md's Context Architecture section before adding new global state.
- **Future Growth**: New projects go in `src/data/projects.json` (validated + re-exported by `src/data/projectData.ts`); the layout should keep working without code changes.

## Common Tasks
- Improve project cards / previews (`src/components/Card/`)
- Add better search or categorization (`src/hooks/useProjectBrowser.ts`, `src/constants.ts`)
- Enhance visual design and animations (`src/effects/`)
- Optimize loading and responsiveness
- Add analytics or usage tracking (optional)

This is the digital storefront — make it as impressive as the projects it
showcases. 🚀
