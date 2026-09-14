import { useEffect } from 'react';
import useLoadouts from '../hooks/useLoadouts';

type LoadoutsBootstrapProps = Parameters<typeof useLoadouts>[0] & {
  onReady: (api: ReturnType<typeof useLoadouts>) => void;
};

export default function LoadoutsBootstrap({
  favorites,
  isLockdown,
  replaceFavorites,
  setActiveFilters,
  setCurrentPage,
  addToast,
  addActivityLog,
  onReady,
}: LoadoutsBootstrapProps) {
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
