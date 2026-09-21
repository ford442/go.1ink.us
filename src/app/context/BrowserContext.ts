import createDomainContext from './createDomainContext';
import type { BrowserActionsContextValue, BrowserContextValue } from './contextTypes';

// Hot state (search, filters, filtered/paginated projects, pagination,
// favorites list, drag ids) vs. stable actions (toggleFilter,
// handlePageChange, drag handlers, setters). See AGENTS.md's "when to split
// a domain" rule for why this is the one domain that got the dual-context
// treatment: `MainContent` and `Sidebar` read both halves together (so the
// split buys them nothing), but `useVoiceCommand` (setSearchQuery only) and
// `SystemMap`/`SystemConstellation` (paginated/filtered projects only) each
// only need one half — those now subscribe to a single, narrower context
// instead of the whole domain.
export const [BrowserContext, BrowserActionsContext, useBrowserContext, useBrowserActions] =
  createDomainContext.withActions<BrowserContextValue, BrowserActionsContextValue>({
    hookName: 'useBrowserContext',
    displayName: 'BrowserContext',
  });
