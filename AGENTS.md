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
| E2E Testing | Playwright (Python) | - |
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
├── verify_data.js             # Data validation script
├── verify_neon_border.py      # Visual verification script
├── public/                    # Static assets
│   ├── *.png                  # Project screenshots
│   ├── title.png              # Site header image
│   ├── go1inkus.png           # Footer logo
│   └── vite.svg               # Favicon
├── src/                       # Source code
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Main app component (filtering, search, layout)
│   ├── Card.jsx               # 3D tilt card component
│   ├── Starfield.jsx          # Animated starfield background
│   ├── projectData.js         # Project data array
│   ├── App.css                # Custom CSS animations and 3D effects
│   └── index.css              # Tailwind CSS import
└── verification/              # E2E test scripts and screenshots
    ├── verify_search.py       # Search functionality tests
    ├── verify_hover.py        # Card hover effect tests
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

## Testing Instructions

### Prerequisites

```bash
pip install playwright
playwright install
```

### Running Tests

```bash
# Ensure dev server is running
npm run dev

# Verify search functionality
python verification/verify_search.py

# Verify card hover effects
python verification/verify_hover.py

# Validate project data consistency
node verify_data.js
```

### Test Coverage

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

#### Card.jsx
- **3D Tilt**: Mouse-tracking rotation (max 12.5deg)
- **Parallax**: Inner elements have different `translateZ` values
- **Effects**: Holographic sheen, specular glare, neon border spotlight
- **Accessibility**: Respects `prefers-reduced-motion`, disables on touch devices

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

3. Run `node verify_data.js` to validate tags

4. Run `python verification/verify_search.py` to test

### Adding a New Category

1. Update `CATEGORIES` object in `src/App.jsx`
2. Add corresponding icon to `CATEGORY_ICONS`
3. Run `node verify_data.js` to check for untagged projects

### Modifying Card Effects

- **Tilt Sensitivity**: Edit the `12.5` multiplier in `Card.jsx` `handleMouseMove`
- **Hover Delay**: Modify `duration-700` and `delay-700` classes on card image
- **Parallax Depth**: Adjust `translateZ` values in Card.jsx (lines 126, 141)

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
