import createDomainContext from './createDomainContext';
import type { OverlayToastContextValue } from './contextTypes';

// Toast queue only — split out of the old flat OverlayContext so a
// toast-only consumer (`SystemOverlays`) and a modal-only consumer
// (`ProjectQuickView`) don't share one object.
export const [OverlayToastContext, useOverlayToastContext] = createDomainContext<OverlayToastContextValue>({
  hookName: 'useOverlayToastContext',
  displayName: 'OverlayToastContext',
});
