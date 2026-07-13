import createDomainContext from './createDomainContext';

// theme, CRT, matrix rain, sound, display mode, god mode
export const [SettingsContext, useSettingsContext] = createDomainContext('useSettingsContext');
