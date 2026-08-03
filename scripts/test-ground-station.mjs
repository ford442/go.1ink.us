import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEG2RAD,
  EARTH_RADIUS_KM,
  RAD2DEG,
  ecefToGeodetic,
  eciToEcef,
  geodeticToEcef,
  gmst,
  lookAngles,
  magnitude,
  normalizeSigned,
  toJulianDate,
} from '../src/ground/geodesy.ts';
import {
  DEFAULT_MIN_ELEVATION_DEG,
  PRESET_STATIONS,
  createStation,
  formatCoordinates,
  requestGeolocationStation,
  stationFrame,
  wrapLongitudeDeg,
} from '../src/ground/GroundStation.ts';
import {
  keplerianPropagator,
  semiMajorAxisFromMeanMotion,
  solveKepler,
} from '../src/ground/propagator.ts';
import { parseTle, parseTleCatalog, propagatorFromTle } from '../src/ground/tle.ts';
import {
  evaluateConstellationVisibility,
  evaluateVisibility,
  isAboveHorizon,
  visibleIds,
} from '../src/ground/visibility.ts';
import {
  coverageAngularRadius,
  footprintFromEcef,
  footprintRing,
  isInsideFootprint,
} from '../src/ground/footprint.ts';
import { compassPoint, predictConstellationPasses, predictPasses } from '../src/ground/passes.ts';

// A real ISS element set (epoch 2024-06-01), used as a stable fixture. The
// built-in propagator is Keplerian+J2, so assertions here check geometry and
// self-consistency rather than SGP4-grade absolute timing.
const ISS_LINE1 =
  '1 25544U 98067A   24153.50000000  .00016717  00000-0  30777-3 0  9005';
const ISS_LINE2 =
  '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.49780000 56353';

describe('geodesy', () => {
  it('round-trips geodetic <-> ECEF', () => {
    for (const [latDeg, lonDeg, altKm] of [
      [0, 0, 0],
      [51.4779, -0.0015, 0.047],
      [-33.8688, 151.2093, 0.058],
      [89.9, 12.0, 1.5],
      [-77.8419, 166.6863, 0.024],
    ]) {
      const geodetic = { latitude: latDeg * DEG2RAD, longitude: lonDeg * DEG2RAD, altitudeKm: altKm };
      const back = ecefToGeodetic(geodeticToEcef(geodetic));
      assert.ok(Math.abs(back.latitude - geodetic.latitude) < 1e-9, `lat ${latDeg}`);
      assert.ok(Math.abs(normalizeSigned(back.longitude - geodetic.longitude)) < 1e-9, `lon ${lonDeg}`);
      assert.ok(Math.abs(back.altitudeKm - altKm) < 1e-6, `alt ${altKm}`);
    }
  });

  it('places the equator at the semi-major axis and the pole at the semi-minor', () => {
    const equator = geodeticToEcef({ latitude: 0, longitude: 0, altitudeKm: 0 });
    assert.ok(Math.abs(magnitude(equator) - EARTH_RADIUS_KM) < 1e-6);

    const pole = geodeticToEcef({ latitude: Math.PI / 2, longitude: 0, altitudeKm: 0 });
    assert.ok(Math.abs(magnitude(pole) - 6356.752) < 0.01);
  });

  it('computes the J2000 Julian date', () => {
    assert.ok(Math.abs(toJulianDate(Date.UTC(2000, 0, 1, 12, 0, 0)) - 2451545.0) < 1e-9);
  });

  it('computes GMST to within a few arcseconds of the reference value', () => {
    // Vallado: GMST at 2000-01-01 12:00 UTC is 280.46061837 degrees.
    const deg = gmst(Date.UTC(2000, 0, 1, 12, 0, 0)) * RAD2DEG;
    assert.ok(Math.abs(deg - 280.46061837) < 0.001, `got ${deg}`);
  });

  it('advances GMST by roughly 361 degrees per solar day', () => {
    const t0 = Date.UTC(2024, 5, 1, 0, 0, 0);
    const delta = ((gmst(t0 + 86400000) - gmst(t0)) * RAD2DEG + 360) % 360;
    assert.ok(Math.abs(delta - 0.9856) < 0.01, `got ${delta}`);
  });

  it('leaves the z axis alone when rotating ECI to ECEF', () => {
    const v = { x: 1000, y: 2000, z: 3000 };
    const rotated = eciToEcef(v, 1.234);
    assert.equal(rotated.z, v.z);
    assert.ok(Math.abs(magnitude(rotated) - magnitude(v)) < 1e-9);
  });

  it('reports a satellite straight overhead at 90 degrees elevation', () => {
    const observer = { latitude: 45 * DEG2RAD, longitude: 30 * DEG2RAD, altitudeKm: 0 };
    const observerEcef = geodeticToEcef(observer);
    const above = geodeticToEcef({ ...observer, altitudeKm: 500 });
    const look = lookAngles(observer, observerEcef, above);
    assert.ok(Math.abs(look.elevation * RAD2DEG - 90) < 1e-6);
    assert.ok(Math.abs(look.rangeKm - 500) < 1e-6);
  });

  it('points north/east/south/west correctly', () => {
    const observer = { latitude: 10 * DEG2RAD, longitude: 0, altitudeKm: 0 };
    const observerEcef = geodeticToEcef(observer);
    const cases = [
      [{ latitude: 20 * DEG2RAD, longitude: 0 }, 0],
      [{ latitude: 10 * DEG2RAD, longitude: 10 * DEG2RAD }, 90],
      [{ latitude: 0, longitude: 0 }, 180],
      [{ latitude: 10 * DEG2RAD, longitude: -10 * DEG2RAD }, 270],
    ];
    for (const [target, expectedAz] of cases) {
      const targetEcef = geodeticToEcef({ ...target, altitudeKm: 800 });
      const az = lookAngles(observer, observerEcef, targetEcef).azimuth * RAD2DEG;
      const diff = Math.abs((((az - expectedAz) % 360) + 540) % 360 - 180);
      assert.ok(diff < 12, `expected ~${expectedAz}, got ${az}`);
    }
  });
});

describe('GroundStation', () => {
  it('ships presets with sane defaults', () => {
    assert.ok(PRESET_STATIONS.length >= 8);
    for (const preset of PRESET_STATIONS) {
      assert.equal(preset.source, 'preset');
      assert.equal(preset.minElevationDeg, DEFAULT_MIN_ELEVATION_DEG);
      assert.ok(Math.abs(preset.latitudeDeg) <= 90);
      assert.ok(Math.abs(preset.longitudeDeg) <= 180);
    }
  });

  it('clamps latitude and wraps longitude', () => {
    const station = createStation({ latitudeDeg: 120, longitudeDeg: 200 });
    assert.equal(station.latitudeDeg, 90);
    assert.equal(station.longitudeDeg, -160);
    assert.equal(wrapLongitudeDeg(-180), 180);
    assert.equal(wrapLongitudeDeg(540), 180);
  });

  it('clamps the minimum elevation into a usable range', () => {
    assert.equal(createStation({ latitudeDeg: 0, longitudeDeg: 0, minElevationDeg: -5 }).minElevationDeg, 0);
    assert.equal(createStation({ latitudeDeg: 0, longitudeDeg: 0, minElevationDeg: 120 }).minElevationDeg, 89);
  });

  it('rejects non-finite coordinates', () => {
    assert.throws(() => createStation({ latitudeDeg: Number.NaN, longitudeDeg: 0 }), RangeError);
  });

  it('names unnamed stations by their coordinates', () => {
    const station = createStation({ latitudeDeg: 40.7128, longitudeDeg: -74.006 });
    assert.equal(station.name, '40.7128°N 74.0060°W');
    assert.equal(formatCoordinates(-33.8688, 151.2093), '33.8688°S 151.2093°E');
  });

  it('derives a frame whose zenith is the local up vector', () => {
    const frame = stationFrame(createStation({ latitudeDeg: 0, longitudeDeg: 0 }));
    assert.ok(Math.abs(frame.zenith.x - 1) < 1e-12);
    assert.ok(Math.abs(frame.zenith.y) < 1e-12);
    assert.ok(Math.abs(frame.zenith.z) < 1e-12);
    assert.ok(Math.abs(frame.minElevation - DEFAULT_MIN_ELEVATION_DEG * DEG2RAD) < 1e-12);
  });

  it('never reads geolocation without being asked, and rejects when unavailable', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
    try {
      await assert.rejects(() => requestGeolocationStation(), /not available/);
    } finally {
      if (original) Object.defineProperty(globalThis, 'navigator', original);
      else delete globalThis.navigator;
    }
  });

  it('builds a station from a granted geolocation fix', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    let called = 0;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        geolocation: {
          getCurrentPosition(success) {
            called += 1;
            success({ coords: { latitude: 35.6762, longitude: 139.6503, altitude: 40 } });
          },
        },
      },
    });
    try {
      const station = await requestGeolocationStation();
      assert.equal(called, 1);
      assert.equal(station.source, 'geolocation');
      assert.equal(station.name, 'My location');
      assert.ok(Math.abs(station.latitudeDeg - 35.6762) < 1e-9);
      assert.equal(station.altitudeM, 40);
    } finally {
      if (original) Object.defineProperty(globalThis, 'navigator', original);
      else delete globalThis.navigator;
    }
  });

  it('surfaces a denied permission as a rejection', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        geolocation: {
          getCurrentPosition(_success, failure) {
            failure({ message: 'User denied Geolocation' });
          },
        },
      },
    });
    try {
      await assert.rejects(() => requestGeolocationStation(), /denied/);
    } finally {
      if (original) Object.defineProperty(globalThis, 'navigator', original);
      else delete globalThis.navigator;
    }
  });
});

describe('propagator', () => {
  it('solves Kepler\'s equation', () => {
    for (const e of [0, 0.01, 0.3, 0.7, 0.9]) {
      for (const m of [0, 0.5, 2, 4, 6]) {
        const anomaly = solveKepler(m, e);
        assert.ok(Math.abs(anomaly - e * Math.sin(anomaly) - m) < 1e-9);
      }
    }
  });

  it('recovers the semi-major axis from mean motion', () => {
    // ~15.5 rev/day is a ~420 km circular orbit.
    const a = semiMajorAxisFromMeanMotion(15.4978);
    assert.ok(Math.abs(a - 6796) < 10, `got ${a}`);
    // Geostationary: one revolution per sidereal day.
    const geo = semiMajorAxisFromMeanMotion(1.0027379);
    assert.ok(Math.abs(geo - 42164) < 5, `got ${geo}`);
  });

  it('keeps a circular orbit at constant radius and matches its period', () => {
    const epoch = Date.UTC(2024, 5, 1);
    const sat = keplerianPropagator('test', 'Test', {
      semiMajorAxisKm: 7000,
      eccentricity: 0,
      inclination: 51.6 * DEG2RAD,
      raan: 0,
      argPerigee: 0,
      meanAnomaly: 0,
      epoch,
    });

    const radii = [];
    for (let t = 0; t < 6000; t += 137) {
      radii.push(magnitude(sat.propagate(epoch + t * 1000).position));
    }
    for (const r of radii) assert.ok(Math.abs(r - 7000) < 1e-6, `r=${r}`);

    const periodSec = 2 * Math.PI * Math.sqrt(7000 ** 3 / 398600.4418);
    const p0 = sat.propagate(epoch).position;
    const p1 = sat.propagate(epoch + periodSec * 1000).position;
    // J2 drags the node round over one orbit, so the satellite lands tens of
    // km from where a pure two-body model would put it, not on top of it.
    assert.ok(Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z) < 60);
  });

  it('respects the orbital inclination', () => {
    const epoch = Date.UTC(2024, 5, 1);
    const sat = keplerianPropagator('polar', 'Polar', {
      semiMajorAxisKm: 7000,
      eccentricity: 0,
      inclination: 30 * DEG2RAD,
      raan: 0,
      argPerigee: 0,
      meanAnomaly: 0,
      epoch,
    });
    let maxLatDeg = 0;
    for (let t = 0; t < 6000; t += 60) {
      const p = sat.propagate(epoch + t * 1000).position;
      maxLatDeg = Math.max(maxLatDeg, Math.abs(Math.asin(p.z / magnitude(p)) * RAD2DEG));
    }
    assert.ok(Math.abs(maxLatDeg - 30) < 0.5, `got ${maxLatDeg}`);
  });
});

describe('TLE parsing', () => {
  it('parses an ISS element set', () => {
    const record = parseTle(ISS_LINE1, ISS_LINE2, 'ISS (ZARYA)');
    assert.equal(record.name, 'ISS (ZARYA)');
    assert.equal(record.noradId, '25544');
    assert.ok(Math.abs(record.inclinationDeg - 51.6416) < 1e-6);
    assert.ok(Math.abs(record.raanDeg - 247.4627) < 1e-6);
    assert.ok(Math.abs(record.eccentricity - 0.0006703) < 1e-9);
    assert.ok(Math.abs(record.argPerigeeDeg - 130.536) < 1e-6);
    assert.ok(Math.abs(record.meanAnomalyDeg - 325.0288) < 1e-6);
    assert.ok(Math.abs(record.meanMotionRevPerDay - 15.4978) < 1e-6);
    assert.equal(record.epoch.toISOString(), '2024-06-01T12:00:00.000Z');
  });

  it('rejects mismatched or truncated lines', () => {
    assert.throws(() => parseTle(ISS_LINE2, ISS_LINE1), SyntaxError);
    assert.throws(() => parseTle('1 25544U', ISS_LINE2), SyntaxError);
  });

  it('parses a catalog blob and skips malformed entries', () => {
    const catalog = [
      'ISS (ZARYA)',
      ISS_LINE1,
      ISS_LINE2,
      'BROKEN SAT',
      '1 99999U',
      '2 99999',
      '',
      'ISS AGAIN',
      ISS_LINE1,
      ISS_LINE2,
    ].join('\n');
    const records = parseTleCatalog(catalog);
    assert.equal(records.length, 2);
    assert.equal(records[0].name, 'ISS (ZARYA)');
    assert.equal(records[1].name, 'ISS AGAIN');
  });

  it('puts the ISS in a plausible low Earth orbit', () => {
    const sat = propagatorFromTle(parseTle(ISS_LINE1, ISS_LINE2, 'ISS (ZARYA)'));
    const altitude = magnitude(sat.propagate(Date.UTC(2024, 5, 1, 12)).position) - EARTH_RADIUS_KM;
    assert.ok(altitude > 380 && altitude < 460, `got ${altitude} km`);
  });
});

describe('visibility', () => {
  const frame = stationFrame(createStation({ latitudeDeg: 0, longitudeDeg: 0, minElevationDeg: 10 }));

  it('accepts a satellite overhead and rejects one on the far side', () => {
    const sinMin = Math.sin(10 * DEG2RAD);
    const overhead = geodeticToEcef({ latitude: 0, longitude: 0, altitudeKm: 500 });
    const antipode = geodeticToEcef({ latitude: 0, longitude: Math.PI, altitudeKm: 500 });
    assert.equal(isAboveHorizon(frame.ecef, frame.zenith, overhead, sinMin), true);
    assert.equal(isAboveHorizon(frame.ecef, frame.zenith, antipode, sinMin), false);
  });

  it('agrees with the trigonometric elevation at the threshold', () => {
    for (const offsetDeg of [1, 5, 9.5, 10.5, 20, 45]) {
      for (const sign of [1, -1]) {
        const target = geodeticToEcef({
          latitude: sign * offsetDeg * DEG2RAD,
          longitude: 0,
          altitudeKm: 550,
        });
        const elevation = lookAngles(frame.geodetic, frame.ecef, target).elevation;
        assert.equal(
          isAboveHorizon(frame.ecef, frame.zenith, target, Math.sin(frame.minElevation)),
          elevation >= frame.minElevation,
          `offset ${sign * offsetDeg}`
        );
      }
    }
  });

  it('evaluates a constellation and collects the visible ids', () => {
    const epoch = Date.UTC(2024, 5, 1);
    const sats = [0, 90, 180, 270].map((raanDeg) =>
      keplerianPropagator(`sat-${raanDeg}`, `Sat ${raanDeg}`, {
        semiMajorAxisKm: 7000,
        eccentricity: 0,
        inclination: 51.6 * DEG2RAD,
        raan: raanDeg * DEG2RAD,
        argPerigee: 0,
        meanAnomaly: 0,
        epoch,
      })
    );

    const results = evaluateConstellationVisibility(frame, sats, epoch);
    assert.equal(results.length, 4);
    for (const result of results) {
      assert.ok(result.altitudeKm > 500 && result.altitudeKm < 700);
      assert.equal(result.visible, result.look.elevation >= frame.minElevation);
    }
    const ids = visibleIds(results);
    assert.equal(ids.size, results.filter((r) => r.visible).length);
  });

  it('matches the single-satellite path', () => {
    const epoch = Date.UTC(2024, 5, 1);
    const sat = propagatorFromTle(parseTle(ISS_LINE1, ISS_LINE2, 'ISS'));
    const one = evaluateVisibility(frame, sat, epoch);
    const many = evaluateConstellationVisibility(frame, [sat], epoch);
    assert.ok(Math.abs(one.look.elevation - many[0].look.elevation) < 1e-12);
    assert.equal(one.visible, many[0].visible);
  });

  it('skips satellites whose propagator has no state', () => {
    const dead = { id: 'dead', name: 'Dead', propagate: () => null };
    assert.equal(evaluateVisibility(frame, dead, Date.now()), null);
    assert.deepEqual(evaluateConstellationVisibility(frame, [dead], Date.now()), []);
  });
});

describe('footprint', () => {
  it('grows the coverage cap with altitude', () => {
    const low = coverageAngularRadius(400, 0);
    const high = coverageAngularRadius(35786, 0);
    assert.ok(low < high);
    // A 400 km satellite sees a ~19.7 degree cap to the true horizon.
    assert.ok(Math.abs(low * RAD2DEG - 19.75) < 0.2, `got ${low * RAD2DEG}`);
    // Geostationary tops out near 81.3 degrees.
    assert.ok(Math.abs(high * RAD2DEG - 81.3) < 0.2, `got ${high * RAD2DEG}`);
  });

  it('shrinks the cap as the minimum elevation rises', () => {
    let previous = Infinity;
    for (const elevationDeg of [0, 5, 10, 25, 45]) {
      const radius = coverageAngularRadius(550, elevationDeg * DEG2RAD);
      assert.ok(radius < previous, `elevation ${elevationDeg}`);
      previous = radius;
    }
    assert.equal(coverageAngularRadius(0, 0), 0);
  });

  it('centres the footprint on the sub-satellite point', () => {
    const ecef = geodeticToEcef({ latitude: 20 * DEG2RAD, longitude: -75 * DEG2RAD, altitudeKm: 700 });
    const footprint = footprintFromEcef(ecef, 0);
    assert.ok(Math.abs(footprint.subSatellite.latitude * RAD2DEG - 20) < 1e-6);
    assert.ok(Math.abs(footprint.subSatellite.longitude * RAD2DEG + 75) < 1e-6);
    assert.ok(footprint.groundRadiusKm > 2500 && footprint.groundRadiusKm < 3200);
  });

  it('emits a closed ring at a constant angular radius', () => {
    const ecef = geodeticToEcef({ latitude: 45 * DEG2RAD, longitude: 10 * DEG2RAD, altitudeKm: 550 });
    const footprint = footprintFromEcef(ecef, 10 * DEG2RAD);
    const ring = footprintRing(footprint, 48);
    assert.equal(ring.length, 49);
    assert.ok(Math.abs(ring[0].latitudeDeg - ring[48].latitudeDeg) < 1e-9);

    for (const point of ring) {
      const central = Math.acos(
        Math.sin(footprint.subSatellite.latitude) * Math.sin(point.latitudeDeg * DEG2RAD) +
          Math.cos(footprint.subSatellite.latitude) *
            Math.cos(point.latitudeDeg * DEG2RAD) *
            Math.cos(point.longitudeDeg * DEG2RAD - footprint.subSatellite.longitude)
      );
      assert.ok(Math.abs(central - footprint.angularRadius) < 1e-9);
    }
  });

  it('walks a polar footprint across the date line without blowing up', () => {
    const ecef = geodeticToEcef({ latitude: 88 * DEG2RAD, longitude: 179 * DEG2RAD, altitudeKm: 800 });
    const ring = footprintRing(footprintFromEcef(ecef, 0), 32);
    for (const point of ring) {
      assert.ok(Number.isFinite(point.latitudeDeg) && Math.abs(point.latitudeDeg) <= 90);
      assert.ok(Number.isFinite(point.longitudeDeg) && Math.abs(point.longitudeDeg) <= 180);
    }
  });

  it('agrees with the horizon test about who is inside', () => {
    const satEcef = geodeticToEcef({ latitude: 0, longitude: 0, altitudeKm: 550 });
    const footprint = footprintFromEcef(satEcef, 10 * DEG2RAD);
    for (const latDeg of [0, 5, 10, 15, 18, 20, 25]) {
      const frame = stationFrame(
        createStation({ latitudeDeg: latDeg, longitudeDeg: 0, minElevationDeg: 10 })
      );
      const elevation = lookAngles(frame.geodetic, frame.ecef, satEcef).elevation;
      const inside = isInsideFootprint(footprint, latDeg * DEG2RAD, 0);
      // The cap is spherical while the station sits on the ellipsoid, so allow
      // disagreement only within a hair of the boundary.
      if (Math.abs(elevation - frame.minElevation) > 0.3 * DEG2RAD) {
        assert.equal(inside, elevation >= frame.minElevation, `lat ${latDeg}`);
      }
    }
  });
});

describe('pass prediction', () => {
  const iss = propagatorFromTle(parseTle(ISS_LINE1, ISS_LINE2, 'ISS (ZARYA)'));
  const houston = stationFrame(
    createStation({ name: 'Houston', latitudeDeg: 29.7604, longitudeDeg: -95.3698, minElevationDeg: 10 })
  );
  const from = Date.UTC(2024, 5, 1, 12, 0, 0);

  it('finds passes with a consistent AOS / culmination / LOS ordering', () => {
    const passes = predictPasses(houston, iss, from, { durationHours: 24, maxPasses: 6 });
    assert.ok(passes.length > 0, 'expected at least one ISS pass in 24 h');

    for (const pass of passes) {
      assert.ok(pass.start <= pass.culmination && pass.culmination <= pass.end);
      assert.ok(pass.durationSec > 60 && pass.durationSec < 900, `duration ${pass.durationSec}`);
      assert.ok(pass.maxElevationDeg >= 10 - 1e-6, `max elevation ${pass.maxElevationDeg}`);
      assert.ok(pass.maxElevationDeg <= 90);
      assert.ok(pass.closestApproachKm > 300 && pass.closestApproachKm < 2500);
      assert.equal(pass.satelliteName, 'ISS (ZARYA)');
    }
  });

  it('puts the elevation exactly at the threshold at AOS and LOS', () => {
    const [pass] = predictPasses(houston, iss, from, { maxPasses: 1, toleranceSec: 0.25 });
    for (const edge of [pass.start, pass.end]) {
      const look = evaluateVisibility(houston, iss, edge);
      assert.ok(
        Math.abs(look.look.elevation * RAD2DEG - 10) < 0.05,
        `edge elevation ${look.look.elevation * RAD2DEG}`
      );
    }
  });

  it('finds the true maximum elevation, not just the best coarse sample', () => {
    const [pass] = predictPasses(houston, iss, from, { maxPasses: 1 });
    const peakMs = pass.culmination.getTime();
    for (const offsetSec of [-20, -5, -1, 1, 5, 20]) {
      const elevation = evaluateVisibility(houston, iss, peakMs + offsetSec * 1000).look.elevation;
      assert.ok(
        elevation * RAD2DEG <= pass.maxElevationDeg + 1e-6,
        `offset ${offsetSec}s beat the culmination`
      );
    }
  });

  it('reports the real AOS for a pass already in progress', () => {
    const [pass] = predictPasses(houston, iss, from, { maxPasses: 1 });
    // Restart the search from the middle of a known pass.
    const midMs = (pass.start.getTime() + pass.end.getTime()) / 2;
    const [rediscovered] = predictPasses(houston, iss, midMs, { maxPasses: 1 });
    assert.ok(rediscovered.start.getTime() < midMs, 'AOS should predate the search start');
    assert.ok(
      Math.abs(rediscovered.start.getTime() - pass.start.getTime()) < 2000,
      'AOS should match the original pass'
    );
  });

  it('is not sensitive to the coarse step size', () => {
    const coarse = predictPasses(houston, iss, from, { maxPasses: 3, stepSec: 30 });
    const fine = predictPasses(houston, iss, from, { maxPasses: 3, stepSec: 10 });
    assert.equal(coarse.length, fine.length);
    for (let i = 0; i < coarse.length; i += 1) {
      assert.ok(
        Math.abs(coarse[i].start.getTime() - fine[i].start.getTime()) < 1000,
        `pass ${i} AOS moved by ${coarse[i].start - fine[i].start} ms`
      );
      assert.ok(Math.abs(coarse[i].maxElevationDeg - fine[i].maxElevationDeg) < 0.01);
    }
  });

  it('returns fewer passes for a stricter minimum elevation', () => {
    const lenient = predictPasses(houston, iss, from, { durationHours: 24, maxPasses: 20, minElevation: 5 * DEG2RAD });
    const strict = predictPasses(houston, iss, from, { durationHours: 24, maxPasses: 20, minElevation: 40 * DEG2RAD });
    assert.ok(strict.length <= lenient.length);
    for (const pass of strict) assert.ok(pass.maxElevationDeg >= 40 - 1e-6);
  });

  it('honours maxPasses and the search horizon', () => {
    assert.equal(predictPasses(houston, iss, from, { maxPasses: 2 }).length, 2);
    assert.equal(predictPasses(houston, iss, from, { durationHours: 0 }).length, 0);
  });

  it('finds no passes for an equatorial station under a high-inclination orbit it never reaches', () => {
    // A satellite in a 5-degree inclination orbit is never visible from a pole.
    const epoch = Date.UTC(2024, 5, 1);
    const equatorial = keplerianPropagator('eq', 'Equatorial', {
      semiMajorAxisKm: 7000,
      eccentricity: 0,
      inclination: 5 * DEG2RAD,
      raan: 0,
      argPerigee: 0,
      meanAnomaly: 0,
      epoch,
    });
    const pole = stationFrame(createStation({ latitudeDeg: 89.9, longitudeDeg: 0, minElevationDeg: 10 }));
    assert.equal(predictPasses(pole, equatorial, epoch, { durationHours: 12 }).length, 0);
  });

  it('merges multiple satellites in chronological order', () => {
    const epoch = Date.UTC(2024, 5, 1);
    const sats = [0, 120, 240].map((raanDeg) =>
      keplerianPropagator(`sat-${raanDeg}`, `Sat ${raanDeg}`, {
        semiMajorAxisKm: 7000,
        eccentricity: 0,
        inclination: 51.6 * DEG2RAD,
        raan: raanDeg * DEG2RAD,
        argPerigee: 0,
        meanAnomaly: 0,
        epoch,
      })
    );
    const merged = predictConstellationPasses(houston, sats, epoch, { durationHours: 12, maxPasses: 3 });
    assert.ok(merged.length > 1);
    for (let i = 1; i < merged.length; i += 1) {
      assert.ok(merged[i - 1].start <= merged[i].start);
    }
  });

  it('names compass points', () => {
    assert.equal(compassPoint(0), 'N');
    assert.equal(compassPoint(90), 'E');
    assert.equal(compassPoint(180), 'S');
    assert.equal(compassPoint(337.5), 'NNW');
    assert.equal(compassPoint(-90), 'W');
    assert.equal(compassPoint(360), 'N');
  });
});
