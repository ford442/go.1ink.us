import createDomainContext from './createDomainContext';

// toasts, omni palette, context menu, quick-view modal, lockdown, idle, cheatsheet
export const [OverlayContext, useOverlayContext] = createDomainContext('useOverlayContext');
