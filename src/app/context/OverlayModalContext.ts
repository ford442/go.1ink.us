import createDomainContext from './createDomainContext';
import type { OverlayModalContextValue } from './contextTypes';

// Project quick-view modal only — split out of the old flat OverlayContext.
// `ProjectQuickView` subscribes to exactly this and nothing else, so a
// toast firing or the context menu opening can't re-render it.
export const [OverlayModalContext, useOverlayModalContext] = createDomainContext<OverlayModalContextValue>({
  hookName: 'useOverlayModalContext',
  displayName: 'OverlayModalContext',
});
