import createDomainContext from './createDomainContext';

// filters, search, sort, pagination, favorites
export const [BrowserContext, useBrowserContext] = createDomainContext('useBrowserContext');
