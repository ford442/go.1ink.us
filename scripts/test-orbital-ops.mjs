import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { orbitValidationError, splitTle, tleChecksum } from '../src/lib/validateOrbit.ts';
import {
  findTrack,
  formatApproxClock,
  formatApproxCountdown,
  formatHorizonReport,
  formatPassesReport,
  groundTrack,
  lookAngleRows,
  orbitToPropagator,
  predictTrackPasses,
  projectsToTracks,
  roundToApprox,
  splitAtAntimeridian,
  trackFootprint,
} from '../src/lib/orbitalOps.ts';
import { PRESET_STATIONS, stationFrame } from '../src/ground/GroundStation.ts';
import { DEG2RAD, magnitude } from '../src/ground/geodesy.ts';
import { keplerianPropagator } from '../src/ground/propagator.ts';
import { parseTle, propagatorFromTle } from '../src/ground/tle.ts';
import { createCommandRegistry } from '../src/lib/commandRegistry.ts';
import { executeCommandLine } from '../src/lib/terminalParser.ts';

const catalog = JSON.parse(readFileSync(new URL('../src/data/projects.json', import.meta.url), 'utf8'));

// ISS reference set (checksums valid), used as a known-good TLE fixture.
const ISS_TLE = [
  'ISS (ZARYA)',
  '1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927',
  '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537',
].join('\n');

const ELEMENTS = {
  epoch: '2026-10-01T00:00:00Z',
  meanMotionRevPerDay: 15.5,
  eccentricity: 0.0005,
  inclinationDeg: 51.6,
  raanDeg: 120,
  argPerigeeDeg: 80,
  meanAnomalyDeg: 10,
};

const project = (overrides) => ({
  id: 1,
  title: 'Alpha',
  description: 'Test project',
  url: 'https://example.com/1',
  image: null,
  icon: '🛰️',
  tags: ['Game'],
  tech: [],
  featured: true,
  year: 2026,
  status: 'live',
  repo: null,
  embedUrl: null,
  accent: null,
  relatedIds: [],
  changelog: null,
  ...overrides,
});

const greenwich = PRESET_STATIONS.find((station) => station.id === 'greenwich');
const NOW = Date.parse('2026-10-19T12:00:00Z');

describe('validateOrbit', () => {
  it('accepts a missing or null orbit (project stays a plain node)', () => {
    assert.equal(orbitValidationError(undefined), null);
    assert.equal(orbitValidationError(null), null);
  });

  it('accepts well-formed elements and TLEs', () => {
    assert.equal(orbitValidationError({ elements: ELEMENTS }), null);
    assert.equal(orbitValidationError({ elements: { ...ELEMENTS, meanMotionRevPerDay: undefined, semiMajorAxisKm: 7000 } }), null);
    assert.equal(orbitValidationError({ tle: ISS_TLE }), null);
    assert.equal(orbitValidationError({ tle: ISS_TLE.split('\n').slice(1).join('\n') }), null);
  });

  it('requires exactly one of tle / elements and rejects unknown fields', () => {
    assert.match(orbitValidationError({}), /exactly one of tle \/ elements/);
    assert.match(orbitValidationError({ tle: ISS_TLE, elements: ELEMENTS }), /exactly one/);
    assert.match(orbitValidationError({ elements: ELEMENTS, period: 90 }), /unknown field "period"/);
    assert.match(orbitValidationError('LEO'), /object or null/);
    assert.match(orbitValidationError([]), /object or null/);
  });

  it('range-checks elements', () => {
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, eccentricity: 1 } }), /eccentricity/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, inclinationDeg: 181 } }), /inclinationDeg/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, raanDeg: 360 } }), /raanDeg/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, meanAnomalyDeg: '10' } }), /meanAnomalyDeg/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, epoch: 'yesterday' } }), /epoch/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, extra: 1 } }), /unknown field "extra"/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, semiMajorAxisKm: 7000 } }), /exactly one of meanMotionRevPerDay/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, meanMotionRevPerDay: -1 } }), /positive/);
  });

  it('rejects orbits whose perigee is underground', () => {
    const subterranean = { ...ELEMENTS, meanMotionRevPerDay: undefined, semiMajorAxisKm: 6400 };
    assert.match(orbitValidationError({ elements: subterranean }), /perigee/);
    assert.match(orbitValidationError({ elements: { ...ELEMENTS, eccentricity: 0.5 } }), /perigee/);
  });

  it('checks TLE shape, checksum, and catalog-number agreement', () => {
    const [, line1, line2] = ISS_TLE.split('\n');
    const corrupt = line2.slice(0, 68) + String((Number(line2[68]) + 1) % 10);
    assert.match(orbitValidationError({ tle: `${line1}\n${corrupt}` }), /line 2 fails its checksum/);
    assert.match(orbitValidationError({ tle: `${line1}\n${line2.slice(0, 60)}` }), /69 characters/);
    assert.match(orbitValidationError({ tle: line1 }), /two data lines/);
    assert.match(orbitValidationError({ tle: `${line2}\n${line1}` }), /must start with "1 "/);
    const otherSat = `2 25545${line2.slice(7, 68)}`;
    assert.match(
      orbitValidationError({ tle: `${line1}\n${otherSat}${tleChecksum(otherSat)}` }),
      /different catalog numbers/,
    );
    assert.match(orbitValidationError({ tle: 42 }), /must be a string/);
  });

  it('agrees with the reference checksum on known-good lines', () => {
    for (const line of ISS_TLE.split('\n').slice(1)) {
      assert.equal(tleChecksum(line), Number(line[68]));
    }
  });

  it('splitTle keeps the optional name line', () => {
    assert.equal(splitTle(ISS_TLE)?.name, 'ISS (ZARYA)');
    assert.equal(splitTle(ISS_TLE.split('\n').slice(1).join('\r\n'))?.name, null);
    assert.equal(splitTle('one\ntwo\nthree\nfour'), null);
  });

  it('the CI validator rejects a bad orbit payload in projects.json', () => {
    const source = readFileSync(new URL('./validate-projects.mjs', import.meta.url), 'utf8');
    assert.match(source, /orbitValidationError\(project\.orbit\)/);
  });
});

describe('projects → propagators', () => {
  it('skips projects without an orbit and keeps catalog ids/titles', () => {
    const tracks = projectsToTracks([
      project({ id: 1, title: 'Plain' }),
      project({ id: 2, title: 'Elements', orbit: { elements: ELEMENTS }, accent: '#22d3ee' }),
      project({ id: 3, title: 'Teeline', orbit: { tle: ISS_TLE } }),
      project({ id: 4, title: 'Nulled', orbit: null }),
      project({ id: 5, title: 'Invalid', orbit: { elements: { ...ELEMENTS, eccentricity: 2 } } }),
    ]);
    assert.deepEqual(tracks.map((t) => [t.projectId, t.title, t.source]), [[2, 'Elements', 'elements'], [3, 'Teeline', 'tle']]);
    assert.equal(tracks[0].propagator.id, '2');
    assert.equal(tracks[0].accent, '#22d3ee');
    assert.equal(tracks[1].propagator.id, '3');
    assert.equal(tracks[1].propagator.name, 'Teeline');
  });

  it('converts degree elements to the radians the ground module expects', () => {
    const fromJson = orbitToPropagator('x', 'X', { elements: ELEMENTS });
    const direct = keplerianPropagator('x', 'X', {
      meanMotionRevPerDay: 15.5,
      eccentricity: 0.0005,
      inclination: 51.6 * DEG2RAD,
      raan: 120 * DEG2RAD,
      argPerigee: 80 * DEG2RAD,
      meanAnomaly: 10 * DEG2RAD,
      epoch: Date.parse(ELEMENTS.epoch),
    });
    const a = fromJson.propagate(NOW).position;
    const b = direct.propagate(NOW).position;
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-6);
  });

  it('TLE payloads propagate identically to propagatorFromTle', () => {
    const [, line1, line2] = ISS_TLE.split('\n');
    const reference = propagatorFromTle(parseTle(line1, line2));
    const ours = orbitToPropagator('9', 'Nine', { tle: ISS_TLE });
    const at = Date.parse('2008-09-21T00:00:00Z');
    const a = ours.propagate(at).position;
    const b = reference.propagate(at).position;
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-6);
  });

  it('returns null rather than throwing for an unreadable orbit', () => {
    assert.equal(orbitToPropagator('x', 'X', { tle: 'garbage' }), null);
  });

  it('every orbit in projects.json validates and becomes a track', () => {
    const withOrbit = catalog.filter((p) => p.orbit);
    assert.ok(withOrbit.length >= 3, 'demo catalog should carry a few orbits');
    for (const p of withOrbit) assert.equal(orbitValidationError(p.orbit), null, p.title);
    const tracks = projectsToTracks(catalog);
    assert.deepEqual(tracks.map((t) => t.projectId).sort(), withOrbit.map((p) => p.id).sort());
    for (const track of tracks) {
      const altitude = magnitude(track.propagator.propagate(NOW).position) - 6378.137;
      assert.ok(altitude > 150 && altitude < 2000, `${track.title} altitude ${altitude}`);
    }
  });

  it('findTrack matches by id or title prefix', () => {
    const tracks = projectsToTracks(catalog);
    const first = tracks[0];
    assert.equal(findTrack(tracks, String(first.projectId)), first);
    assert.equal(findTrack(tracks, first.title.slice(0, 3).toUpperCase()), first);
    assert.equal(findTrack(tracks, 'definitely-not-a-project'), null);
    assert.equal(findTrack(tracks, '  '), null);
  });
});

describe('pass table + look angles', () => {
  const frame = stationFrame(greenwich);
  const tracks = projectsToTracks(catalog);

  it('merges passes chronologically within the row and per-track caps', () => {
    const rows = predictTrackPasses(frame, tracks, NOW, { maxRows: 6, maxPerTrack: 2 });
    assert.ok(rows.length > 0 && rows.length <= 6);
    for (let i = 1; i < rows.length; i += 1) {
      assert.ok(rows[i - 1].start.getTime() <= rows[i].start.getTime());
    }
    const perTrack = new Map();
    for (const row of rows) {
      perTrack.set(row.projectId, (perTrack.get(row.projectId) ?? 0) + 1);
      assert.ok(row.start < row.culmination && row.culmination < row.end);
      assert.ok(row.maxElevationDeg >= greenwich.minElevationDeg - 0.01);
    }
    for (const count of perTrack.values()) assert.ok(count <= 2);
  });

  it('look-angle rows are sorted by elevation and visibility matches the mask', () => {
    const looks = lookAngleRows(frame, tracks, NOW);
    assert.equal(looks.length, tracks.length);
    for (let i = 1; i < looks.length; i += 1) assert.ok(looks[i - 1].elevationDeg >= looks[i].elevationDeg);
    for (const look of looks) {
      assert.equal(look.visible, look.elevationDeg >= greenwich.minElevationDeg);
      assert.ok(look.azimuthDeg >= 0 && look.azimuthDeg < 360);
    }
  });

  it('a track is in view during its predicted pass and its footprint covers the station', () => {
    const [pass] = predictTrackPasses(frame, tracks, NOW, { maxRows: 1 });
    const track = tracks.find((t) => t.projectId === pass.projectId);
    const at = pass.culmination.getTime();
    const look = lookAngleRows(frame, [track], at)[0];
    assert.equal(look.visible, true);
    const footprint = trackFootprint(frame, track, at);
    assert.ok(footprint.groundRadiusKm > 0);
    const first = footprint.ring[0];
    const last = footprint.ring[footprint.ring.length - 1];
    assert.ok(Math.abs(first.latitudeDeg - last.latitudeDeg) < 1e-6, 'ring should close');
  });

  it('ground track and ring segments never jump across the antimeridian', () => {
    for (const track of tracks) {
      for (const segment of groundTrack(track, NOW)) {
        for (let i = 1; i < segment.length; i += 1) {
          assert.ok(Math.abs(segment[i].longitudeDeg - segment[i - 1].longitudeDeg) <= 180);
        }
      }
    }
    const split = splitAtAntimeridian([
      { latitudeDeg: 0, longitudeDeg: 170 },
      { latitudeDeg: 0, longitudeDeg: 179 },
      { latitudeDeg: 0, longitudeDeg: -179 },
      { latitudeDeg: 0, longitudeDeg: -170 },
    ]);
    assert.equal(split.length, 2);
  });
});

describe('approximate time formatting', () => {
  it('rounds to five minutes and never quotes a single minute', () => {
    assert.equal(roundToApprox(Date.parse('2026-10-19T12:02:29Z')).toISOString(), '2026-10-19T12:00:00.000Z');
    assert.equal(roundToApprox(Date.parse('2026-10-19T12:02:31Z')).toISOString(), '2026-10-19T12:05:00.000Z');
    assert.equal(formatApproxClock(Date.parse('2026-10-19T14:33:00Z'), 'UTC'), '≈14:35');
  });

  it('formats countdowns', () => {
    assert.equal(formatApproxCountdown(NOW + 60000, NOW), 'now');
    assert.equal(formatApproxCountdown(NOW + 11 * 60000, NOW), 'in ≈10m');
    assert.equal(formatApproxCountdown(NOW + 120 * 60000, NOW), 'in ≈2h');
    assert.equal(formatApproxCountdown(NOW + 136 * 60000, NOW), 'in ≈2h 15m');
  });

  it('reports carry the model disclaimer', () => {
    const frame = stationFrame(greenwich);
    const tracks = projectsToTracks(catalog);
    const report = formatPassesReport(greenwich, predictTrackPasses(frame, tracks, NOW), NOW, { timeZone: 'UTC' });
    assert.match(report, /PASS TABLE · GREENWICH, UK/);
    assert.match(report, /not SGP4/);
    assert.match(formatPassesReport(greenwich, [], NOW), /No passes/);
    assert.match(formatHorizonReport(greenwich, lookAngleRows(frame, tracks, NOW)), /above horizon\./);
  });
});

describe('orbital terminal commands', () => {
  function makeContext(overrides = {}) {
    const calls = [];
    const outputs = [];
    const record = (name) => (...args) => calls.push([name, ...args]);
    const ctx = {
      calls,
      outputs,
      addActivityLog: () => {},
      appendTerminalOutput: (result) => outputs.push(result),
      favorites: [], activeFilters: [], projectsMatchingQuery: [],
      setIsOrbitalOpsOpen: record('orbital'),
      setGroundStation: record('station'),
      requestGeolocation: () => Promise.resolve(null),
      groundStation: greenwich,
      isOrbitalOpsOpen: false,
      ...overrides,
    };
    return ctx;
  }
  const run = (command, overrides) => {
    const ctx = makeContext(overrides);
    return { ctx, result: executeCommandLine(command, ctx, createCommandRegistry(ctx)) };
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

  it('orbital toggles the panel', () => {
    const { ctx, result } = run('orbital');
    assert.deepEqual(ctx.calls, [['orbital', true]]);
    assert.match(result.text, /ORBITAL_OPS ENGAGED/);
  });

  it('station prints, lists, and sets presets', async () => {
    const show = run('station');
    const list = run('station list');
    const set = run('station reykjavik');
    const multiword = run('station new york');
    const unknown = run('station atlantis');
    await settle();
    assert.match(show.ctx.outputs[0].text, /GREENWICH, UK \[PRESET\]/);
    assert.match(list.ctx.outputs[0].text, /\* greenwich/);
    assert.equal(set.ctx.outputs[0].type, 'success');
    assert.equal(set.ctx.calls[0][1].id, 'reykjavik');
    assert.equal(multiword.ctx.calls[0][1].id, 'new-york');
    assert.equal(unknown.ctx.outputs[0].type, 'error');
    assert.deepEqual(unknown.ctx.calls, []);
  });

  it('station locate leaves the station unchanged when permission is refused', async () => {
    const { ctx, result } = run('station locate');
    assert.match(result.text, /REQUESTING POSITION FIX/);
    await settle();
    assert.equal(ctx.outputs[0].type, 'warning');
    assert.match(ctx.outputs[0].text, /station unchanged \(Greenwich, UK\)/);
    assert.deepEqual(ctx.calls, []);
  });

  it('passes and horizon report asynchronously after lazy-loading', async () => {
    const passes = run('passes');
    assert.match(passes.result.text, /COMPUTING PASS TABLE/);
    const horizon = run('horizon');
    await settle();
    assert.match(passes.ctx.outputs[0].text, /PASS TABLE · GREENWICH/);
    assert.match(horizon.ctx.outputs[0].text, /HORIZON · GREENWICH/);
  });

  it('passes rejects a project without an orbit', async () => {
    const { ctx } = run('passes 4');
    await settle();
    assert.equal(ctx.outputs[0].type, 'error');
    assert.match(ctx.outputs[0].text, /has no orbit/);
  });
});
