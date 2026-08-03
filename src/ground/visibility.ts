/**
 * Per-satellite visibility against a ground station. The hot path is the
 * horizon test, which is a dot product against the station zenith plus a
 * compare — cheap enough to fold into an existing per-frame orbital pass.
 */

import {
  EARTH_RADIUS_KM,
  type LookAngles,
  type Vec3,
  dot,
  eciToEcef,
  gmst,
  lookAngles,
  magnitude,
} from './geodesy';
import type { StationFrame } from './GroundStation';
import type { SatellitePropagator } from './propagator';

/**
 * True when the satellite is at least `minElevation` above the station's
 * horizon. Both positions are Earth-fixed km.
 *
 * sin(elevation) = (r . zenith) / |r|, so comparing against sin(minElevation)
 * avoids the asin entirely.
 */
export function isAboveHorizon(
  stationEcef: Vec3,
  zenith: Vec3,
  satelliteEcef: Vec3,
  sinMinElevation: number
): boolean {
  const rx = satelliteEcef.x - stationEcef.x;
  const ry = satelliteEcef.y - stationEcef.y;
  const rz = satelliteEcef.z - stationEcef.z;
  const up = rx * zenith.x + ry * zenith.y + rz * zenith.z;
  // Below the local horizontal plane, and the threshold is at or above it:
  // reject without paying for the square root.
  if (up < 0 && sinMinElevation >= 0) return false;
  const range = Math.sqrt(rx * rx + ry * ry + rz * rz);
  if (range < 1e-9) return true;
  return up / range >= sinMinElevation;
}

export interface SatelliteVisibility {
  id: string;
  name: string;
  visible: boolean;
  look: LookAngles;
  /** Earth-fixed position (km) at the evaluated time. */
  ecef: Vec3;
  /** Height above the reference sphere (km); handy for footprint sizing. */
  altitudeKm: number;
}

export interface VisibilityOptions {
  /** Override the station's own minimum elevation, in radians. */
  minElevation?: number;
}

/**
 * Evaluate one satellite against a station. Returns null when the propagator
 * has no state for that time.
 */
export function evaluateVisibility(
  frame: StationFrame,
  satellite: SatellitePropagator,
  date: Date | number,
  options: VisibilityOptions = {}
): SatelliteVisibility | null {
  const state = satellite.propagate(date);
  if (!state) return null;

  const ecef = eciToEcef(state.position, gmst(date));
  const look = lookAngles(frame.geodetic, frame.ecef, ecef);
  const minElevation = options.minElevation ?? frame.minElevation;

  return {
    id: satellite.id,
    name: satellite.name,
    visible: look.elevation >= minElevation,
    look,
    ecef,
    altitudeKm: magnitude(ecef) - EARTH_RADIUS_KM,
  };
}

/**
 * Evaluate a whole constellation at one instant. GMST is computed once for the
 * batch rather than per satellite.
 */
export function evaluateConstellationVisibility(
  frame: StationFrame,
  satellites: readonly SatellitePropagator[],
  date: Date | number,
  options: VisibilityOptions = {}
): SatelliteVisibility[] {
  const theta = gmst(date);
  const minElevation = options.minElevation ?? frame.minElevation;
  const sinMin = Math.sin(minElevation);
  const results: SatelliteVisibility[] = [];

  for (const satellite of satellites) {
    const state = satellite.propagate(date);
    if (!state) continue;
    const ecef = eciToEcef(state.position, theta);
    const look = lookAngles(frame.geodetic, frame.ecef, ecef);
    results.push({
      id: satellite.id,
      name: satellite.name,
      visible: isAboveHorizon(frame.ecef, frame.zenith, ecef, sinMin),
      look,
      ecef,
      altitudeKm: magnitude(ecef) - EARTH_RADIUS_KM,
    });
  }

  return results;
}

/** The set of ids currently above the horizon, for the selection/tint layer. */
export function visibleIds(results: readonly SatelliteVisibility[]): Set<string> {
  const ids = new Set<string>();
  for (const result of results) {
    if (result.visible) ids.add(result.id);
  }
  return ids;
}

/** Cosine of the angle between the station zenith and the satellite. */
export function zenithAngleCosine(frame: StationFrame, satelliteEcef: Vec3): number {
  const range = magnitude(satelliteEcef);
  return range < 1e-9 ? 0 : dot(frame.zenith, satelliteEcef) / range;
}
