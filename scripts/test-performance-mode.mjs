import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectPerformanceMode,
  getPerformanceFlags,
  parsePerformanceMode,
  performanceModeLabel,
  resolveEffectiveMode,
} from '../src/lib/performanceMode.ts';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

function setBrowser({ cores = 8, saveData = false, coarse = false, reduced = false } = {}) {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { hardwareConcurrency: cores, connection: { saveData } } });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { matchMedia: (query) => ({ matches: query.includes('pointer') ? coarse : reduced }) },
  });
}

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow); else delete globalThis.window;
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator); else delete globalThis.navigator;
});

describe('performanceMode parsing and resolution', () => {
  it('accepts every valid stored mode', () => assert.deepEqual(['auto', 'full', 'balanced', 'lite'].map(parsePerformanceMode), ['auto', 'full', 'balanced', 'lite']));
  it('falls back to auto for invalid storage', () => assert.equal(parsePerformanceMode('fast'), 'auto'));
  it('uses balanced during server-side detection', () => assert.equal(detectPerformanceMode(), 'balanced'));
  it('preserves explicit modes', () => assert.equal(resolveEffectiveMode('full', false), 'full'));
  it('forces Lite for reduced motion', () => assert.equal(resolveEffectiveMode('full', true), 'lite'));
  it('formats every mode label', () => assert.deepEqual(['auto', 'full', 'balanced', 'lite'].map(performanceModeLabel), ['Auto', 'Full', 'Balanced', 'Lite']));
});

describe('performanceMode hardware detection', () => {
  it('selects Full for capable devices', () => { setBrowser(); assert.equal(detectPerformanceMode(), 'full'); });
  it('selects Balanced for coarse pointers', () => { setBrowser({ coarse: true }); assert.equal(detectPerformanceMode(), 'balanced'); });
  it('selects Balanced for four-core devices', () => { setBrowser({ cores: 4 }); assert.equal(detectPerformanceMode(), 'balanced'); });
  it('selects Lite for two-core devices', () => { setBrowser({ cores: 2 }); assert.equal(detectPerformanceMode(), 'lite'); });
  it('selects Lite when data saver is enabled', () => { setBrowser({ saveData: true }); assert.equal(detectPerformanceMode(), 'lite'); });
  it('selects Lite for reduced-motion devices', () => { setBrowser({ reduced: true }); assert.equal(detectPerformanceMode(), 'lite'); });
  it('uses detection when preference is auto', () => { setBrowser({ cores: 4 }); assert.equal(resolveEffectiveMode('auto', false), 'balanced'); });
});

describe('performanceMode flags', () => {
  it('enables every feature in Full', () => assert.ok(Object.values(getPerformanceFlags('full')).every(Boolean)));
  it('disables every feature in Lite', () => assert.ok(Object.values(getPerformanceFlags('lite')).every((value) => !value)));
  it('keeps core visuals but drops expensive extras in Balanced', () => {
    const flags = getPerformanceFlags('balanced');
    assert.equal(flags.starfield, true);
    assert.equal(flags.warpTransition, true);
    assert.equal(flags.cursorTrail, false);
    assert.equal(flags.constellation3d, true);
  });
});
