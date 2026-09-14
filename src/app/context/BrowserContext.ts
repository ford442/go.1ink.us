import createDomainContext from './createDomainContext';
import type { BrowserContextValue } from './contextTypes';

// filters, search, sort, pagination, favorites
export const [BrowserContext, useBrowserContext] = createDomainContext<BrowserContextValue>({
  hookName: 'useBrowserContext',
  displayName: 'BrowserContext',
});
