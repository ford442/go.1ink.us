/**
 * Orbit propagation behind a single narrow interface, so the visibility and
 * pass-prediction code never has to care whether positions come from the
 * built-in Keplerian model or from a real SGP4 implementation.
 */

import {
  EARTH_RADIUS_KM,
  J2,
  MU_EARTH,
  TWO_PI,
  type Vec3,
  normalizeAngle,
} from './geodesy';

/** Position (and optionally velocity) in the true-equator ECI frame, km. */
export interface OrbitState {
  position: Vec3;
  velocityKmS?: Vec3;
}

/**
 * A satellite whose ECI position can be evaluated at an arbitrary time.
 * `satellite.js`'s `propagate()` output maps onto this in a few lines, which is
 * the intended SGP4 path.
 */
export interface SatellitePropagator {
  id: string;
  name: string;
  /** Returns null when the model cannot produce a state (decayed, out of range). */
  propagate(date: Date | number): OrbitState | null;
}

/** Classical orbital elements, mean at `epoch`. */
export interface KeplerianElements {
  /** Semi-major axis, km. Supply this or `meanMotionRevPerDay`. */
  semiMajorAxisKm?: number;
  /** Mean motion in revolutions per day, the form TLEs carry. */
  meanMotionRevPerDay?: number;
  eccentricity: number;
  /** Radians. */
  inclination: number;
  /** Right ascension of the ascending node, radians. */
  raan: number;
  /** Argument of perigee, radians. */
  argPerigee: number;
  /** Mean anomaly at epoch, radians. */
  meanAnomaly: number;
  epoch: Date | number;
}

export function semiMajorAxisFromMeanMotion(revPerDay: number): number {
  const n = (revPerDay * TWO_PI) / 86400; // rad/s
  return Math.cbrt(MU_EARTH / (n * n));
}

export function meanMotionRadPerSec(elements: KeplerianElements): number {
  if (elements.meanMotionRevPerDay !== undefined) {
    return (elements.meanMotionRevPerDay * TWO_PI) / 86400;
  }
  const a = elements.semiMajorAxisKm;
  if (a === undefined || !(a > 0)) {
    throw new RangeError('Elements need semiMajorAxisKm or meanMotionRevPerDay');
  }
  return Math.sqrt(MU_EARTH / (a * a * a));
}

/** Solve Kepler's equation for the eccentric anomaly (Newton-Raphson). */
export function solveKepler(meanAnomaly: number, eccentricity: number): number {
  const m = normalizeAngle(meanAnomaly);
  let e = eccentricity < 0.8 ? m : Math.PI;
  for (let i = 0; i < 40; i += 1) {
    const f = e - eccentricity * Math.sin(e) - m;
    const df = 1 - eccentricity * Math.cos(e);
    const delta = f / df;
    e -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  return e;
}

/**
 * Two-body propagation with J2 secular drift of the node, perigee, and mean
 * anomaly. Good to a few km over a day for low Earth orbit — enough to place
 * footprints and shortlist passes, but refine with SGP4 before quoting AOS
 * times to the second.
 */
export function keplerianPropagator(
  id: string,
  name: string,
  elements: KeplerianElements
): SatellitePropagator {
  const a =
    elements.semiMajorAxisKm ??
    semiMajorAxisFromMeanMotion(elements.meanMotionRevPerDay as number);
  const e = elements.eccentricity;
  const i = elements.inclination;
  const n0 = meanMotionRadPerSec(elements);
  const epochMs = typeof elements.epoch === 'number' ? elements.epoch : elements.epoch.getTime();

  const cosInc = Math.cos(i);
  const sinInc = Math.sin(i);

  // Secular rates from the J2 oblateness term (Vallado 9-38..9-41).
  const p = a * (1 - e * e);
  const factor = (1.5 * J2 * n0 * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / (p * p);
  const raanDot = -factor * cosInc;
  const argPerigeeDot = factor * (2 - 2.5 * sinInc * sinInc);
  // A TLE's mean motion is already the Kozai value, i.e. J2's effect on the
  // anomaly rate is baked in; adding the correction again would double-count.
  const meanAnomalyDot =
    elements.meanMotionRevPerDay !== undefined
      ? n0
      : n0 + factor * Math.sqrt(1 - e * e) * (1 - 1.5 * sinInc * sinInc);

  return {
    id,
    name,
    propagate(date) {
      const ms = typeof date === 'number' ? date : date.getTime();
      const dt = (ms - epochMs) / 1000;

      const meanAnomaly = elements.meanAnomaly + meanAnomalyDot * dt;
      const raan = elements.raan + raanDot * dt;
      const argPerigee = elements.argPerigee + argPerigeeDot * dt;

      const eccentricAnomaly = solveKepler(meanAnomaly, e);
      const cosE = Math.cos(eccentricAnomaly);
      const sinE = Math.sin(eccentricAnomaly);
      const radius = a * (1 - e * cosE);

      // Perifocal frame.
      const xP = a * (cosE - e);
      const yP = a * Math.sqrt(1 - e * e) * sinE;
      const edot = Math.sqrt(MU_EARTH * a) / radius;
      const vxP = -edot * sinE;
      const vyP = edot * Math.sqrt(1 - e * e) * cosE;

      const cosRaan = Math.cos(raan);
      const sinRaan = Math.sin(raan);
      const cosArg = Math.cos(argPerigee);
      const sinArg = Math.sin(argPerigee);

      // Rotation: R_z(-raan) R_x(-i) R_z(-argPerigee).
      const r11 = cosRaan * cosArg - sinRaan * sinArg * cosInc;
      const r12 = -cosRaan * sinArg - sinRaan * cosArg * cosInc;
      const r21 = sinRaan * cosArg + cosRaan * sinArg * cosInc;
      const r22 = -sinRaan * sinArg + cosRaan * cosArg * cosInc;
      const r31 = sinArg * sinInc;
      const r32 = cosArg * sinInc;

      return {
        position: {
          x: r11 * xP + r12 * yP,
          y: r21 * xP + r22 * yP,
          z: r31 * xP + r32 * yP,
        },
        velocityKmS: {
          x: r11 * vxP + r12 * vyP,
          y: r21 * vxP + r22 * vyP,
          z: r31 * vxP + r32 * vyP,
        },
      };
    },
  };
}

/**
 * Wrap an externally supplied position function (SGP4, a worker, a fixture) in
 * the propagator interface.
 */
export function propagatorFromFunction(
  id: string,
  name: string,
  evaluate: (date: Date) => OrbitState | null
): SatellitePropagator {
  return {
    id,
    name,
    propagate(date) {
      return evaluate(typeof date === 'number' ? new Date(date) : date);
    },
  };
}
