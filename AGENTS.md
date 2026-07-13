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
├── deploy.py                  # SFTP deployment script
├── public/                    # Static assets
│   ├── *.png                  # Project screenshots
│   ├── title.png              # Site header image
│   ├── go1inkus.png           # Footer logo
│   └── vite.svg               # Favicon
├── src/                       # Source code
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Main app component (filtering, search, layout)
│   ├── components/Card/       # Project card: shell + layout variants (grid/list/matrix/data-mode)
│   ├── Starfield.jsx          # Animated starfield background
│   ├── projectData.js         # Project data array
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

```javascript
// src/projectData.js
{
  id: number,
  title: string,
  description: string,
  url: string,
  image: string,    // Path to screenshot in public/
  icon: string,     // Emoji
  tags: string[]    // Must map to CATEGORIES in App.jsx
}
```

---

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
