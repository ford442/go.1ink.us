import { SettingsContext } from './SettingsContext';
import { BrowserContext } from './BrowserContext';
import { LoadoutContext } from './LoadoutContext';
import { TerminalContext } from './TerminalContext';
import { OverlayContext } from './OverlayContext';
import { EffectsContext } from './EffectsContext';
import { ActivityContext } from './ActivityContext';
import type { ReactNode } from 'react';
import type { AppContextValues } from './contextTypes';

interface AppProvidersProps extends AppContextValues {
  children: ReactNode;
}

// Nests the seven domain providers. App.tsx owns all state and passes in
// one already-memoized value per domain; this component only wires them
// to their Context so a change in one domain's value can't force a
// re-render of components subscribed to a different domain.
export default function AppProviders({ settings, browser, loadout, terminal, overlay, effects, activity, children }: AppProvidersProps) {
  return (
    <SettingsContext.Provider value={settings}>
      <BrowserContext.Provider value={browser}>
        <LoadoutContext.Provider value={loadout}>
          <TerminalContext.Provider value={terminal}>
            <OverlayContext.Provider value={overlay}>
              <EffectsContext.Provider value={effects}>
                <ActivityContext.Provider value={activity}>
                  {children}
                </ActivityContext.Provider>
              </EffectsContext.Provider>
            </OverlayContext.Provider>
          </TerminalContext.Provider>
        </LoadoutContext.Provider>
      </BrowserContext.Provider>
    </SettingsContext.Provider>
  );
}
