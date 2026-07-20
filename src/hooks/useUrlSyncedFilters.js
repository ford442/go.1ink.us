import { useEffect, useState } from 'react';

const VALID_VIEWS = ['grid', 'matrix', 'list', 'map', 'constellation'];

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
    return filtersParam ? filtersParam.split(',').map(f => f.trim()).filter(Boolean) : [];
  });

  const [searchQuery, setSearchQuery] = useState(() => readParams().get('q') || '');

  const [sortOption, setSortOption] = useState(() => readParams().get('sort') || 'Featured');

  const [displayMode, setDisplayMode] = useState(() => {
    const urlMode = readParams().get('view');
    if (VALID_VIEWS.includes(urlMode)) return urlMode;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('curator_display_mode') || 'grid';
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
