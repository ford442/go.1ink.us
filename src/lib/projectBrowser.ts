import { CATEGORIES, CATEGORY_SETS, TAG_TO_CATEGORIES } from '../constants';
import type { Category, DisplayMode, EnhancedProject, Project, SortOption } from '../types';

const ITEMS_PER_PAGE: Partial<Record<DisplayMode, number>> = {
  map: 100,
  constellation: 100,
  matrix: 10,
  list: 8,
};

export interface ProjectCounts {
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
}

export interface SortProjectsOptions {
  activeFilters?: string[];
  favorites?: number[];
}

/** Add the lookup sets used by category/tag filtering once per catalog. */
export function enhanceProjects(projects: Project[]): EnhancedProject[] {
  return projects.map((project) => {
    const tagSet = new Set(project.tags ?? []);
    const categorySet = new Set<Category>();
    for (const tag of tagSet) {
      for (const category of TAG_TO_CATEGORIES[tag] ?? []) categorySet.add(category);
    }
    return { ...project, tagSet, categorySet };
  });
}

/** Match every whitespace-delimited term against any searchable project field. */
export function matchSearchQuery<T extends Project>(projects: T[], query: string): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return projects;

  return projects.filter((project) => terms.every((term) =>
    project.title.toLowerCase().includes(term)
    || project.description.toLowerCase().includes(term)
    || project.tags?.some((tag) => tag.toLowerCase().includes(term))
    || project.tech?.some((tech) => tech.toLowerCase().includes(term))
  ));
}

export function deriveActiveCategories(filters: string[]): Category[] {
  const categories = new Set<Category>();
  for (const filter of filters) {
    if (filter in CATEGORIES) categories.add(filter as Category);
    else for (const category of TAG_TO_CATEGORIES[filter] ?? []) categories.add(category);
  }
  return [...categories];
}

export function computeCounts(projects: EnhancedProject[]): ProjectCounts {
  const categoryCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const [category, tags] of Object.entries(CATEGORIES)) {
    categoryCounts[category] = 0;
    for (const tag of tags) tagCounts[tag] = 0;
  }

  for (const project of projects) {
    for (const tag of project.tagSet) {
      if (tag in tagCounts) tagCounts[tag] += 1;
    }
    for (const category of project.categorySet) categoryCounts[category] += 1;
  }

  return { categoryCounts, tagCounts };
}

export function computeSuggestedTags(projects: Project[], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const tag of project.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, Math.max(0, limit))
    .map(([tag]) => tag);
}

/** Apply Favorites and all category/tag filters as an intersection. */
export function applyFilters(
  projects: EnhancedProject[],
  filters: string[],
  favorites: number[],
): EnhancedProject[] {
  const favoritesSet = new Set(favorites);
  const hasFavoritesFilter = filters.includes('Favorites');
  const regularFilters = filters.filter((filter) => filter !== 'Favorites' && filter !== 'All');

  if (!hasFavoritesFilter && regularFilters.length === 0) return projects;
  return projects.filter((project) => {
    if (hasFavoritesFilter && !favoritesSet.has(project.id)) return false;
    return regularFilters.every((filter) => {
      if (filter in CATEGORY_SETS) return project.categorySet.has(filter as Category);
      return project.tagSet.has(filter);
    });
  });
}

/** Return a sorted copy; inputs are never mutated. */
export function sortProjects<T extends Project>(
  projects: T[],
  sortOption: SortOption,
  randomSeed: number,
  options: SortProjectsOptions = {},
): T[] {
  const sorted = [...projects];
  const activeFilters = options.activeFilters ?? [];
  const favorites = options.favorites ?? [];

  switch (sortOption) {
    case 'Newest':
      return sorted.sort((a, b) => b.year - a.year || b.id - a.id);
    case 'A-Z':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'Random':
      return sorted
        .map((project) => {
          const value = Math.sin(project.id * randomSeed) * 10000;
          return { project, key: value - Math.floor(value) };
        })
        .sort((a, b) => a.key - b.key)
        .map(({ project }) => project);
    case 'Most Complex':
      return sorted.sort((a, b) =>
        ((b.tech?.length ?? 0) + (b.tags?.length ?? 0))
        - ((a.tech?.length ?? 0) + (a.tags?.length ?? 0))
      );
    case 'Featured':
    default:
      if (activeFilters.length === 1 && activeFilters[0] === 'Favorites') {
        return sorted.sort((a, b) => favorites.indexOf(a.id) - favorites.indexOf(b.id));
      }
      return sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.id - b.id;
      });
  }
}

export function paginate<T>(projects: T[], page: number, pageSize: number): T[] {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) return [];
  const startIndex = (page - 1) * pageSize;
  return projects.slice(startIndex, startIndex + pageSize);
}

export function getItemsPerPage(displayMode: DisplayMode): number {
  return ITEMS_PER_PAGE[displayMode] ?? 6;
}
