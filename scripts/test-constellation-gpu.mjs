import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { probeGpu } from '../src/lib/gpuSupport.ts';
import { globePosition, globeSnapshot, GLOBE_RADIUS } from '../src/lib/orbitalGlobe.ts';
import { EARTH_RADIUS_KM, ecefToEci, gmst, stationFrame, PRESET_STATIONS } from '../src/ground/index.ts';

describe('constellation GPU capability', () => {
  it('prefers a hardware WebGPU adapter and falls back on rejection or software', async () => {
    const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const setGpu = (requestAdapter) => Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { gpu: { requestAdapter } } });
    const setRenderer = (renderer) => Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { createElement: () => ({ getContext: () => renderer && ({
        getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 1 }),
        getParameter: () => renderer,
      }) }) },
    });
    try {
      setRenderer('Hardware GPU');
      setGpu(async () => ({ isFallbackAdapter: false }));
      assert.equal(await probeGpu(), 'webgpu');
      setGpu(async () => { throw new Error('denied'); });
      assert.equal(await probeGpu(), 'webgl');
      setGpu(async () => ({ isFallbackAdapter: true }));
      setRenderer('SwiftShader');
      assert.equal(await probeGpu(), 'software');
      setRenderer(null);
      assert.equal(await probeGpu(), 'none');
    } finally {
      if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
      else delete globalThis.navigator;
      if (documentDescriptor) Object.defineProperty(globalThis, 'document', documentDescriptor);
      else delete globalThis.document;
    }
  });
});

describe('orbital globe geometry', () => {
  it('maps ECEF axes to a north-up globe', () => {
    assert.deepEqual(globePosition({ x: EARTH_RADIUS_KM, y: 0, z: 0 }), [GLOBE_RADIUS, 0, -0]);
    assert.deepEqual(globePosition({ x: 0, y: 0, z: EARTH_RADIUS_KM }), [0, GLOBE_RADIUS, -0]);
  });

  it('uses the same Earth-fixed visibility and closed footprint as the station', () => {
    const frame = stationFrame(PRESET_STATIONS[0]);
    const now = Date.parse('2026-10-19T12:00:00Z');
    const target = { x: frame.ecef.x + frame.zenith.x * 500, y: frame.ecef.y + frame.zenith.y * 500, z: frame.ecef.z + frame.zenith.z * 500 };
    const track = { projectId: 7, propagator: { id: '7', name: 'Test', propagate: () => ({ position: ecefToEci(target, gmst(now)) }) } };
    const [satellite] = globeSnapshot(frame, [track], now);
    assert.equal(satellite.projectId, 7);
    assert.equal(satellite.visible, true);
    assert.ok(Math.hypot(...satellite.position) > GLOBE_RADIUS);
    assert.equal(satellite.ring.length, 65);
    assert.ok(Math.hypot(...satellite.ring[0].map((v, i) => v - satellite.ring.at(-1)[i])) < 1e-10);
    assert.ok(Math.abs(Math.hypot(...satellite.ring[0]) - GLOBE_RADIUS * 1.005) < 1e-10);
    assert.deepEqual(globeSnapshot(frame, [{ ...track, propagator: { ...track.propagator, propagate: () => null } }], now), []);
  });
});
