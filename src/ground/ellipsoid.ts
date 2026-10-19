/**
 * The eager half of the geodesy primitives: WGS84 constants, the shared
 * vector types, and the two conversions a ground station needs to place
 * itself (geodetic -> ECEF, local zenith). Split out of geodesy.ts so the
 * app's entry chunk — which builds the default station frame at startup via
 * GroundStation.ts — doesn't drag in sidereal time, ECI/ECEF rotation, and
 * look angles, which only the lazy Orbital Ops chunk uses. Rollup assigns a
 * whole module to one chunk, so a module shared by the entry and a lazy
 * chunk ships every export the lazy side uses in the entry too.
 * geodesy.ts re-exports everything here, so callers can keep importing
 * from it.
 */

/** WGS84 semi-major axis (km). */
export const EARTH_RADIUS_KM = 6378.137;
/** WGS84 flattening. */
export const EARTH_FLATTENING = 1 / 298.257223563;
/** WGS84 semi-minor axis (km). */
export const EARTH_POLAR_RADIUS_KM = EARTH_RADIUS_KM * (1 - EARTH_FLATTENING);
/** First eccentricity squared. */
export const ECCENTRICITY_SQ = EARTH_FLATTENING * (2 - EARTH_FLATTENING);
/** Earth gravitational parameter (km^3/s^2). */
export const MU_EARTH = 398600.4418;
/** Second zonal harmonic. */
export const J2 = 0.00108262998905;
/** Earth rotation rate (rad/s), including the sidereal correction. */
export const EARTH_ROTATION_RAD_S = 7.2921159e-5;

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const TWO_PI = Math.PI * 2;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Geodetic {
  /** Latitude in radians, positive north. */
  latitude: number;
  /** Longitude in radians, positive east. */
  longitude: number;
  /** Height above the WGS84 ellipsoid in km. */
  altitudeKm: number;
}

/** Geodetic (WGS84) position to Earth-fixed cartesian km. */
export function geodeticToEcef(position: Geodetic): Vec3 {
  const { latitude, longitude, altitudeKm } = position;
  const sinLat = Math.sin(latitude);
  const cosLat = Math.cos(latitude);
  const n = EARTH_RADIUS_KM / Math.sqrt(1 - ECCENTRICITY_SQ * sinLat * sinLat);
  const radial = (n + altitudeKm) * cosLat;
  return {
    x: radial * Math.cos(longitude),
    y: radial * Math.sin(longitude),
    z: (n * (1 - ECCENTRICITY_SQ) + altitudeKm) * sinLat,
  };
}

/**
 * Local up (zenith) unit vector in the Earth-fixed frame. Precomputing this
 * per station turns the per-satellite horizon test into a dot product.
 */
export function zenithVector(latitude: number, longitude: number): Vec3 {
  const cosLat = Math.cos(latitude);
  return {
    x: cosLat * Math.cos(longitude),
    y: cosLat * Math.sin(longitude),
    z: Math.sin(latitude),
  };
}
