import createDomainContext from './createDomainContext';
import type { OverlayContextValue } from './contextTypes';

// toasts, omni palette, context menu, quick-view modal, lockdown, idle, cheatsheet
export const [OverlayContext, useOverlayContext] = createDomainContext<OverlayContextValue>({
  hookName: 'useOverlayContext',
  displayName: 'OverlayContext',
});
