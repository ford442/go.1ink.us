import type { LoadoutPack } from '../types';
import { parseIdsParam } from './loadoutIds';

export interface LoadoutShareParams {
  pack: string | null;
  ids: string | null;
}

export interface LoadoutShareActions {
  replaceFavorites: (ids: number[], label?: string, options?: { silent?: boolean }) => void;
  setActiveFilters: (filters: string[]) => void;
  setCurrentPage: (page: number) => void;
  addToast: (message: string, type?: string) => void;
  addActivityLog: (text: string) => void;
}

export function parseLoadoutShareSearch(search: string): LoadoutShareParams {
  const params = new URLSearchParams(search);
  return { pack: params.get('pack'), ids: params.get('ids') };
}

/** Resolve the pack-first URL contract into one normalized loadout shape. */
export async function resolveLoadoutShare(params: LoadoutShareParams): Promise<LoadoutPack | null> {
  if (params.pack) {
    const { decodePackParam } = await import('./loadoutCodec');
    return decodePackParam(params.pack);
  }
  if (params.ids) return { version: 1, ids: parseIdsParam(params.ids) };
  return null;
}

/** Apply a resolved URL loadout through the same state callbacks as the hook. */
export function applyLoadoutShare(pack: LoadoutPack, actions: LoadoutShareActions): void {
  actions.replaceFavorites(pack.ids, pack.name, { silent: true });
  actions.setActiveFilters(['Favorites']);
  actions.setCurrentPage(1);
  const name = pack.name ? `[${pack.name.toUpperCase()}]` : `[${pack.ids.length} NODES]`;
  actions.addToast(`> SYS_CMD: LOADOUT_DEPLOYED ${name}`, 'success');
  actions.addActivityLog(`LOADOUT DEPLOYED ${name}`);
}
