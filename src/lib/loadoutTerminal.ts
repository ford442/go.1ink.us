import type { Loadout, LoadoutStore } from '../types';

const STORAGE_KEY = 'curator_loadouts';

function readStore(): LoadoutStore {
  if (typeof localStorage === 'undefined') return { version: 1, loadouts: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, loadouts: [] };
    const parsed = JSON.parse(raw) as LoadoutStore;
    if (parsed?.version !== 1 || !Array.isArray(parsed.loadouts)) {
      return { version: 1, loadouts: [] };
    }
    return parsed;
  } catch {
    return { version: 1, loadouts: [] };
  }
}

function writeStore(store: LoadoutStore): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getLoadoutStore(): LoadoutStore {
  return readStore();
}

export function findLoadoutByName(name: string): Loadout | undefined {
  const lower = name.toLowerCase();
  return readStore().loadouts.find((l) => l.name.toLowerCase() === lower);
}

export function listLoadoutsSummary(): string {
  const { loadouts } = readStore();
  if (loadouts.length === 0) return 'No saved loadouts.';
  return loadouts
    .map((l) => `  ${l.name} (${l.ids.length} nodes) [${l.id.slice(0, 8)}]`)
    .join('\n');
}

export function saveLoadoutFromFavorites(name: string, favorites: number[]): Loadout | null {
  if (favorites.length === 0) return null;
  const now = new Date().toISOString();
  const loadout: Loadout = {
    id: crypto.randomUUID(),
    version: 1,
    name: name.trim(),
    ids: [...favorites],
    createdAt: now,
    updatedAt: now,
  };
  const store = readStore();
  store.loadouts.push(loadout);
  writeStore(store);
  return loadout;
}

export function deleteLoadoutByName(name: string): boolean {
  const store = readStore();
  const lower = name.toLowerCase();
  const next = store.loadouts.filter((l) => l.name.toLowerCase() !== lower);
  if (next.length === store.loadouts.length) return false;
  writeStore({ version: 1, loadouts: next });
  return true;
}

export function exportLoadoutByName(name: string): string | null {
  const loadout = findLoadoutByName(name);
  if (!loadout) return null;
  return JSON.stringify({ version: 1, name: loadout.name, ids: loadout.ids }, null, 2);
}
