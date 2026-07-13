# grok.md — Grok AI Assistant Guide for go.1ink.us

> Read this first. For the full architecture deep dive, see `AGENTS.md`.

## Project Overview
**go.1ink.us** is the central launchpad and hub for all 1ink.us web apps and
experiments — a retro-futuristic "terminal OS" style project dashboard.

- **Role**: The "front door" to the entire creative ecosystem.
- **Importance**: High — this is often the first thing people see.

## Technology Stack
- JavaScript (React 19 + Vite 7), migrating to TypeScript file-by-file — see AGENTS.md's "TypeScript Migration" section before assuming a file has types
- Tailwind CSS
- No WebGL/WebGPU currently; `react-force-graph-2d` (canvas 2D) powers the Neural Map view

## Grok Guidelines
- **Clarity & Polish**: The site should feel clean, fast, and welcoming while showcasing the work beautifully.
- **Discoverability**: Make it easy for visitors to find and explore different projects (search, filters, the Omni Command Palette, the Neural Map view).
- **Consistency**: Visual language and navigation should feel cohesive across the four themes and layout modes.
- **Performance**: Fast loading is critical for a portal site — see AGENTS.md's Context Architecture section before adding new global state.
- **Future Growth**: New projects go in `src/data/projectData.js`; the layout should keep working without code changes.

## Common Tasks
- Improve project cards / previews (`src/components/Card/`)
- Add better search or categorization (`src/hooks/useProjectBrowser.js`, `src/data/constants.js`)
- Enhance visual design and animations (`src/effects/`)
- Optimize loading and responsiveness
- Add analytics or usage tracking (optional)

This is the digital storefront — make it as impressive as the projects it
showcases. 🚀
