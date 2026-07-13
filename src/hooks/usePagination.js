import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = { map: 100, matrix: 10, list: 8 };

// Current page + per-page count (view-dependent) + keyboard-focused card
// index, with focus reset whenever the visible set changes.
export default function usePagination({ displayMode, activeFilters, searchQuery, sortOption }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE[displayMode] ?? 6;

  const [focusedCardIndex, setFocusedCardIndex] = useState(0);

  useEffect(() => {
    setTimeout(() => setFocusedCardIndex(0), 0);
  }, [currentPage, activeFilters, searchQuery, sortOption]);

  return { currentPage, setCurrentPage, itemsPerPage, focusedCardIndex, setFocusedCardIndex };
}
