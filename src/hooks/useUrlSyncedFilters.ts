import { useEffect, useState } from 'react';
import type { DisplayMode, SortOption } from '../types';

const VALID_VIEWS: DisplayMode[] = ['grid', 'matrix', 'list', 'map', 'constellation'];
const VALID_SORTS: SortOption[] = ['Featured', 'Newest', 'A-Z', 'Random', 'Most Complex'];

function isDisplayMode(value: string | null): value is DisplayMode {
  return value !== null && VALID_VIEWS.includes(value as DisplayMode);
}

function isSortOption(value: string | null): value is SortOption {
  return value !== null && VALID_SORTS.includes(value as SortOption);
}

function readParams() {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

// Owns filters/search/sort/view — all four are deep-linkable via URL query
// params (`?filters=&q=&sort=&view=`) and kept in sync with the address
// bar via replaceState. `view` additionally persists to localStorage so it
// survives a visit without any of those params set.
export default function useUrlSyncedFilters() {
  const [activeFilters, setActiveFilters] = useState(() => {
    const filtersParam = readParams().get('filters');
    return filtersParam ? filtersParam.split(',').map(f => f.trim()).filter(Boolean) : [] as string[];
  });

  const [searchQuery, setSearchQuery] = useState(() => readParams().get('q') || '');

  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const value = readParams().get('sort');
    return isSortOption(value) ? value : 'Featured';
  });

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const urlMode = readParams().get('view');
    if (isDisplayMode(urlMode)) return urlMode;
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('curator_display_mode');
      return isDisplayMode(storedMode) ? storedMode : 'grid';
    }
    return 'grid';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_display_mode', displayMode);
    }
  }, [displayMode]);

  // Sync state to URL (Deep Linking). Share params (?pack=, ?ids=) are
  // consumed once on landing and never written back to the address bar.
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilters.length > 0) params.set('filters', activeFilters.join(','));
    if (searchQuery) params.set('q', searchQuery);
    if (sortOption !== 'Featured') params.set('sort', sortOption);
    if (displayMode !== 'grid') params.set('view', displayMode);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Use replaceState to update URL without cluttering history stack
    window.history.replaceState(null, '', newUrl);
  }, [activeFilters, searchQuery, sortOption, displayMode]);

  return {
    activeFilters,
    setActiveFilters,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    displayMode,
    setDisplayMode
  };
}
