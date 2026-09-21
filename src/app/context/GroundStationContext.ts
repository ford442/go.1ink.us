import createDomainContext from './createDomainContext';
import type { GroundStationContextValue } from './contextTypes';

// Stub domain for #273 (Orbital Ops): active ground station, its derived
// frame, and geolocation request status. Never fold a future pass-table or
// worker-handle domain into this, BrowserContext, or EffectsContext — give
// each its own domain (see AGENTS.md's "when to split a domain" rule).
export const [GroundStationContext, useGroundStationContext] = createDomainContext<GroundStationContextValue>({
  hookName: 'useGroundStationContext',
  displayName: 'GroundStationContext',
});
