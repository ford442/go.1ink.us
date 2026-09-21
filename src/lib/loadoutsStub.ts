import type useLoadouts from '../hooks/useLoadouts';

type LoadoutsApi = ReturnType<typeof useLoadouts>;

const noop = () => {};

// Placeholder App.tsx renders before useLoadouts (owned by LoadoutsBootstrap)
// reports its real API via onReady(); matches its shape so consumers don't
// need to null-check while waiting.
export const loadoutsStub: LoadoutsApi = {
  loadouts: [],
  activeLoadoutId: null,
  createLoadout: () => null,
  renameLoadout: noop,
  deleteLoadout: noop,
  updateLoadoutFromFavorites: noop,
  applyLoadout: noop,
  applyLoadoutByName: noop,
  exportLoadout: () => null,
  exportAllLoadouts: () => '[]',
  exportLoadoutFile: noop,
  importLoadoutJson: noop,
  shareUrlForLoadout: async () => null,
  shareUrlForIds: async () => '',
  copyShareLink: async () => {},
  listLoadoutsSummary: () => 'No saved loadouts.',
  applyIds: noop,
};
