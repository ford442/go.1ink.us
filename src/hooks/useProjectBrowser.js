import { useMemo } from 'react';
import { flushSync } from 'react-dom';
import projectData from '../projectData';
import { CATEGORIES, TAG_TO_CATEGORIES, CATEGORY_SETS } from '../constants';

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
}) {
  // O(1) lookup for favorites
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // O(1) lookup for active filters
  const activeFiltersSet = useMemo(() => new Set(activeFilters), [activeFilters]);

  // Memoize projects that match the search query (basis for filtering and counts)
  const projectsMatchingQuery = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') return enhancedProjects;
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return enhancedProjects.filter(project => {
      return terms.every(term =>
        project.title.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        (project.tags && project.tags.some(tag => tag.toLowerCase().includes(term))) ||
        (project.tech && project.tech.some(tech => tech.toLowerCase().includes(term)))
      );
    });
  }, [enhancedProjects, searchQuery]);

  // Calculate active categories based on the active filters to display relevant sub-tags
  const activeCategories = useMemo(() => {
    if (activeFilters.length === 0) return [];
    const cats = new Set();
    activeFilters.forEach(f => {
      if (CATEGORIES[f]) cats.add(f);
      else {
        const mapped = TAG_TO_CATEGORIES[f];
        if (mapped) mapped.forEach(c => cats.add(c));
      }
    });
    return Array.from(cats);
  }, [activeFilters]);


  // Single-pass calculation of all category and tag counts
  const counts = useMemo(() => {
    const categoryCounts = {};
    const tagCounts = {};

    // Initialize counts
    Object.keys(CATEGORIES).forEach(cat => {
      categoryCounts[cat] = 0;
      CATEGORIES[cat].forEach(tag => {
        tagCounts[tag] = 0;
      });
    });

    projectsMatchingQuery.forEach(project => {
      project.tagSet.forEach(tag => {
        // Increment tag count if it's one of our tracked tags
        if (tagCounts[tag] !== undefined) {
          tagCounts[tag]++;
        }
      });

      // Increment category counts once per project
      project.categorySet.forEach(cat => {
        categoryCounts[cat]++;
      });
    });

    return { categoryCounts, tagCounts };
  }, [projectsMatchingQuery]);

  // Calculate global tag counts to use for suggestions when search yields no results
  const suggestedTags = useMemo(() => {
    const globalTagCounts = new Map();
    for (const project of projectData) {
      if (!project.tags) continue;
      for (const tag of project.tags) {
        globalTagCounts.set(tag, (globalTagCounts.get(tag) || 0) + 1);
      }
    }

    // Return top 6 most used tags
    return Array.from(globalTagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([tag]) => tag);
  }, []);


  const toggleFilter = (filterParam) => {
    const updateState = () => {
      if (filterParam === 'All') {
        setActiveFilters([]);
        addActivityLog(`FILTERS CLEARED`);
      } else {
        setActiveFilters(prev => {
          if (prev.includes(filterParam)) {
            addActivityLog(`FILTER REMOVED: [${filterParam}]`);
            return prev.filter(f => f !== filterParam);
          }
          addActivityLog(`FILTER ADDED: [${filterParam}]`);
          return [...prev, filterParam];
        });
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
  };

  const handleTagClick = (tag) => {
    toggleFilter(tag);
  };

  const filteredProjects = useMemo(() => {
    const hasFavoritesFilter = activeFiltersSet.has('Favorites');
    const regularFilters = activeFilters.filter(f => f !== 'Favorites');

    if (!hasFavoritesFilter && regularFilters.length === 0) return projectsMatchingQuery;

    return projectsMatchingQuery.filter(project => {
      // If 'Favorites' is selected, must be a favorite
      if (hasFavoritesFilter && !favoritesSet.has(project.id)) {
        return false;
      }

      if (regularFilters.length === 0) return true;

      // Project must satisfy ALL selected non-favorite filters (Categories or Tags)
      return regularFilters.every(filter => {
        if (CATEGORY_SETS[filter]) {
          // If filter is a Category, project must have ANY tag within this category
          return project.categorySet.has(filter);
        }
        // If filter is a specific Tag, project must have this tag
        return project.tagSet.has(filter);
      });
    });
  }, [activeFiltersSet, activeFilters, projectsMatchingQuery, favoritesSet]);

  const favoriteCount = useMemo(() => {
    return projectsMatchingQuery.filter(project => favoritesSet.has(project.id)).length;
  }, [projectsMatchingQuery, favoritesSet]);

  const sortedProjects = useMemo(() => {
    const projects = [...filteredProjects];

    switch (sortOption) {
      case 'Newest':
        // Assuming higher ID means newer, otherwise you'd need a date field
        return projects.sort((a, b) => b.id - a.id);
      case 'A-Z':
        return projects.sort((a, b) => a.title.localeCompare(b.title));
      case 'Random':
        // Schwartzian transform for O(N) sorting after O(N) random value generation
        // Uses the seed to maintain stability across renders until seed changes
        return projects
          .map(p => {
            // Simple pseudo-random hash based on id and seed
            const val = Math.sin(p.id * randomSeed) * 10000;
            return { project: p, key: val - Math.floor(val) };
          })
          .sort((a, b) => a.key - b.key)
          .map(item => item.project);
      case 'Most Complex':
        return projects.sort((a, b) => {
          const scoreA = (a.tech?.length || 0) + (a.tags?.length || 0);
          const scoreB = (b.tech?.length || 0) + (b.tags?.length || 0);
          return scoreB - scoreA;
        });
      case 'Featured':
      default:
        // Returns original array order from projectData (assumed to be featured order)
        if (activeFiltersSet.has('Favorites') && activeFilters.length === 1) {
          return projects.sort((a, b) => {
            const indexA = favorites.indexOf(a.id);
            const indexB = favorites.indexOf(b.id);
            return indexA - indexB;
          });
        }
        return projects;
    }
  }, [filteredProjects, sortOption, randomSeed, activeFiltersSet, activeFilters, favorites]);

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProjects, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
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
  };


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
