const noop = () => {};

export const loadoutsStub = {
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
