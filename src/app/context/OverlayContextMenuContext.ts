import createDomainContext from './createDomainContext';
import type { OverlayContextMenuContextValue } from './contextTypes';

// Right-click context menu only — split out of the old flat OverlayContext.
export const [OverlayContextMenuContext, useOverlayContextMenuContext] = createDomainContext<OverlayContextMenuContextValue>({
  hookName: 'useOverlayContextMenuContext',
  displayName: 'OverlayContextMenuContext',
});
