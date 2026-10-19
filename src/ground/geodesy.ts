/**
 * Geodesy primitives shared by the ground-station feature: WGS84 conversions,
 * sidereal time, and topocentric look angles. Distances are kilometres and
 * angles are radians unless a name says otherwise.
 */

import {
  DEG2RAD,
  EARTH_POLAR_RADIUS_KM,
  EARTH_RADIUS_KM,
  ECCENTRICITY_SQ,
  EARTH_ROTATION_RAD_S,
  TWO_PI,
  type Geodetic,
  type Vec3,
} from './ellipsoid';

// Constants, Vec3/Geodetic, geodeticToEcef, and zenithVector live in
// ellipsoid.ts (see the note there); re-exported so this stays the one
// import path for geodesy.
export * from './ellipsoid';

/** Topocentric look angles from an observer to a target. */
export interface LookAngles {
  /** Compass bearing in radians, clockwise from north. */
  azimuth: number;
  /** Angle above the local horizon in radians. */
  elevation: number;
  /** Slant range in km. */
  rangeKm: number;
}

export function normalizeAngle(radians: number): number {
  const wrapped = radians % TWO_PI;
  return wrapped < 0 ? wrapped + TWO_PI : wrapped;
}

/** Wrap to (-pi, pi], the form longitudes are usually displayed in. */
export function normalizeSigned(radians: number): number {
  const wrapped = normalizeAngle(radians);
  return wrapped > Math.PI ? wrapped - TWO_PI : wrapped;
}

export function magnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Julian date for a JS timestamp. */
export function toJulianDate(date: Date | number): number {
  const ms = typeof date === 'number' ? date : date.getTime();
  return ms / 86400000 + 2440587.5;
}

/**
 * Greenwich mean sidereal time in radians (IAU 1982 polynomial, the same
 * series SGP4 implementations use, so ECI frames stay consistent).
 */
export function gmst(date: Date | number): number {
  const t = (toJulianDate(date) - 2451545.0) / 36525;
  const seconds =
    67310.54841 +
    (876600 * 3600 + 8640184.812866) * t +
    0.093104 * t * t -
    6.2e-6 * t * t * t;
  // 240 seconds of sidereal time per degree of rotation.
  return normalizeAngle((seconds % 86400) / 240 * DEG2RAD);
}

/** Rotate an Earth-centred inertial vector into the Earth-fixed frame. */
export function eciToEcef(v: Vec3, gmstRad: number): Vec3 {
  const cos = Math.cos(gmstRad);
  const sin = Math.sin(gmstRad);
  return {
    x: v.x * cos + v.y * sin,
    y: -v.x * sin + v.y * cos,
    z: v.z,
  };
}

/** Rotate an Earth-fixed vector into the inertial frame. */
export function ecefToEci(v: Vec3, gmstRad: number): Vec3 {
  const cos = Math.cos(gmstRad);
  const sin = Math.sin(gmstRad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    z: v.z,
  };
}

/** Earth-fixed cartesian km to geodetic (WGS84), via Bowring's method. */
export function ecefToGeodetic(v: Vec3): Geodetic {
  const p = Math.hypot(v.x, v.y);
  const longitude = normalizeSigned(Math.atan2(v.y, v.x));

  if (p < 1e-9) {
    const sign = v.z >= 0 ? 1 : -1;
    return {
      latitude: (sign * Math.PI) / 2,
      longitude,
      altitudeKm: Math.abs(v.z) - EARTH_POLAR_RADIUS_KM,
    };
  }

  const b = EARTH_POLAR_RADIUS_KM;
  const epSq = (EARTH_RADIUS_KM * EARTH_RADIUS_KM - b * b) / (b * b);
  const theta = Math.atan2(v.z * EARTH_RADIUS_KM, p * b);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const latitude = Math.atan2(
    v.z + epSq * b * sinTheta * sinTheta * sinTheta,
    p - ECCENTRICITY_SQ * EARTH_RADIUS_KM * cosTheta * cosTheta * cosTheta
  );

  const sinLat = Math.sin(latitude);
  const n = EARTH_RADIUS_KM / Math.sqrt(1 - ECCENTRICITY_SQ * sinLat * sinLat);
  // Near the poles p -> 0 makes the p/cos(lat) form ill-conditioned.
  const altitudeKm =
    Math.abs(latitude) > 1.4
      ? v.z / sinLat - n * (1 - ECCENTRICITY_SQ)
      : p / Math.cos(latitude) - n;

  return { latitude, longitude, altitudeKm };
}

/**
 * Topocentric look angles from an observer to a target, both given as
 * Earth-fixed cartesian km.
 */
export function lookAngles(
  observer: Geodetic,
  observerEcef: Vec3,
  targetEcef: Vec3
): LookAngles {
  const r = subtract(targetEcef, observerEcef);
  const rangeKm = magnitude(r);
  if (rangeKm < 1e-9) return { azimuth: 0, elevation: Math.PI / 2, rangeKm: 0 };

  const sinLat = Math.sin(observer.latitude);
  const cosLat = Math.cos(observer.latitude);
  const sinLon = Math.sin(observer.longitude);
  const cosLon = Math.cos(observer.longitude);

  // South-East-Zenith topocentric frame.
  const south = sinLat * cosLon * r.x + sinLat * sinLon * r.y - cosLat * r.z;
  const east = -sinLon * r.x + cosLon * r.y;
  const up = cosLat * cosLon * r.x + cosLat * sinLon * r.y + sinLat * r.z;

  return {
    azimuth: normalizeAngle(Math.atan2(east, -south)),
    elevation: Math.asin(Math.max(-1, Math.min(1, up / rangeKm))),
    rangeKm,
  };
}

/**
 * Great-circle destination from a point, given an angular distance and a
 * bearing. Used to walk footprint circles around the globe.
 */
export function destinationPoint(
  latitude: number,
  longitude: number,
  angularDistance: number,
  bearing: number
): { latitude: number; longitude: number } {
  const sinLat = Math.sin(latitude);
  const cosLat = Math.cos(latitude);
  const sinD = Math.sin(angularDistance);
  const cosD = Math.cos(angularDistance);

  const lat = Math.asin(
    Math.max(-1, Math.min(1, sinLat * cosD + cosLat * sinD * Math.cos(bearing)))
  );
  const lon =
    longitude +
    Math.atan2(Math.sin(bearing) * sinD * cosLat, cosD - sinLat * Math.sin(lat));

  return { latitude: lat, longitude: normalizeSigned(lon) };
}
