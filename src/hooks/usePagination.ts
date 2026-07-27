import { useEffect, useState } from 'react';
import { getItemsPerPage } from '../lib/projectBrowser';
import type { DisplayMode, SortOption } from '../types';

interface UsePaginationParams {
  displayMode: DisplayMode;
  activeFilters: string[];
  searchQuery: string;
  sortOption: SortOption;
}

// Current page + per-page count (view-dependent) + keyboard-focused card
// index, with focus reset whenever the visible set changes.
export default function usePagination({ displayMode, activeFilters, searchQuery, sortOption }: UsePaginationParams) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = getItemsPerPage(displayMode);

  const [focusedCardIndex, setFocusedCardIndex] = useState(0);

  useEffect(() => {
    setTimeout(() => setFocusedCardIndex(0), 0);
  }, [currentPage, activeFilters, searchQuery, sortOption]);

  return { currentPage, setCurrentPage, itemsPerPage, focusedCardIndex, setFocusedCardIndex };
}
