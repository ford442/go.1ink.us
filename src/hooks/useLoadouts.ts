import { useCallback } from 'react';
import usePersistedState from './usePersistedState';
import { sanitizeIds } from '../lib/loadoutIds';
import type { Loadout, LoadoutPack, LoadoutStore } from '../types';

const EMPTY_STORE: LoadoutStore = { version: 1, loadouts: [] };

interface UseLoadoutsParams {
  favorites: number[];
  isLockdown: boolean;
  replaceFavorites: (ids: number[], label?: string, options?: { silent?: boolean }) => void;
  setActiveFilters: (filters: string[]) => void;
  setCurrentPage: (page: number) => void;
  addToast: (message: string, type?: string) => void;
  addActivityLog: (text: string) => void;
}

function parseStore(raw: string): LoadoutStore {
  const parsed = JSON.parse(raw) as LoadoutStore;
  if (parsed?.version !== 1 || !Array.isArray(parsed.loadouts)) {
    throw new Error('Invalid loadout store');
  }
  return parsed;
}

function findByNameOrId(loadouts: Loadout[], key: string): Loadout | undefined {
  const lower = key.toLowerCase();
  return loadouts.find((l) => l.id === key || l.name.toLowerCase() === lower);
}

export default function useLoadouts({
  favorites,
  isLockdown,
  replaceFavorites,
  setActiveFilters,
  setCurrentPage,
  addToast,
  addActivityLog,
}: UseLoadoutsParams) {
  const [store, setStore] = usePersistedState('curator_loadouts', EMPTY_STORE, {
    fromStorage: parseStore,
    toStorage: (value) => JSON.stringify(value),
  });

  const loadouts = store.loadouts;

  const guardLockdown = useCallback(() => {
    if (!isLockdown) return false;
    addToast('> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN', 'error');
    return true;
  }, [isLockdown, addToast]);

  const applyIds = useCallback((ids: number[], label?: string) => {
    replaceFavorites(ids, label);
    setActiveFilters(['Favorites']);
    setCurrentPage(1);
  }, [replaceFavorites, setActiveFilters, setCurrentPage]);

  const createLoadout = useCallback((name: string, ids?: number[]) => {
    if (guardLockdown()) return null;
    const trimmed = name.trim();
    if (!trimmed) {
      addToast('> SYS_ERR: LOADOUT_NAME_REQUIRED', 'error');
      return null;
    }
    const sourceIds = sanitizeIds(ids ?? favorites);
    if (sourceIds.length === 0) {
      addToast('> SYS_ERR: LOADOUT_EMPTY', 'error');
      return null;
    }
    const now = new Date().toISOString();
    const loadout: Loadout = {
      id: crypto.randomUUID(),
      version: 1,
      name: trimmed,
      ids: sourceIds,
      createdAt: now,
      updatedAt: now,
    };
    setStore((prev) => ({ ...prev, loadouts: [...prev.loadouts, loadout] }));
    addToast(`> SYS_CMD: LOADOUT_SAVED [${trimmed.toUpperCase()}]`, 'success');
    addActivityLog(`LOADOUT SAVED: [${trimmed.toUpperCase()}]`);
    return loadout;
  }, [guardLockdown, favorites, setStore, addToast, addActivityLog]);

  const renameLoadout = useCallback((id: string, name: string) => {
    if (guardLockdown()) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setStore((prev) => ({
      ...prev,
      loadouts: prev.loadouts.map((l) =>
        l.id === id ? { ...l, name: trimmed, updatedAt: new Date().toISOString() } : l,
      ),
    }));
  }, [guardLockdown, setStore]);

  const deleteLoadout = useCallback((id: string) => {
    if (guardLockdown()) return;
    setStore((prev) => ({
      ...prev,
      loadouts: prev.loadouts.filter((l) => l.id !== id),
    }));
    addToast('> SYS_CMD: LOADOUT_DELETED', 'warning');
  }, [guardLockdown, setStore, addToast]);

  const updateLoadoutFromFavorites = useCallback((id: string) => {
    if (guardLockdown()) return;
    const ids = sanitizeIds(favorites);
    if (ids.length === 0) {
      addToast('> SYS_ERR: LOADOUT_EMPTY', 'error');
      return;
    }
    setStore((prev) => ({
      ...prev,
      loadouts: prev.loadouts.map((l) =>
        l.id === id ? { ...l, ids, updatedAt: new Date().toISOString() } : l,
      ),
    }));
    addToast('> SYS_CMD: LOADOUT_UPDATED', 'success');
  }, [guardLockdown, favorites, setStore, addToast]);

  const applyLoadout = useCallback((id: string) => {
    if (guardLockdown()) return;
    const loadout = loadouts.find((l) => l.id === id);
    if (!loadout) {
      addToast('> SYS_ERR: LOADOUT_NOT_FOUND', 'error');
      return;
    }
    applyIds(loadout.ids, loadout.name);
    addActivityLog(`LOADOUT APPLIED: [${loadout.name.toUpperCase()}]`);
  }, [guardLockdown, loadouts, applyIds, addActivityLog, addToast]);

  const applyLoadoutByName = useCallback((name: string) => {
    const loadout = findByNameOrId(loadouts, name);
    if (!loadout) {
      addToast(`> SYS_ERR: LOADOUT_NOT_FOUND [${name.toUpperCase()}]`, 'error');
      return;
    }
    applyLoadout(loadout.id);
  }, [loadouts, applyLoadout, addToast]);

  const exportLoadout = useCallback((id: string): string | null => {
    const loadout = loadouts.find((l) => l.id === id);
    if (!loadout) return null;
    const pack: LoadoutPack = { version: 1, name: loadout.name, ids: loadout.ids };
    return JSON.stringify(pack, null, 2);
  }, [loadouts]);

  const exportAllLoadouts = useCallback((): string => {
    const packs = loadouts.map(({ name, ids }) => ({ version: 1 as const, name, ids }));
    return JSON.stringify({ version: 1, loadouts: packs }, null, 2);
  }, [loadouts]);

  const downloadJson = useCallback((filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportLoadoutFile = useCallback((id: string) => {
    const json = exportLoadout(id);
    if (!json) return;
    const loadout = loadouts.find((l) => l.id === id);
    const slug = loadout?.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'loadout';
    downloadJson(`${slug}.loadout.json`, json);
    addToast('> SYS_CMD: LOADOUT_EXPORTED', 'copy');
  }, [exportLoadout, loadouts, downloadJson, addToast]);

  const importLoadoutJson = useCallback((text: string, { merge = true } = {}) => {
    if (guardLockdown()) return;
    import('../lib/loadoutCodec')
      .then(({ parseLoadoutPack }) => {
        const parsed = JSON.parse(text) as unknown;
        let packs: LoadoutPack[];

        if (parsed && typeof parsed === 'object' && 'loadouts' in (parsed as object)) {
          const wrapper = parsed as { loadouts: unknown[] };
          packs = wrapper.loadouts.map((p) => parseLoadoutPack(p));
        } else {
          packs = [parseLoadoutPack(parsed)];
        }

        const now = new Date().toISOString();
        const imported: Loadout[] = packs.map((pack) => ({
          id: crypto.randomUUID(),
          version: 1,
          name: pack.name ?? `Imported ${new Date().toLocaleDateString()}`,
          ids: pack.ids,
          createdAt: now,
          updatedAt: now,
        }));

        setStore((prev) => ({
          version: 1,
          loadouts: merge ? [...prev.loadouts, ...imported] : imported,
        }));

        addToast(`> SYS_CMD: LOADOUT_IMPORTED (${imported.length})`, 'success');
        addActivityLog(`LOADOUT IMPORTED: ${imported.length} collection(s)`);
      })
      .catch(() => addToast('> SYS_ERR: LOADOUT_IMPORT_FAILED', 'error'));
  }, [guardLockdown, setStore, addToast, addActivityLog]);

  const shareUrlForLoadout = useCallback(async (id: string): Promise<string | null> => {
    const loadout = loadouts.find((l) => l.id === id);
    if (!loadout || typeof window === 'undefined') return null;
    const { encodePackParamCompressed } = await import('../lib/loadoutCodec');
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const pack = await encodePackParamCompressed({ version: 1, name: loadout.name, ids: loadout.ids });
    return `${origin}${pathname}?pack=${pack}`;
  }, [loadouts]);

  const shareUrlForIds = useCallback(async (ids: number[]) => {
    const { buildShareUrl } = await import('../lib/loadoutCodec');
    return buildShareUrl(sanitizeIds(ids));
  }, []);

  const copyShareLink = useCallback(async (id: string) => {
    const url = await shareUrlForLoadout(id);
    if (!url) {
      addToast('> SYS_ERR: LOADOUT_NOT_FOUND', 'error');
      return;
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        addToast('> SYS_CMD: LOADOUT_SHARE_LINK_COPIED', 'copy');
      } catch {
        addToast('> SYS_ERR: LINK_COPY_FAILED', 'error');
      }
    } else {
      addToast('> SYS_ERR: CLIPBOARD_NOT_SUPPORTED', 'error');
    }
  }, [shareUrlForLoadout, addToast]);

  const listLoadoutsSummary = useCallback(() => {
    if (loadouts.length === 0) return 'No saved loadouts.';
    return loadouts
      .map((l) => `  ${l.name} (${l.ids.length} nodes) [${l.id.slice(0, 8)}]`)
      .join('\n');
  }, [loadouts]);

  const activeLoadoutId = loadouts.find(
    (l) => l.ids.length === favorites.length && l.ids.every((id, i) => favorites[i] === id),
  )?.id ?? null;

  return {
    loadouts,
    activeLoadoutId,
    createLoadout,
    renameLoadout,
    deleteLoadout,
    updateLoadoutFromFavorites,
    applyLoadout,
    applyLoadoutByName,
    exportLoadout,
    exportAllLoadouts,
    exportLoadoutFile,
    importLoadoutJson,
    shareUrlForLoadout,
    shareUrlForIds,
    copyShareLink,
    listLoadoutsSummary,
    applyIds,
  };
}
