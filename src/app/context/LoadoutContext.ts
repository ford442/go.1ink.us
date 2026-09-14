import createDomainContext from './createDomainContext';
import type { LoadoutContextValue } from './contextTypes';

// loadout list, active id, CRUD, import/export/share — split out of
// BrowserContext so LoadoutPanel doesn't re-render on every search keystroke
// and applying/editing a loadout doesn't invalidate filter/sort/pagination
// consumers.
export const [LoadoutContext, useLoadoutContext] = createDomainContext<LoadoutContextValue>({
  hookName: 'useLoadoutContext',
  displayName: 'LoadoutContext',
});
