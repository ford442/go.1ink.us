import createDomainContext from './createDomainContext';
import type { OverlayChromeContextValue } from './contextTypes';

// Small, infrequently-changing chrome flags (omni palette, lockdown, idle,
// data mode, cheatsheet, warp transition, click effects) — split out of the
// old flat OverlayContext. See contextTypes.ts for why these stay grouped
// rather than each getting their own context.
export const [OverlayChromeContext, useOverlayChromeContext] = createDomainContext<OverlayChromeContextValue>({
  hookName: 'useOverlayChromeContext',
  displayName: 'OverlayChromeContext',
});
