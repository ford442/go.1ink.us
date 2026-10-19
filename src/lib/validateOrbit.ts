// Structural validation for a project's optional `orbit` payload. Used by the
// CI script (scripts/validate-projects.mjs) and by lib/orbitalOps.ts, which
// re-checks each orbit on first use inside the lazy Orbital Ops chunk. Kept
// out of the runtime validateProjects.ts on purpose: that runs in the entry
// bundle, which has no budget headroom. The TLE checks mirror what tle.ts's
// parseTle() needs to succeed, plus the checksum parseTle() doesn't verify.
import { EARTH_RADIUS_KM, MU_EARTH } from '../ground/ellipsoid';

/** Lowest perigee we accept, km above the reference sphere. */
const MIN_PERIGEE_ALTITUDE_KM = 100;

const ELEMENT_KEYS = new Set([
  'epoch',
  'meanMotionRevPerDay',
  'semiMajorAxisKm',
  'eccentricity',
  'inclinationDeg',
  'raanDeg',
  'argPerigeeDeg',
  'meanAnomalyDeg',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Modulo-10 TLE checksum: digits count as themselves, '-' as 1, everything else 0. */
export function tleChecksum(line: string): number {
  let sum = 0;
  for (const char of line.slice(0, 68)) {
    if (char >= '0' && char <= '9') sum += Number(char);
    else if (char === '-') sum += 1;
  }
  return sum % 10;
}

/** Split a TLE blob into its two data lines, dropping an optional leading name line. */
export function splitTle(tle: string): { name: string | null; line1: string; line2: string } | null {
  const lines = tle.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim().length > 0);
  if (lines.length === 2) return { name: null, line1: lines[0]!, line2: lines[1]! };
  if (lines.length === 3) return { name: lines[0]!.trim(), line1: lines[1]!, line2: lines[2]! };
  return null;
}

function tleError(tle: unknown): string | null {
  if (typeof tle !== 'string') return 'orbit.tle must be a string';
  const parts = splitTle(tle);
  if (!parts) return 'orbit.tle must be two data lines, optionally preceded by a name line';
  const { line1, line2 } = parts;
  for (const [line, expected] of [[line1, '1'], [line2, '2']] as const) {
    if (line.length !== 69) return `orbit.tle line ${expected} must be 69 characters (got ${line.length})`;
    if (!line.startsWith(`${expected} `)) return `orbit.tle line ${expected} must start with "${expected} "`;
    const declared = Number(line[68]);
    if (!Number.isInteger(declared) || declared !== tleChecksum(line)) {
      return `orbit.tle line ${expected} fails its checksum`;
    }
  }
  if (line1.slice(2, 7) !== line2.slice(2, 7)) return 'orbit.tle lines carry different catalog numbers';
  const meanMotion = Number.parseFloat(line2.slice(52, 63));
  if (!(meanMotion > 0)) return 'orbit.tle mean motion must be positive';
  return null;
}

function elementsError(elements: unknown): string | null {
  if (!isPlainObject(elements)) return 'orbit.elements must be an object';
  for (const key of Object.keys(elements)) {
    if (!ELEMENT_KEYS.has(key)) return `orbit.elements has unknown field "${key}"`;
  }

  if (typeof elements.epoch !== 'string' || Number.isNaN(Date.parse(elements.epoch))) {
    return 'orbit.elements.epoch must be an ISO 8601 timestamp';
  }

  const { eccentricity, inclinationDeg, meanMotionRevPerDay, semiMajorAxisKm } = elements;
  if (!isFiniteNumber(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
    return 'orbit.elements.eccentricity must be in [0, 1)';
  }
  if (!isFiniteNumber(inclinationDeg) || inclinationDeg < 0 || inclinationDeg > 180) {
    return 'orbit.elements.inclinationDeg must be in [0, 180]';
  }
  for (const key of ['raanDeg', 'argPerigeeDeg', 'meanAnomalyDeg'] as const) {
    const value = elements[key];
    if (!isFiniteNumber(value) || value < 0 || value >= 360) {
      return `orbit.elements.${key} must be in [0, 360)`;
    }
  }

  const hasMeanMotion = meanMotionRevPerDay !== undefined;
  const hasSemiMajorAxis = semiMajorAxisKm !== undefined;
  if (hasMeanMotion === hasSemiMajorAxis) {
    return 'orbit.elements needs exactly one of meanMotionRevPerDay / semiMajorAxisKm';
  }

  let a: number;
  if (hasMeanMotion) {
    if (!isFiniteNumber(meanMotionRevPerDay) || meanMotionRevPerDay <= 0) {
      return 'orbit.elements.meanMotionRevPerDay must be a positive number';
    }
    const n = (meanMotionRevPerDay * 2 * Math.PI) / 86400;
    a = Math.cbrt(MU_EARTH / (n * n));
  } else {
    if (!isFiniteNumber(semiMajorAxisKm) || semiMajorAxisKm <= 0) {
      return 'orbit.elements.semiMajorAxisKm must be a positive number';
    }
    a = semiMajorAxisKm;
  }
  const perigeeAltitude = a * (1 - eccentricity) - EARTH_RADIUS_KM;
  if (perigeeAltitude < MIN_PERIGEE_ALTITUDE_KM) {
    return `orbit perigee is ${Math.round(perigeeAltitude)} km — must clear ${MIN_PERIGEE_ALTITUDE_KM} km`;
  }
  return null;
}

/**
 * Why a project's `orbit` payload is invalid, or null when it's fine. A
 * missing/null orbit is fine: the project just isn't tracked by Orbital Ops.
 */
export function orbitValidationError(orbit: unknown): string | null {
  if (orbit === undefined || orbit === null) return null;
  if (!isPlainObject(orbit)) return 'orbit must be an object or null';
  for (const key of Object.keys(orbit)) {
    if (key !== 'tle' && key !== 'elements') return `orbit has unknown field "${key}"`;
  }
  const hasTle = orbit.tle !== undefined;
  const hasElements = orbit.elements !== undefined;
  if (hasTle === hasElements) return 'orbit needs exactly one of tle / elements';
  return hasTle ? tleError(orbit.tle) : elementsError(orbit.elements);
}
