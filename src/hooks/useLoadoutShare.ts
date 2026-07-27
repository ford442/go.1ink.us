import { useEffect, useRef } from 'react';
import {
  applyLoadoutShare,
  parseLoadoutShareSearch,
  resolveLoadoutShare,
  type LoadoutShareParams,
} from '../lib/loadoutShare';

interface UseLoadoutShareParams {
  replaceFavorites: (ids: number[], label?: string, options?: { silent?: boolean }) => void;
  setActiveFilters: (filters: string[]) => void;
  setCurrentPage: (page: number) => void;
  addToast: (message: string, type?: string) => void;
  addActivityLog: (text: string) => void;
}

function captureShareParams(): LoadoutShareParams {
  if (typeof window === 'undefined') return { pack: null, ids: null };
  return parseLoadoutShareSearch(window.location.search);
}

/** One-shot bootstrap: apply ?pack= or ?ids= on first mount. */
export default function useLoadoutShare({
  replaceFavorites,
  setActiveFilters,
  setCurrentPage,
  addToast,
  addActivityLog,
}: UseLoadoutShareParams) {
  const appliedRef = useRef(false);
  const shareParamsRef = useRef<LoadoutShareParams | null>(null);

  if (shareParamsRef.current === null) {
    shareParamsRef.current = captureShareParams();
  }

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;

    const { pack: packParam, ids: idsParam } = shareParamsRef.current ?? { pack: null, ids: null };
    if (!packParam && !idsParam) return;

    resolveLoadoutShare({ pack: packParam, ids: idsParam })
      .then((pack) => {
        if (pack) applyLoadoutShare(pack, {
          replaceFavorites,
          setActiveFilters,
          setCurrentPage,
          addToast,
          addActivityLog,
        });
      })
      .catch(() => addToast('> SYS_ERR: LOADOUT_PACK_DECODE_FAILED', 'error'));
  }, [replaceFavorites, setActiveFilters, setCurrentPage, addToast, addActivityLog]);
}
