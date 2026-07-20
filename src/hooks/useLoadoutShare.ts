import { useEffect, useRef } from 'react';

interface UseLoadoutShareParams {
  replaceFavorites: (ids: number[], label?: string, options?: { silent?: boolean }) => void;
  setActiveFilters: (filters: string[]) => void;
  setCurrentPage: (page: number) => void;
  addToast: (message: string, type?: string) => void;
  addActivityLog: (text: string) => void;
}

function captureShareParams() {
  if (typeof window === 'undefined') return { pack: null, ids: null };
  const params = new URLSearchParams(window.location.search);
  return { pack: params.get('pack'), ids: params.get('ids') };
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
  const shareParamsRef = useRef(null);

  if (shareParamsRef.current === null) {
    shareParamsRef.current = captureShareParams();
  }

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;

    const { pack: packParam, ids: idsParam } = shareParamsRef.current ?? { pack: null, ids: null };
    if (!packParam && !idsParam) return;

    const apply = (ids: number[], label?: string) => {
      replaceFavorites(ids, label, { silent: true });
      setActiveFilters(['Favorites']);
      setCurrentPage(1);
      const name = label ? `[${label.toUpperCase()}]` : `[${ids.length} NODES]`;
      addToast(`> SYS_CMD: LOADOUT_DEPLOYED ${name}`, 'success');
      addActivityLog(`LOADOUT DEPLOYED ${name}`);
    };

    if (packParam) {
      import('../lib/loadoutCodec')
        .then(({ decodePackParam }) => decodePackParam(packParam))
        .then((pack) => apply(pack.ids, pack.name))
        .catch(() => addToast('> SYS_ERR: LOADOUT_PACK_DECODE_FAILED', 'error'));
      return;
    }

    if (idsParam) {
      const raw = idsParam.split(',').map((s) => parseInt(s.trim(), 10));
      apply(raw);
    }
  }, [replaceFavorites, setActiveFilters, setCurrentPage, addToast, addActivityLog]);
}
