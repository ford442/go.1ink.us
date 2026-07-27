import { useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { flushSync } from 'react-dom';
import projectData from '../data/projectData';
import { trackFilterUse } from '../lib/trackEvent';
import {
  applyFilters,
  computeCounts,
  computeSuggestedTags,
  deriveActiveCategories,
  matchSearchQuery,
  paginate,
  sortProjects,
} from '../lib/projectBrowser';
import type { EnhancedProject, SortOption } from '../types';

export interface UseProjectBrowserParams {
  activeFilters: string[];
  addActivityLog: (text: string) => void;
  currentPage: number;
  enhancedProjects: EnhancedProject[];
  favorites: number[];
  itemsPerPage: number;
  randomSeed: number;
  searchQuery: string;
  setActiveFilters: Dispatch<SetStateAction<string[]>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  sortOption: SortOption;
}

export default function useProjectBrowser({
  activeFilters,
  addActivityLog,
  currentPage,
  enhancedProjects,
  favorites,
  itemsPerPage,
  randomSeed,
  searchQuery,
  setActiveFilters,
  setCurrentPage,
  sortOption
}: UseProjectBrowserParams) {
  // O(1) lookup for favorites
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // O(1) lookup for active filters
  const activeFiltersSet = useMemo(() => new Set(activeFilters), [activeFilters]);

  // Memoize projects that match the search query (basis for filtering and counts)
  const projectsMatchingQuery = useMemo(
    () => matchSearchQuery(enhancedProjects, searchQuery),
    [enhancedProjects, searchQuery]
  );

  // Calculate active categories based on the active filters to display relevant sub-tags
  const activeCategories = useMemo(
    () => deriveActiveCategories(activeFilters),
    [activeFilters]
  );


  // Single-pass calculation of all category and tag counts
  const counts = useMemo(() => computeCounts(projectsMatchingQuery), [projectsMatchingQuery]);

  // Calculate global tag counts to use for suggestions when search yields no results
  const suggestedTags = useMemo(() => computeSuggestedTags(projectData), []);


  const toggleFilter = useCallback((filterParam: string) => {
    const updateState = () => {
      if (filterParam === 'All') {
        setActiveFilters([]);
        addActivityLog(`FILTERS CLEARED`);
        trackFilterUse('All', 'clear');
      } else {
        if (activeFilters.includes(filterParam)) {
          addActivityLog(`FILTER REMOVED: [${filterParam}]`);
          trackFilterUse(filterParam, 'remove');
          setActiveFilters(activeFilters.filter(f => f !== filterParam));
        } else {
          addActivityLog(`FILTER ADDED: [${filterParam}]`);
          trackFilterUse(filterParam, 'add');
          setActiveFilters([...activeFilters, filterParam]);
        }
      }
      setCurrentPage(1);
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(updateState);
      });
    } else {
      updateState();
    }
  }, [activeFilters, addActivityLog, setActiveFilters, setCurrentPage]);

  const handleTagClick = useCallback((tag: string) => {
    toggleFilter(tag);
  }, [toggleFilter]);

  const filteredProjects = useMemo(
    () => applyFilters(projectsMatchingQuery, activeFilters, favorites),
    [activeFilters, projectsMatchingQuery, favorites]
  );

  const favoriteCount = useMemo(() => {
    return projectsMatchingQuery.filter(project => favoritesSet.has(project.id)).length;
  }, [projectsMatchingQuery, favoritesSet]);

  const sortedProjects = useMemo(
    () => sortProjects(filteredProjects, sortOption, randomSeed, { activeFilters, favorites }),
    [filteredProjects, sortOption, randomSeed, activeFilters, favorites]
  );

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const paginatedProjects = useMemo(
    () => paginate(sortedProjects, currentPage, itemsPerPage),
    [sortedProjects, currentPage, itemsPerPage]
  );

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setCurrentPage(newPage));
      });
    } else {
      setCurrentPage(newPage);
    }

    // Smooth scroll to top of grid area
    const gridElement = document.getElementById('project-grid');
    if (gridElement) {
        gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [setCurrentPage, totalPages]);


  return {
    activeCategories,
    activeFiltersSet,
    counts,
    favoriteCount,
    favoritesSet,
    filteredProjects,
    handlePageChange,
    handleTagClick,
    paginatedProjects,
    projectsMatchingQuery,
    sortedProjects,
    suggestedTags,
    toggleFilter,
    totalPages
  };
}
