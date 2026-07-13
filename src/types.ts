// Shared domain types for the data layer (src/constants.ts, src/projectData.ts)
// and, over time, the hooks/components that consume them. See AGENTS.md's
// "TypeScript Migration" section for the phased conversion plan this file
// is step 3 of.

export type DisplayMode = 'grid' | 'list' | 'matrix' | 'map';

export type ThemeId = 'cyan' | 'purple' | 'emerald' | 'gold';

export type SortOption = 'Featured' | 'Newest' | 'A-Z' | 'Random' | 'Most Complex';

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
  // future: status, featured, year, repo, embedUrl…
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
