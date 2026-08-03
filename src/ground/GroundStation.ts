/**
 * Ground station model: where the observer is standing, and how high above the
 * horizon a satellite has to be before it counts as visible.
 */

import {
  DEG2RAD,
  RAD2DEG,
  type Geodetic,
  type Vec3,
  geodeticToEcef,
  zenithVector,
} from './geodesy';

export interface GroundStation {
  id: string;
  name: string;
  /** Latitude in degrees, positive north. */
  latitudeDeg: number;
  /** Longitude in degrees, positive east. */
  longitudeDeg: number;
  /** Height above the WGS84 ellipsoid in metres. */
  altitudeM: number;
  /**
   * Elevation a satellite must clear to count as visible, in degrees. Ten is a
   * reasonable default for a backyard with trees and buildings on the skyline.
   */
  minElevationDeg: number;
  /** How the station got here, so the UI can label user-placed pins. */
  source: GroundStationSource;
}

export type GroundStationSource = 'preset' | 'manual' | 'geolocation';

/**
 * Derived quantities that never change while the station stays put. Compute
 * once and hand to the per-frame visibility pass.
 */
export interface StationFrame {
  station: GroundStation;
  geodetic: Geodetic;
  /** Station position in the Earth-fixed frame (km). */
  ecef: Vec3;
  /** Local up unit vector in the Earth-fixed frame. */
  zenith: Vec3;
  /** minElevationDeg in radians. */
  minElevation: number;
}

export const DEFAULT_MIN_ELEVATION_DEG = 10;

/** A short, recognisable list for the "drop a station" picker. */
export const PRESET_STATIONS: readonly GroundStation[] = Object.freeze([
  station('greenwich', 'Greenwich, UK', 51.4779, -0.0015, 47),
  station('new-york', 'New York, USA', 40.7128, -74.006, 10),
  station('san-francisco', 'San Francisco, USA', 37.7749, -122.4194, 16),
  station('sao-paulo', 'São Paulo, Brazil', -23.5505, -46.6333, 760),
  station('reykjavik', 'Reykjavík, Iceland', 64.1466, -21.9426, 61),
  station('lagos', 'Lagos, Nigeria', 6.5244, 3.3792, 41),
  station('bengaluru', 'Bengaluru, India', 12.9716, 77.5946, 920),
  station('tokyo', 'Tokyo, Japan', 35.6762, 139.6503, 40),
  station('sydney', 'Sydney, Australia', -33.8688, 151.2093, 58),
  station('mcmurdo', 'McMurdo Station, Antarctica', -77.8419, 166.6863, 24),
]);

function station(
  id: string,
  name: string,
  latitudeDeg: number,
  longitudeDeg: number,
  altitudeM: number
): GroundStation {
  return {
    id,
    name,
    latitudeDeg,
    longitudeDeg,
    altitudeM,
    minElevationDeg: DEFAULT_MIN_ELEVATION_DEG,
    source: 'preset',
  };
}

export interface GroundStationInput {
  id?: string;
  name?: string;
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeM?: number;
  minElevationDeg?: number;
  source?: GroundStationSource;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Wrap a longitude into (-180, 180] so pins east of the date line behave. */
export function wrapLongitudeDeg(longitudeDeg: number): number {
  const wrapped = ((longitudeDeg + 180) % 360 + 360) % 360 - 180;
  // -180 and 180 are the same meridian; prefer the positive form.
  return wrapped === -180 ? 180 : wrapped;
}

/**
 * Build a station from user input, clamping the values that have hard physical
 * limits. Throws on inputs that cannot be salvaged (NaN coordinates).
 */
export function createStation(input: GroundStationInput): GroundStation {
  const { latitudeDeg, longitudeDeg } = input;
  if (!Number.isFinite(latitudeDeg) || !Number.isFinite(longitudeDeg)) {
    throw new RangeError('Ground station needs finite latitude and longitude');
  }

  const source = input.source ?? 'manual';
  return {
    id: input.id ?? `station-${Math.round(latitudeDeg * 1e4)}-${Math.round(longitudeDeg * 1e4)}`,
    name: input.name?.trim() || formatCoordinates(latitudeDeg, longitudeDeg),
    latitudeDeg: clamp(latitudeDeg, -90, 90),
    longitudeDeg: wrapLongitudeDeg(longitudeDeg),
    altitudeM: Number.isFinite(input.altitudeM) ? (input.altitudeM as number) : 0,
    minElevationDeg: clamp(
      Number.isFinite(input.minElevationDeg)
        ? (input.minElevationDeg as number)
        : DEFAULT_MIN_ELEVATION_DEG,
      0,
      89
    ),
    source,
  };
}

/** Human-readable "40.7128°N 74.0060°W". */
export function formatCoordinates(latitudeDeg: number, longitudeDeg: number): string {
  const lon = wrapLongitudeDeg(longitudeDeg);
  const ns = latitudeDeg >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(latitudeDeg).toFixed(4)}°${ns} ${Math.abs(lon).toFixed(4)}°${ew}`;
}

/** Precompute the Earth-fixed quantities the visibility pass reuses. */
export function stationFrame(station: GroundStation): StationFrame {
  const geodetic: Geodetic = {
    latitude: station.latitudeDeg * DEG2RAD,
    longitude: station.longitudeDeg * DEG2RAD,
    altitudeKm: station.altitudeM / 1000,
  };
  return {
    station,
    geodetic,
    ecef: geodeticToEcef(geodetic),
    zenith: zenithVector(geodetic.latitude, geodetic.longitude),
    minElevation: station.minElevationDeg * DEG2RAD,
  };
}

export function stationToGeodetic(station: GroundStation): Geodetic {
  return {
    latitude: station.latitudeDeg * DEG2RAD,
    longitude: station.longitudeDeg * DEG2RAD,
    altitudeKm: station.altitudeM / 1000,
  };
}

export function geodeticToStation(
  position: Geodetic,
  overrides: Partial<GroundStationInput> = {}
): GroundStation {
  return createStation({
    latitudeDeg: position.latitude * RAD2DEG,
    longitudeDeg: position.longitude * RAD2DEG,
    altitudeM: position.altitudeKm * 1000,
    ...overrides,
  });
}

export interface GeolocationRequestOptions {
  timeoutMs?: number;
  maximumAgeMs?: number;
  enableHighAccuracy?: boolean;
  minElevationDeg?: number;
  name?: string;
}

/**
 * Resolve the browser's location into a station. Strictly opt-in: nothing here
 * runs unless a caller invokes it from a user gesture, and the browser's own
 * permission prompt still gates the result. Rejects (never silently falls back
 * to a default location) so the UI can keep the previous station on refusal.
 */
export function requestGeolocationStation(
  options: GeolocationRequestOptions = {}
): Promise<GroundStation> {
  return new Promise((resolve, reject) => {
    const geolocation =
      typeof navigator === 'undefined' ? undefined : navigator.geolocation;
    if (!geolocation) {
      reject(new Error('Geolocation is not available in this browser'));
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        resolve(
          createStation({
            id: 'geolocation',
            name: options.name ?? 'My location',
            latitudeDeg: position.coords.latitude,
            longitudeDeg: position.coords.longitude,
            altitudeM: position.coords.altitude ?? 0,
            minElevationDeg: options.minElevationDeg,
            source: 'geolocation',
          })
        );
      },
      (error) => reject(new Error(error.message || 'Location request failed')),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? false,
        timeout: options.timeoutMs ?? 10000,
        maximumAge: options.maximumAgeMs ?? 60000,
      }
    );
  });
}
