import { useEffect } from 'react';
import useLoadouts from '../hooks/useLoadouts';

export default function LoadoutsBootstrap({
  favorites,
  isLockdown,
  replaceFavorites,
  setActiveFilters,
  setCurrentPage,
  addToast,
  addActivityLog,
  onReady,
}) {
  const api = useLoadouts({
    favorites,
    isLockdown,
    replaceFavorites,
    setActiveFilters,
    setCurrentPage,
    addToast,
    addActivityLog,
  });

  useEffect(() => {
    onReady(api);
  }, [api, onReady]);

  return null;
}
