import createDomainContext from './createDomainContext';
import type { SettingsContextValue } from './contextTypes';

// theme, CRT, matrix rain, sound, display mode, god mode
export const [SettingsContext, useSettingsContext] = createDomainContext<SettingsContextValue>({
  hookName: 'useSettingsContext',
  displayName: 'SettingsContext',
});
