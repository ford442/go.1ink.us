/**
 * Pass prediction: when does a satellite rise above a station's horizon, how
 * high does it get, and when does it set.
 *
 * The search is a coarse sweep to find horizon crossings, bisection to pin AOS
 * and LOS, and a golden-section search for the culmination. That keeps the
 * propagator call count low and, crucially, keeps the accuracy of the answer
 * bounded by the propagator rather than by the search — swap in SGP4 and the
 * same code yields reference-grade times.
 */

import { RAD2DEG, eciToEcef, gmst, lookAngles } from './geodesy';
import type { StationFrame } from './GroundStation';
import type { SatellitePropagator } from './propagator';

export interface SatellitePass {
  satelliteId: string;
  satelliteName: string;
  /** Acquisition of signal: the satellite crosses the minimum elevation. */
  start: Date;
  /** Culmination: highest point of the pass. */
  culmination: Date;
  /** Loss of signal. */
  end: Date;
  durationSec: number;
  maxElevationDeg: number;
  /** Compass bearing at AOS, degrees clockwise from north. */
  startAzimuthDeg: number;
  endAzimuthDeg: number;
  /** Slant range at culmination, km. */
  closestApproachKm: number;
}

export interface PassSearchOptions {
  /** How far ahead to look. Default 24 hours. */
  durationHours?: number;
  /** How many passes to return before stopping early. Default 5. */
  maxPasses?: number;
  /**
   * Coarse sample spacing in seconds. Must be short enough that a whole pass
   * cannot fit between samples; 30 s is safe for LEO, where the shortest
   * usable passes run a couple of minutes.
   */
  stepSec?: number;
  /** Refinement tolerance for AOS/LOS, seconds. Default 0.5. */
  toleranceSec?: number;
  /** Override the station's minimum elevation, in radians. */
  minElevation?: number;
}

function elevationAt(
  frame: StationFrame,
  satellite: SatellitePropagator,
  ms: number
): number | null {
  const state = satellite.propagate(ms);
  if (!state) return null;
  const ecef = eciToEcef(state.position, gmst(ms));
  return lookAngles(frame.geodetic, frame.ecef, ecef).elevation;
}

function bisectCrossing(
  frame: StationFrame,
  satellite: SatellitePropagator,
  belowMs: number,
  aboveMs: number,
  threshold: number,
  toleranceMs: number
): number {
  let lo = belowMs;
  let hi = aboveMs;
  while (Math.abs(hi - lo) > toleranceMs) {
    const mid = (lo + hi) / 2;
    const elevation = elevationAt(frame, satellite, mid);
    if (elevation === null) return hi;
    if (elevation >= threshold) hi = mid;
    else lo = mid;
  }
  return hi;
}

const INV_PHI = (Math.sqrt(5) - 1) / 2;

/** Golden-section search for the elevation maximum inside a bracket. */
function findCulmination(
  frame: StationFrame,
  satellite: SatellitePropagator,
  startMs: number,
  endMs: number,
  toleranceMs: number
): number {
  let lo = startMs;
  let hi = endMs;
  let c = hi - (hi - lo) * INV_PHI;
  let d = lo + (hi - lo) * INV_PHI;
  let fc = elevationAt(frame, satellite, c) ?? -Infinity;
  let fd = elevationAt(frame, satellite, d) ?? -Infinity;

  while (hi - lo > toleranceMs) {
    if (fc > fd) {
      hi = d;
      d = c;
      fd = fc;
      c = hi - (hi - lo) * INV_PHI;
      fc = elevationAt(frame, satellite, c) ?? -Infinity;
    } else {
      lo = c;
      c = d;
      fc = fd;
      d = lo + (hi - lo) * INV_PHI;
      fd = elevationAt(frame, satellite, d) ?? -Infinity;
    }
  }
  return (lo + hi) / 2;
}

function sampleAt(
  frame: StationFrame,
  satellite: SatellitePropagator,
  ms: number
): { elevationDeg: number; azimuthDeg: number; rangeKm: number } | null {
  const state = satellite.propagate(ms);
  if (!state) return null;
  const look = lookAngles(frame.geodetic, frame.ecef, eciToEcef(state.position, gmst(ms)));
  return {
    elevationDeg: look.elevation * RAD2DEG,
    azimuthDeg: look.azimuth * RAD2DEG,
    rangeKm: look.rangeKm,
  };
}

/**
 * Predict the next passes of one satellite over one station.
 *
 * A pass in progress at `from` is reported with its true AOS, which may be
 * before `from`; that keeps a live "current pass" panel honest instead of
 * showing a start time of "now".
 */
export function predictPasses(
  frame: StationFrame,
  satellite: SatellitePropagator,
  from: Date | number = Date.now(),
  options: PassSearchOptions = {}
): SatellitePass[] {
  const startMs = typeof from === 'number' ? from : from.getTime();
  const durationHours = options.durationHours ?? 24;
  const maxPasses = options.maxPasses ?? 5;
  const stepMs = (options.stepSec ?? 30) * 1000;
  const toleranceMs = (options.toleranceSec ?? 0.5) * 1000;
  const threshold = options.minElevation ?? frame.minElevation;
  const endMs = startMs + durationHours * 3600000;

  const passes: SatellitePass[] = [];
  let previousMs = startMs;
  let previousElevation = elevationAt(frame, satellite, startMs);
  // A pass already underway at `from`: walk backwards to recover its AOS.
  let aosMs: number | null =
    previousElevation !== null && previousElevation >= threshold
      ? findEarlierAos(frame, satellite, startMs, threshold, stepMs, toleranceMs)
      : null;

  for (let ms = startMs + stepMs; ms <= endMs && passes.length < maxPasses; ms += stepMs) {
    const elevation = elevationAt(frame, satellite, ms);
    if (elevation === null) {
      previousMs = ms;
      previousElevation = null;
      continue;
    }

    const wasUp = previousElevation !== null && previousElevation >= threshold;
    const isUp = elevation >= threshold;

    if (!wasUp && isUp) {
      aosMs = bisectCrossing(frame, satellite, previousMs, ms, threshold, toleranceMs);
    } else if (wasUp && !isUp && aosMs !== null) {
      const losMs = bisectCrossing(frame, satellite, ms, previousMs, threshold, toleranceMs);
      const pass = buildPass(frame, satellite, aosMs, losMs, toleranceMs);
      if (pass) passes.push(pass);
      aosMs = null;
    }

    previousMs = ms;
    previousElevation = elevation;
  }

  return passes;
}

/**
 * Step backwards from a time the satellite is already up to find the horizon
 * crossing that started the pass. Bounded so a geostationary or otherwise
 * permanently-visible satellite cannot spin here.
 */
function findEarlierAos(
  frame: StationFrame,
  satellite: SatellitePropagator,
  fromMs: number,
  threshold: number,
  stepMs: number,
  toleranceMs: number
): number | null {
  const limitMs = fromMs - 24 * 3600000;
  let laterMs = fromMs;
  for (let ms = fromMs - stepMs; ms >= limitMs; ms -= stepMs) {
    const elevation = elevationAt(frame, satellite, ms);
    if (elevation === null) return null;
    if (elevation < threshold) {
      return bisectCrossing(frame, satellite, ms, laterMs, threshold, toleranceMs);
    }
    laterMs = ms;
  }
  return null;
}

function buildPass(
  frame: StationFrame,
  satellite: SatellitePropagator,
  aosMs: number,
  losMs: number,
  toleranceMs: number
): SatellitePass | null {
  const culminationMs = findCulmination(frame, satellite, aosMs, losMs, Math.max(toleranceMs, 250));
  const start = sampleAt(frame, satellite, aosMs);
  const peak = sampleAt(frame, satellite, culminationMs);
  const end = sampleAt(frame, satellite, losMs);
  if (!start || !peak || !end) return null;

  return {
    satelliteId: satellite.id,
    satelliteName: satellite.name,
    start: new Date(Math.round(aosMs)),
    culmination: new Date(Math.round(culminationMs)),
    end: new Date(Math.round(losMs)),
    durationSec: (losMs - aosMs) / 1000,
    maxElevationDeg: peak.elevationDeg,
    startAzimuthDeg: start.azimuthDeg,
    endAzimuthDeg: end.azimuthDeg,
    closestApproachKm: peak.rangeKm,
  };
}

/**
 * Passes for several satellites, merged into one chronological list — the
 * shape a "what's overhead tonight" panel renders directly.
 */
export function predictConstellationPasses(
  frame: StationFrame,
  satellites: readonly SatellitePropagator[],
  from: Date | number = Date.now(),
  options: PassSearchOptions = {}
): SatellitePass[] {
  const merged: SatellitePass[] = [];
  for (const satellite of satellites) {
    merged.push(...predictPasses(frame, satellite, from, options));
  }
  return merged.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Compass point for an azimuth, for pass rows that read "rises NNW". */
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function compassPoint(azimuthDeg: number): string {
  const index = Math.round((((azimuthDeg % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS[index];
}
