import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMissionControlReport } from '../src/lib/missionControl.ts';

const project = (overrides) => ({
  id: 1,
  title: 'Project Alpha',
  description: 'Test project',
  url: 'https://example.com/1',
  image: '/img1.png',
  icon: '💎',
  tags: ['Game'],
  tech: ['Canvas'],
  featured: true,
  year: 2023,
  status: 'live',
  repo: null,
  embedUrl: null,
  accent: null,
  relatedIds: [],
  changelog: null,
  healthOverride: null,
  ...overrides,
});

const emptyStats = (overrides) => ({
  version: 1,
  projectLaunches: {},
  recentLaunches: [],
  filterUsage: {},
  displayModes: {},
  totalLaunches: 0,
  lastUpdated: 0,
  ...overrides,
});

const emptySnapshot = (overrides) => ({
  generatedAt: '2026-09-01T00:00:00.000Z',
  source: 'ci',
  projects: {},
  summary: { live: 0, degraded: 0, unknown: 0, total: 0 },
  ...overrides,
});

describe('missionControl module', () => {
  describe('buildMissionControlReport: health resolution', () => {
    it('uses the manual override when set, ignoring the probe', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1, healthOverride: 'degraded' })],
        healthSnapshot: emptySnapshot({
          projects: { 1: { health: 'live', httpStatus: 200, latencyMs: 50, checkedAt: '2026-09-01T00:00:00.000Z' } },
        }),
        stats: emptyStats(),
      });
      assert.equal(report.nodes[0].health, 'degraded');
      assert.equal(report.nodes[0].source, 'override');
      assert.equal(report.nodes[0].latencyMs, null);
    });

    it('falls back to the build-time probe when there is no override', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1, healthOverride: null })],
        healthSnapshot: emptySnapshot({
          projects: { 1: { health: 'live', httpStatus: 200, latencyMs: 42, checkedAt: '2026-09-01T00:00:00.000Z' } },
        }),
        stats: emptyStats(),
      });
      assert.equal(report.nodes[0].health, 'live');
      assert.equal(report.nodes[0].source, 'probe');
      assert.equal(report.nodes[0].latencyMs, 42);
    });

    it('defaults to unknown when neither an override nor a probe record exists', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1, healthOverride: null })],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats(),
      });
      assert.equal(report.nodes[0].health, 'unknown');
      assert.equal(report.nodes[0].source, 'default');
    });

    it('joins per-project launch counts onto each node', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1 }), project({ id: 2, title: 'Project Beta' })],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats({ projectLaunches: { 1: 3 } }),
      });
      assert.equal(report.nodes.find((n) => n.id === 1).launches, 3);
      assert.equal(report.nodes.find((n) => n.id === 2).launches, 0);
    });
  });

  describe('buildMissionControlReport: recent launches', () => {
    const now = new Date('2026-09-21T00:00:00.000Z').getTime();
    const DAY = 24 * 60 * 60 * 1000;

    it('keeps launches within the 30-day rolling window', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1 })],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats({ recentLaunches: [{ projectId: 1, ts: now - 5 * DAY }] }),
        now,
      });
      assert.equal(report.recentLaunches.length, 1);
      assert.equal(report.recentLaunches[0].title, 'Project Alpha');
    });

    it('prunes launches older than 30 days', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1 })],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats({ recentLaunches: [{ projectId: 1, ts: now - 40 * DAY }] }),
        now,
      });
      assert.equal(report.recentLaunches.length, 0);
    });

    it('caps recent launches to recentLaunchesLimit', () => {
      const recentLaunches = Array.from({ length: 12 }, (_, i) => ({ projectId: 1, ts: now - i * DAY }));
      const report = buildMissionControlReport({
        projects: [project({ id: 1 })],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats({ recentLaunches }),
        now,
        recentLaunchesLimit: 4,
      });
      assert.equal(report.recentLaunches.length, 4);
    });

    it('resolves an unknown project id to a fallback title', () => {
      const report = buildMissionControlReport({
        projects: [],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats({ recentLaunches: [{ projectId: 99, ts: now }] }),
        now,
      });
      assert.equal(report.recentLaunches[0].title, 'ID 99');
    });
  });

  describe('buildMissionControlReport: top missions', () => {
    it('ranks projects by launch count, descending', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1, title: 'Alpha' }), project({ id: 2, title: 'Beta' }), project({ id: 3, title: 'Gamma' })],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats({ projectLaunches: { 1: 2, 2: 9, 3: 5 } }),
      });
      assert.deepEqual(report.topMissions.map((m) => m.projectId), [2, 3, 1]);
    });

    it('caps to topMissionsLimit', () => {
      const report = buildMissionControlReport({
        projects: [project({ id: 1 }), project({ id: 2 }), project({ id: 3 })],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats({ projectLaunches: { 1: 1, 2: 2, 3: 3 } }),
        topMissionsLimit: 2,
      });
      assert.equal(report.topMissions.length, 2);
    });
  });

  describe('buildMissionControlReport: transmissions', () => {
    it('derives and caps transmissions from project changelogs', () => {
      const report = buildMissionControlReport({
        projects: [
          project({ id: 1, changelog: '2026-08-10 · Alpha update.' }),
          project({ id: 2, title: 'Beta', changelog: null }),
          project({ id: 3, title: 'Gamma', changelog: '2026-08-15 · Gamma update.' }),
        ],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats(),
        transmissionsLimit: 1,
      });
      assert.equal(report.transmissions.length, 1);
      assert.equal(report.transmissions[0].title, 'Gamma');
    });
  });

  describe('buildMissionControlReport: pass-through fields', () => {
    it('carries generatedAt, probeSource, buildSha, and healthCounts from inputs', () => {
      const report = buildMissionControlReport({
        projects: [],
        healthSnapshot: emptySnapshot({
          generatedAt: '2026-09-10T12:00:00.000Z',
          source: 'manual',
          summary: { live: 5, degraded: 1, unknown: 2, total: 8 },
        }),
        stats: emptyStats({ totalLaunches: 7 }),
        buildSha: 'abc1234',
      });
      assert.equal(report.generatedAt, '2026-09-10T12:00:00.000Z');
      assert.equal(report.probeSource, 'manual');
      assert.equal(report.buildSha, 'abc1234');
      assert.deepEqual(report.healthCounts, { live: 5, degraded: 1, unknown: 2, total: 8 });
      assert.equal(report.totalLaunches, 7);
    });

    it('defaults buildSha to null when not supplied', () => {
      const report = buildMissionControlReport({
        projects: [],
        healthSnapshot: emptySnapshot(),
        stats: emptyStats(),
      });
      assert.equal(report.buildSha, null);
    });
  });
});
