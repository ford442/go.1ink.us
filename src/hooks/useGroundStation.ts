import { useCallback, useMemo, useState } from 'react';
// Import directly from GroundStation.ts, not the `../ground` barrel: this
// hook runs unconditionally in App.tsx (part of the eager main bundle), and
// the barrel re-exports propagator/tle/visibility/footprint/passes too —
// the lazy Orbital Ops chunk's job (lib/orbitalOps.ts) — which the bundler
// can't always tree-shake away.
import { PRESET_STATIONS, requestGeolocationStation, stationFrame, type GroundStation } from '../ground/GroundStation';
import type { GeolocationStatus } from '../app/context/contextTypes';

const DEFAULT_STATION: GroundStation = PRESET_STATIONS[0]!;

// Ground station state for Orbital Ops: the active station (defaulting to a
// preset so the panel works without any permission), its derived frame, and
// geolocation request status. The pass table, constellation overlay, and
// `station`/`passes`/`horizon` terminal commands all read it through
// GroundStationContext / CommandContext rather than BrowserContext or
// EffectsContext.
//
// Geolocation is strictly opt-in: requestGeolocation() is only ever called
// from a user gesture (panel button, `station locate`), and a refusal
// resolves null and leaves the current station untouched.
export default function useGroundStation() {
  const [station, setStation] = useState<GroundStation>(DEFAULT_STATION);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>('idle');

  const frame = useMemo(() => stationFrame(station), [station]);

  const requestGeolocation = useCallback((): Promise<GroundStation | null> => {
    setGeolocationStatus('requesting');
    return requestGeolocationStation()
      .then((nextStation) => {
        setStation(nextStation);
        setGeolocationStatus('granted');
        return nextStation;
      })
      .catch(() => {
        const supported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
        setGeolocationStatus(supported ? 'denied' : 'unsupported');
        return null;
      });
  }, []);

  return { station, setStation, frame, geolocationStatus, requestGeolocation };
}
