// Shared domain types for the data layer (src/constants.ts, src/projectData.ts)
// and, over time, the hooks/components that consume them. See AGENTS.md's
// "TypeScript Migration" section for the phased conversion plan this file
// is step 3 of.

export type DisplayMode = 'grid' | 'list' | 'matrix' | 'map' | 'constellation';

export type ThemeId = 'cyan' | 'purple' | 'emerald' | 'gold';

export type SortOption = 'Featured' | 'Newest' | 'A-Z' | 'Random' | 'Most Complex';

export type ProjectStatus = 'live' | 'beta' | 'archived' | 'wip';

/** Reachability from build-time probes (distinct from catalog `ProjectStatus`). */
export type ConnectivityHealth = 'live' | 'degraded' | 'unknown';

export interface ProjectHealthRecord {
  health: ConnectivityHealth;
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string | null;
  error?: string | null;
}

export interface ProjectHealthSnapshot {
  generatedAt: string;
  source: 'ci' | 'local' | 'manual';
  projects: Record<string, ProjectHealthRecord>;
  summary: {
    live: number;
    degraded: number;
    unknown: number;
    total: number;
  };
}

export interface ResolvedProjectConnectivity extends ProjectHealthRecord {
  health: ConnectivityHealth;
  source: 'override' | 'probe' | 'default';
}

/** User-facing performance preset; `'auto'` picks based on device signals. */
export type PerformanceMode = 'auto' | 'full' | 'balanced' | 'lite';

/** Resolved feature gates derived from effective performance mode. */
export interface PerformanceFlags {
  starfield: boolean;
  particleNetwork: boolean;
  matrixRain: boolean;
  customCursor: boolean;
  warpTransition: boolean;
  cursorTrail: boolean;
  parallaxGrids: boolean;
  scrollVelocity: boolean;
  filmGrain: boolean;
  radarHud: boolean;
  card3d: boolean;
  floatingDebris: boolean;
  ambientOrbs: boolean;
  /** 3D category constellation view (Three.js); falls back to 2D map when false. */
  constellation3d: boolean;
}

/** Top-level grouping a project's tags roll up into (see constants.ts CATEGORIES). */
export type Category = 'Games' | 'Audio/Visual' | 'Tools' | 'Experiments';

/**
 * A value the project browser can filter by: a Category, a specific tag
 * within one, or one of the two pseudo-filters `'All'` / `'Favorites'`.
 */
export type FilterTarget = Category | 'All' | 'Favorites' | (string & {});

export interface Project {
  id: number;
  title: string;
  description: string;
  url: string;
  image: string;
  icon: string;
  tags: string[];
  tech: string[];
  featured: boolean;
  year: number;
  status: ProjectStatus;
  repo: string | null;
  embedUrl: string | null;
  accent: string | null;
  relatedIds: number[];
  changelog: string | null;
  /** Manual reachability override; wins over build-time probe data. */
  healthOverride?: ConnectivityHealth | null;
}

/** Project as enhanced at module load in app/App.jsx for O(1) tag/category lookups. */
export interface EnhancedProject extends Project {
  tagSet: Set<string>;
  categorySet: Set<Category>;
}

export interface CategoryButtonStyle {
  activeClass: string;
  tagClass: string;
}

/** Portable favorites collection for export/import and URL packs. */
export interface LoadoutPack {
  version: 1;
  name?: string;
  ids: number[];
}

/** Named loadout persisted in localStorage. */
export interface Loadout extends LoadoutPack {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoadoutStore {
  version: 1;
  loadouts: Loadout[];
}
