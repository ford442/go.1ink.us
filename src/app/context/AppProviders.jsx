import { SettingsContext } from './SettingsContext';
import { BrowserContext } from './BrowserContext';
import { TerminalContext } from './TerminalContext';
import { OverlayContext } from './OverlayContext';
import { EffectsContext } from './EffectsContext';
import { ActivityContext } from './ActivityContext';

// Nests the six domain providers. App.jsx owns all state and passes in
// one already-memoized value per domain; this component only wires them
// to their Context so a change in one domain's value can't force a
// re-render of components subscribed to a different domain.
export default function AppProviders({ settings, browser, terminal, overlay, effects, activity, children }) {
  return (
    <SettingsContext.Provider value={settings}>
      <BrowserContext.Provider value={browser}>
        <TerminalContext.Provider value={terminal}>
          <OverlayContext.Provider value={overlay}>
            <EffectsContext.Provider value={effects}>
              <ActivityContext.Provider value={activity}>
                {children}
              </ActivityContext.Provider>
            </EffectsContext.Provider>
          </OverlayContext.Provider>
        </TerminalContext.Provider>
      </BrowserContext.Provider>
    </SettingsContext.Provider>
  );
}
