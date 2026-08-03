/**
 * Coverage footprints: the patch of Earth that can see a satellite above a
 * given elevation angle, expressed as a spherical cap so it can be drawn as a
 * ring on a globe or a polygon on a flat map.
 */

import {
  EARTH_RADIUS_KM,
  type Geodetic,
  type Vec3,
  destinationPoint,
  ecefToGeodetic,
  eciToEcef,
  gmst,
  magnitude,
  normalizeSigned,
  RAD2DEG,
  TWO_PI,
} from './geodesy';
import type { SatellitePropagator } from './propagator';

export interface Footprint {
  /** Point directly beneath the satellite. */
  subSatellite: Geodetic;
  /** Angular radius of the coverage cap, in radians of Earth central angle. */
  angularRadius: number;
  /** Surface radius of the cap along the ground, km. */
  groundRadiusKm: number;
  /** Satellite height above the reference sphere, km. */
  altitudeKm: number;
}

/**
 * Earth central angle from the sub-satellite point to the edge of coverage.
 *
 *   lambda = acos(R cos(eps) / (R + h)) - eps
 *
 * Returns 0 when the satellite is too low to see past its own horizon at that
 * elevation angle.
 */
export function coverageAngularRadius(
  altitudeKm: number,
  minElevation = 0,
  earthRadiusKm = EARTH_RADIUS_KM
): number {
  if (!(altitudeKm > 0)) return 0;
  const ratio = (earthRadiusKm * Math.cos(minElevation)) / (earthRadiusKm + altitudeKm);
  if (ratio >= 1) return 0;
  return Math.max(0, Math.acos(ratio) - minElevation);
}

/** Footprint for a satellite already expressed in the Earth-fixed frame. */
export function footprintFromEcef(satelliteEcef: Vec3, minElevation = 0): Footprint {
  const subSatellite = ecefToGeodetic(satelliteEcef);
  // Use the spherical altitude for the cap geometry: the closed form above
  // assumes a sphere, so mixing in the ellipsoidal height would be inconsistent.
  const altitudeKm = magnitude(satelliteEcef) - EARTH_RADIUS_KM;
  const angularRadius = coverageAngularRadius(altitudeKm, minElevation);

  return {
    subSatellite,
    angularRadius,
    groundRadiusKm: angularRadius * EARTH_RADIUS_KM,
    altitudeKm,
  };
}

/** Footprint for a satellite at a given time. */
export function footprintAt(
  satellite: SatellitePropagator,
  date: Date | number,
  minElevation = 0
): Footprint | null {
  const state = satellite.propagate(date);
  if (!state) return null;
  return footprintFromEcef(eciToEcef(state.position, gmst(date)), minElevation);
}

export interface FootprintPoint {
  latitudeDeg: number;
  longitudeDeg: number;
}

/**
 * Sample the footprint boundary as a closed ring of lat/lon points, walking
 * bearings from the sub-satellite point. `segments` controls smoothness; 64 is
 * plenty at globe scale.
 */
export function footprintRing(footprint: Footprint, segments = 64): FootprintPoint[] {
  const count = Math.max(3, Math.floor(segments));
  const { latitude, longitude } = footprint.subSatellite;
  const points: FootprintPoint[] = [];

  for (let i = 0; i <= count; i += 1) {
    const bearing = (i / count) * TWO_PI;
    const point = destinationPoint(latitude, longitude, footprint.angularRadius, bearing);
    points.push({
      latitudeDeg: point.latitude * RAD2DEG,
      longitudeDeg: point.longitude * RAD2DEG,
    });
  }

  return points;
}

/**
 * Footprint boundary as unit vectors on the sphere — the form a three.js ring
 * wants, since it can be scaled straight onto the globe mesh radius.
 */
export function footprintRingVectors(footprint: Footprint, segments = 64): Vec3[] {
  return footprintRing(footprint, segments).map((point) => {
    const lat = point.latitudeDeg / RAD2DEG;
    const lon = point.longitudeDeg / RAD2DEG;
    const cosLat = Math.cos(lat);
    return { x: cosLat * Math.cos(lon), y: cosLat * Math.sin(lon), z: Math.sin(lat) };
  });
}

/**
 * Whether a ground point falls inside the footprint. Equivalent to the
 * elevation test the visibility pass runs, but phrased in map coordinates.
 */
export function isInsideFootprint(
  footprint: Footprint,
  latitude: number,
  longitude: number
): boolean {
  const { latitude: lat0, longitude: lon0 } = footprint.subSatellite;
  const central = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        Math.sin(lat0) * Math.sin(latitude) +
          Math.cos(lat0) * Math.cos(latitude) * Math.cos(normalizeSigned(longitude - lon0))
      )
    )
  );
  return central <= footprint.angularRadius;
}
