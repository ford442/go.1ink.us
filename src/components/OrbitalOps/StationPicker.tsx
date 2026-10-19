import { useId } from 'react';
import { PRESET_STATIONS, formatCoordinates } from '../../ground/GroundStation';
import { useGroundStationContext } from '../../app/context/GroundStationContext';
import type { GeolocationStatus } from '../../app/context/contextTypes';

const STATUS_TEXT: Record<GeolocationStatus, string | null> = {
  idle: null,
  requesting: 'AWAITING POSITION FIX…',
  granted: 'POSITION FIX ACQUIRED',
  denied: 'PERMISSION DENIED — station unchanged',
  unsupported: 'GEOLOCATION UNAVAILABLE — station unchanged',
};

const CUSTOM_VALUE = '__current__';

export default function StationPicker() {
  const { station, setStation, geolocationStatus, requestGeolocation } = useGroundStationContext();
  const selectId = useId();
  const isPreset = station.source === 'preset' && PRESET_STATIONS.some((preset) => preset.id === station.id);
  const statusText = STATUS_TEXT[geolocationStatus];

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-[10px] font-mono tracking-widest text-accent-400/80 uppercase">
        Ground Station
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id={selectId}
          value={isPreset ? station.id : CUSTOM_VALUE}
          onChange={(event) => {
            const preset = PRESET_STATIONS.find((candidate) => candidate.id === event.target.value);
            if (preset) setStation(preset);
          }}
          className="flex-1 min-w-[10rem] bg-black/50 border border-accent-500/30 rounded-md px-2 py-1.5 text-xs font-mono text-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400"
        >
          {!isPreset && <option value={CUSTOM_VALUE}>{station.name}</option>}
          {PRESET_STATIONS.map((preset) => (
            <option key={preset.id} value={preset.id}>{preset.name}</option>
          ))}
        </select>
        <button
          type="button"
          // Only ever called from this click: geolocation stays a user gesture.
          onClick={() => { void requestGeolocation(); }}
          disabled={geolocationStatus === 'requesting'}
          className="px-2 py-1.5 rounded-md border border-accent-500/40 text-[10px] font-mono uppercase tracking-widest text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400"
        >
          📍 Use my location
        </button>
      </div>
      <p className="text-[10px] font-mono text-gray-400">
        {formatCoordinates(station.latitudeDeg, station.longitudeDeg)} · MIN_EL {station.minElevationDeg}°
      </p>
      {statusText && (
        <p
          role="status"
          className={`text-[10px] font-mono ${geolocationStatus === 'granted' ? 'text-green-400' : geolocationStatus === 'requesting' ? 'text-accent-300' : 'text-amber-400'}`}
        >
          {statusText}
        </p>
      )}
    </div>
  );
}
