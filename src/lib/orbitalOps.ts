// Orbital Ops: the UI-facing glue between the project catalog and the
// framework-free ground module (src/ground/). Pure functions only — the
// panel, the constellation overlay, and the `passes`/`horizon` terminal
// commands all call into this, and scripts/test-orbital-ops.mjs covers it
// under Node.
//
// Imports the whole `../ground` barrel on purpose: this module is only ever
// reached through a lazy boundary (OrbitalOpsPanel, ConstellationOrbitalOverlay,
// or a dynamic import() from lib/commands/orbital.ts), so the propagator/pass
// code never lands in the entry chunk.
import {
  DEG2RAD,
  RAD2DEG,
  compassPoint,
  evaluateConstellationVisibility,
  footprintAt,
  footprintRing,
  keplerianPropagator,
  parseTle,
  predictPasses,
  tleToElements,
  type FootprintPoint,
  type GroundStation,
  type KeplerianElements,
  type SatellitePropagator,
  type StationFrame,
} from '../ground';
import { orbitValidationError, splitTle } from './validateOrbit';
import type { Project, ProjectOrbit } from '../types';

/**
 * Shown next to every predicted time. The built-in propagator is
 * Keplerian+J2, not SGP4, so times are rounded and labelled approximate
 * rather than quoted to the minute.
 */
export const MODEL_DISCLAIMER = 'Keplerian+J2 model · times approximate (±several min), not SGP4';

/** Predicted times are rounded to this many minutes before display. */
export const APPROX_ROUND_MINUTES = 5;

/** A catalog project that carries an orbit, paired with its propagator. */
export interface OrbitalTrack {
  projectId: number;
  title: string;
  icon: string;
  accent: string | null;
  source: 'tle' | 'elements';
  propagator: SatellitePropagator;
}

export interface PassRow {
  projectId: number;
  title: string;
  icon: string;
  start: Date;
  culmination: Date;
  end: Date;
  durationSec: number;
  maxElevationDeg: number;
  startAzimuthDeg: number;
  endAzimuthDeg: number;
}

export interface LookRow {
  projectId: number;
  title: string;
  icon: string;
  azimuthDeg: number;
  elevationDeg: number;
  rangeKm: number;
  altitudeKm: number;
  visible: boolean;
}

export interface TrackFootprint {
  subSatellite: FootprintPoint;
  groundRadiusKm: number;
  ring: FootprintPoint[];
}

/** Turn a validated `orbit` payload into a propagator, or null when it can't be read. */
export function orbitToPropagator(id: string, name: string, orbit: ProjectOrbit): SatellitePropagator | null {
  try {
    if (orbit.tle !== undefined) {
      const parts = splitTle(orbit.tle);
      if (!parts) return null;
      const record = parseTle(parts.line1, parts.line2, parts.name ?? name);
      // Keep the project's own id/title rather than the TLE's NORAD id/name
      // so every downstream row joins back to the catalog.
      return keplerianPropagator(id, name, tleToElements(record));
    }
    if (orbit.elements !== undefined) {
      const e = orbit.elements;
      const elements: KeplerianElements = {
        eccentricity: e.eccentricity,
        inclination: e.inclinationDeg * DEG2RAD,
        raan: e.raanDeg * DEG2RAD,
        argPerigee: e.argPerigeeDeg * DEG2RAD,
        meanAnomaly: e.meanAnomalyDeg * DEG2RAD,
        epoch: Date.parse(e.epoch),
      };
      if (e.meanMotionRevPerDay !== undefined) elements.meanMotionRevPerDay = e.meanMotionRevPerDay;
      if (e.semiMajorAxisKm !== undefined) elements.semiMajorAxisKm = e.semiMajorAxisKm;
      return keplerianPropagator(id, name, elements);
    }
  } catch {
    // Fall through: an unreadable orbit just leaves the project untracked.
  }
  return null;
}

/**
 * Projects → propagators. Projects without an orbit stay graph nodes only;
 * an orbit that fails validateOrbit is skipped too (CI's validate:projects
 * rejects those, but the runtime entry-bundle validator doesn't check them).
 */
export function projectsToTracks(projects: readonly Project[]): OrbitalTrack[] {
  const tracks: OrbitalTrack[] = [];
  for (const project of projects) {
    if (!project.orbit || orbitValidationError(project.orbit) !== null) continue;
    const propagator = orbitToPropagator(String(project.id), project.title, project.orbit);
    if (!propagator) continue;
    tracks.push({
      projectId: project.id,
      title: project.title,
      icon: project.icon,
      accent: project.accent,
      source: project.orbit.tle !== undefined ? 'tle' : 'elements',
      propagator,
    });
  }
  return tracks;
}

/** Look a track up by project id or a case-insensitive title prefix. */
export function findTrack(tracks: readonly OrbitalTrack[], query: string): OrbitalTrack | null {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;
  const asId = Number(trimmed);
  if (Number.isInteger(asId)) {
    const byId = tracks.find((track) => track.projectId === asId);
    if (byId) return byId;
  }
  return tracks.find((track) => track.title.toLowerCase() === trimmed)
    ?? tracks.find((track) => track.title.toLowerCase().startsWith(trimmed))
    ?? null;
}

export interface PassTableOptions {
  durationHours?: number;
  /** Total rows to return across every track. */
  maxRows?: number;
  /** Cap per track so one low-inclination orbit can't fill the whole table. */
  maxPerTrack?: number;
}

/** The next passes for every track over a station, merged chronologically. */
export function predictTrackPasses(
  frame: StationFrame,
  tracks: readonly OrbitalTrack[],
  from: Date | number,
  options: PassTableOptions = {},
): PassRow[] {
  const durationHours = options.durationHours ?? 24;
  const maxRows = options.maxRows ?? 8;
  const maxPerTrack = options.maxPerTrack ?? 3;
  const rows: PassRow[] = [];

  for (const track of tracks) {
    const passes = predictPasses(frame, track.propagator, from, { durationHours, maxPasses: maxPerTrack });
    for (const pass of passes) {
      rows.push({
        projectId: track.projectId,
        title: track.title,
        icon: track.icon,
        start: pass.start,
        culmination: pass.culmination,
        end: pass.end,
        durationSec: pass.durationSec,
        maxElevationDeg: pass.maxElevationDeg,
        startAzimuthDeg: pass.startAzimuthDeg,
        endAzimuthDeg: pass.endAzimuthDeg,
      });
    }
  }

  rows.sort((a, b) => a.start.getTime() - b.start.getTime());
  return rows.slice(0, maxRows);
}

/** Current look angles (degrees) for every track, highest elevation first. */
export function lookAngleRows(
  frame: StationFrame,
  tracks: readonly OrbitalTrack[],
  at: Date | number,
): LookRow[] {
  const byId = new Map(tracks.map((track) => [String(track.projectId), track]));
  const results = evaluateConstellationVisibility(frame, tracks.map((track) => track.propagator), at);
  const rows: LookRow[] = [];
  for (const result of results) {
    const track = byId.get(result.id);
    if (!track) continue;
    rows.push({
      projectId: track.projectId,
      title: track.title,
      icon: track.icon,
      azimuthDeg: result.look.azimuth * RAD2DEG,
      elevationDeg: result.look.elevation * RAD2DEG,
      rangeKm: result.look.rangeKm,
      altitudeKm: result.altitudeKm,
      visible: result.visible,
    });
  }
  return rows.sort((a, b) => b.elevationDeg - a.elevationDeg);
}

/**
 * Sub-satellite point and coverage ring for one track. The ring uses the
 * station's own minimum elevation, so "station inside the ring" matches the
 * visibility test the pass table runs.
 */
export function trackFootprint(
  frame: StationFrame,
  track: OrbitalTrack,
  at: Date | number,
  segments = 72,
): TrackFootprint | null {
  const footprint = footprintAt(track.propagator, at, frame.minElevation);
  if (!footprint) return null;
  return {
    subSatellite: {
      latitudeDeg: footprint.subSatellite.latitude * RAD2DEG,
      longitudeDeg: footprint.subSatellite.longitude * RAD2DEG,
    },
    groundRadiusKm: footprint.groundRadiusKm,
    ring: footprintRing(footprint, segments),
  };
}

/**
 * Sub-satellite points from `from` forward, for drawing a ground track. Split
 * into segments wherever the track crosses the antimeridian so a flat map
 * doesn't draw a line straight across the whole world.
 */
export function groundTrack(
  track: OrbitalTrack,
  from: Date | number,
  minutes = 95,
  stepSec = 60,
): FootprintPoint[][] {
  const startMs = typeof from === 'number' ? from : from.getTime();
  const segments: FootprintPoint[][] = [];
  let current: FootprintPoint[] = [];
  let previousLon: number | null = null;

  for (let t = 0; t <= minutes * 60; t += stepSec) {
    const footprint = footprintAt(track.propagator, startMs + t * 1000);
    if (!footprint) continue;
    const point = {
      latitudeDeg: footprint.subSatellite.latitude * RAD2DEG,
      longitudeDeg: footprint.subSatellite.longitude * RAD2DEG,
    };
    if (previousLon !== null && Math.abs(point.longitudeDeg - previousLon) > 180) {
      if (current.length > 1) segments.push(current);
      current = [];
    }
    current.push(point);
    previousLon = point.longitudeDeg;
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

/** Split a lat/lon ring at antimeridian crossings (same rule as groundTrack). */
export function splitAtAntimeridian(points: readonly FootprintPoint[]): FootprintPoint[][] {
  const segments: FootprintPoint[][] = [];
  let current: FootprintPoint[] = [];
  for (const point of points) {
    const last = current[current.length - 1];
    if (last && Math.abs(point.longitudeDeg - last.longitudeDeg) > 180) {
      if (current.length > 1) segments.push(current);
      current = [];
    }
    current.push(point);
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

/** Round to the nearest APPROX_ROUND_MINUTES so displayed times don't overstate precision. */
export function roundToApprox(date: Date | number, minutes = APPROX_ROUND_MINUTES): Date {
  const ms = typeof date === 'number' ? date : date.getTime();
  const step = minutes * 60000;
  return new Date(Math.round(ms / step) * step);
}

/** "≈14:35" in the viewer's (or a given) time zone, rounded per roundToApprox. */
export function formatApproxClock(date: Date | number, timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  });
  return `≈${formatter.format(roundToApprox(date))}`;
}

/** "in ≈2h 15m" / "in ≈10m" / "now", rounded to the same step as the clock. */
export function formatApproxCountdown(target: Date | number, now: Date | number): string {
  const targetMs = typeof target === 'number' ? target : target.getTime();
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const minutes = Math.round((targetMs - nowMs) / 60000 / APPROX_ROUND_MINUTES) * APPROX_ROUND_MINUTES;
  if (minutes <= 0) return 'now';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `in ≈${rest}m`;
  return rest === 0 ? `in ≈${hours}h` : `in ≈${hours}h ${rest}m`;
}

export function formatDurationMinutes(durationSec: number): string {
  return `~${Math.max(1, Math.round(durationSec / 60))} min`;
}

function pad(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length);
}

export interface ReportOptions {
  timeZone?: string;
}

/** Terminal text for `passes`. */
export function formatPassesReport(
  station: GroundStation,
  rows: readonly PassRow[],
  now: Date | number,
  options: ReportOptions = {},
): string {
  const header = [
    `PASS TABLE · ${station.name.toUpperCase()} · MIN_EL ${station.minElevationDeg}°`,
    '----------------------------------------------',
  ];
  if (rows.length === 0) {
    return [...header, 'No passes above the station horizon in the next 24h.', '', MODEL_DISCLAIMER].join('\n');
  }
  const lines = rows.map((row) => [
    pad(row.title.toUpperCase(), 14),
    pad(formatApproxClock(row.start, options.timeZone), 7),
    pad(formatApproxCountdown(row.start, now), 12),
    pad(`MAX ${Math.round(row.maxElevationDeg)}°`, 8),
    `${compassPoint(row.startAzimuthDeg)}→${compassPoint(row.endAzimuthDeg)}`,
    ` ${formatDurationMinutes(row.durationSec)}`,
  ].join(' '));
  return [...header, ...lines, '', MODEL_DISCLAIMER].join('\n');
}

/** Terminal text for `horizon`. */
export function formatHorizonReport(station: GroundStation, rows: readonly LookRow[]): string {
  const header = [
    `HORIZON · ${station.name.toUpperCase()} · MIN_EL ${station.minElevationDeg}°`,
    '----------------------------------------------',
  ];
  if (rows.length === 0) return [...header, 'No tracked satellites.'].join('\n');
  const lines = rows.map((row) => [
    row.visible ? '▲' : '·',
    pad(row.title.toUpperCase(), 14),
    pad(`EL ${row.elevationDeg.toFixed(0)}°`, 8),
    pad(`AZ ${row.azimuthDeg.toFixed(0)}° ${compassPoint(row.azimuthDeg)}`, 12),
    `RNG ${Math.round(row.rangeKm)} km`,
  ].join(' '));
  const visibleCount = rows.filter((row) => row.visible).length;
  return [...header, ...lines, '', `${visibleCount}/${rows.length} above horizon.`].join('\n');
}
