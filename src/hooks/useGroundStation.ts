import { useCallback, useMemo, useState } from 'react';
// Import directly from GroundStation.ts, not the `../ground` barrel: this
// hook runs unconditionally in App.tsx (part of the eager main bundle), and
// the barrel re-exports propagator/tle/visibility/footprint/passes too —
// #273's job, not needed for this stub — which the bundler can't always
// tree-shake away.
import { PRESET_STATIONS, requestGeolocationStation, stationFrame, type GroundStation } from '../ground/GroundStation';
import type { GeolocationStatus } from '../app/context/contextTypes';

const DEFAULT_STATION: GroundStation = PRESET_STATIONS[0]!;

// Ground station state for the future Orbital Ops pass table (#273): the
// active station (defaulting to a preset), its derived frame, and
// geolocation request status. This is a stub — #273 owns the pass table and
// constellation overlay that will read `frame` at frame-rate — but it's its
// own hook/domain from day one so that work has somewhere to land other
// than BrowserContext or EffectsContext.
export default function useGroundStation() {
  const [station, setStation] = useState<GroundStation>(DEFAULT_STATION);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>('idle');

  const frame = useMemo(() => stationFrame(station), [station]);

  const requestGeolocation = useCallback(() => {
    setGeolocationStatus('requesting');
    requestGeolocationStation()
      .then((nextStation) => {
        setStation(nextStation);
        setGeolocationStatus('granted');
      })
      .catch(() => {
        const supported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
        setGeolocationStatus(supported ? 'denied' : 'unsupported');
      });
  }, []);

  return { station, setStation, frame, geolocationStatus, requestGeolocation };
}
