import createDomainContext from './createDomainContext';
import type { CatalogCountsContextValue } from './contextTypes';

// totalProjects + totalFavorites: catalog-wide counts, independent of
// search/filter state. Split out of BrowserContext so `LoadoutPanel` and
// `CommandHeader` (each of which only needs one of these two numbers) don't
// re-render on every search keystroke the way they would subscribing to the
// full, search-hot BrowserContext.
export const [CatalogCountsContext, useCatalogCounts] = createDomainContext<CatalogCountsContextValue>({
  hookName: 'useCatalogCounts',
  displayName: 'CatalogCountsContext',
});
