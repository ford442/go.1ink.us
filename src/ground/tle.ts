/**
 * Minimal two-line-element parsing: enough to drive the built-in Keplerian
 * propagator and to hand the raw lines to SGP4 when that path is wired up.
 */

import { DEG2RAD } from './geodesy';
import { type KeplerianElements, keplerianPropagator, type SatellitePropagator } from './propagator';

export interface TleRecord {
  name: string;
  line1: string;
  line2: string;
  /** NORAD catalog number. */
  noradId: string;
  epoch: Date;
  inclinationDeg: number;
  raanDeg: number;
  eccentricity: number;
  argPerigeeDeg: number;
  meanAnomalyDeg: number;
  meanMotionRevPerDay: number;
  revolutionNumber: number;
}

function assertLine(line: string, expected: '1' | '2'): string {
  const trimmed = line.trim();
  if (trimmed[0] !== expected) {
    throw new SyntaxError(`Expected TLE line ${expected}, got "${trimmed.slice(0, 12)}…"`);
  }
  if (trimmed.length < 63) {
    throw new SyntaxError(`TLE line ${expected} is too short (${trimmed.length} chars)`);
  }
  return trimmed;
}

function num(line: string, start: number, end: number): number {
  const value = Number.parseFloat(line.slice(start, end));
  if (!Number.isFinite(value)) {
    throw new SyntaxError(`Unparseable TLE field at columns ${start}-${end}`);
  }
  return value;
}

/**
 * TLE epochs are `YYDDD.DDDDDDDD`: a two-digit year (57-99 => 1900s, else
 * 2000s) plus a fractional day of year.
 */
export function parseTleEpoch(yearField: number, dayField: number): Date {
  const year = yearField < 57 ? 2000 + yearField : 1900 + yearField;
  const startOfYear = Date.UTC(year, 0, 1);
  return new Date(startOfYear + (dayField - 1) * 86400000);
}

/** Parse one TLE set. `name` is optional — catalogs sometimes omit line 0. */
export function parseTle(line1: string, line2: string, name?: string): TleRecord {
  const l1 = assertLine(line1, '1');
  const l2 = assertLine(line2, '2');

  const noradId = l1.slice(2, 7).trim();
  const epoch = parseTleEpoch(num(l1, 18, 20), num(l1, 20, 32));

  return {
    name: name?.trim() || `NORAD ${noradId}`,
    line1: l1,
    line2: l2,
    noradId,
    epoch,
    inclinationDeg: num(l2, 8, 16),
    raanDeg: num(l2, 17, 25),
    // The decimal point is implied and always leading.
    eccentricity: Number.parseFloat(`0.${l2.slice(26, 33).trim()}`),
    argPerigeeDeg: num(l2, 34, 42),
    meanAnomalyDeg: num(l2, 43, 51),
    meanMotionRevPerDay: num(l2, 52, 63),
    revolutionNumber: Number.parseInt(l2.slice(63, 68).trim(), 10) || 0,
  };
}

/**
 * Split a catalog blob (the `NAME / 1 ... / 2 ...` format Celestrak serves)
 * into records, skipping sets that fail to parse rather than aborting the
 * whole download.
 */
export function parseTleCatalog(text: string): TleRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const records: TleRecord[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim().startsWith('1 ')) continue;
    const line2 = lines[i + 1];
    if (!line2?.trim().startsWith('2 ')) continue;
    const nameLine = i > 0 && !lines[i - 1].trim().startsWith('2 ') ? lines[i - 1] : undefined;
    try {
      records.push(parseTle(lines[i], line2, nameLine));
    } catch {
      // Skip the malformed set; a bad line shouldn't drop the rest of the file.
    }
    i += 1;
  }
  return records;
}

export function tleToElements(record: TleRecord): KeplerianElements {
  return {
    meanMotionRevPerDay: record.meanMotionRevPerDay,
    eccentricity: record.eccentricity,
    inclination: record.inclinationDeg * DEG2RAD,
    raan: record.raanDeg * DEG2RAD,
    argPerigee: record.argPerigeeDeg * DEG2RAD,
    meanAnomaly: record.meanAnomalyDeg * DEG2RAD,
    epoch: record.epoch,
  };
}

/**
 * Build a propagator straight from a TLE. Swap this one call for an SGP4
 * factory (`satellite.twoline2satrec` + `satellite.propagate`) to upgrade every
 * consumer at once.
 */
export function propagatorFromTle(record: TleRecord): SatellitePropagator {
  return keplerianPropagator(record.noradId, record.name, tleToElements(record));
}
