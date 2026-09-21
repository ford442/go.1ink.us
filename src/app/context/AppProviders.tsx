import { SettingsContext } from './SettingsContext';
import { BrowserContext, BrowserActionsContext } from './BrowserContext';
import { CatalogCountsContext } from './CatalogCountsContext';
import { LoadoutContext } from './LoadoutContext';
import { TerminalContext } from './TerminalContext';
import { OverlayToastContext } from './OverlayToastContext';
import { OverlayModalContext } from './OverlayModalContext';
import { OverlayContextMenuContext } from './OverlayContextMenuContext';
import { OverlayChromeContext } from './OverlayChromeContext';
import { EffectsContext } from './EffectsContext';
import { ActivityContext } from './ActivityContext';
import { GroundStationContext } from './GroundStationContext';
import type { ReactNode } from 'react';
import type { AppContextValues } from './contextTypes';

interface AppProvidersProps extends AppContextValues {
  children: ReactNode;
}

// Nests the domain providers. App.tsx owns all state and passes in one
// already-memoized value per domain; this component only wires them to
// their Context so a change in one domain's value can't force a re-render
// of components subscribed to a different domain.
export default function AppProviders({
  settings, browser, browserActions, catalogCounts, loadout, terminal,
  overlayToast, overlayModal, overlayContextMenu, overlayChrome,
  effects, activity, groundStation, children,
}: AppProvidersProps) {
  return (
    <SettingsContext.Provider value={settings}>
      <BrowserContext.Provider value={browser}>
        <BrowserActionsContext.Provider value={browserActions}>
          <CatalogCountsContext.Provider value={catalogCounts}>
            <LoadoutContext.Provider value={loadout}>
              <TerminalContext.Provider value={terminal}>
                <OverlayToastContext.Provider value={overlayToast}>
                  <OverlayModalContext.Provider value={overlayModal}>
                    <OverlayContextMenuContext.Provider value={overlayContextMenu}>
                      <OverlayChromeContext.Provider value={overlayChrome}>
                        <EffectsContext.Provider value={effects}>
                          <ActivityContext.Provider value={activity}>
                            <GroundStationContext.Provider value={groundStation}>
                              {children}
                            </GroundStationContext.Provider>
                          </ActivityContext.Provider>
                        </EffectsContext.Provider>
                      </OverlayChromeContext.Provider>
                    </OverlayContextMenuContext.Provider>
                  </OverlayModalContext.Provider>
                </OverlayToastContext.Provider>
              </TerminalContext.Provider>
            </LoadoutContext.Provider>
          </CatalogCountsContext.Provider>
        </BrowserActionsContext.Provider>
      </BrowserContext.Provider>
    </SettingsContext.Provider>
  );
}
