import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchText, scoreCatalog, scoreCommands } from '../src/lib/search.ts';

const project = (overrides) => ({
  id: overrides.id,
  title: overrides.title,
  description: overrides.description ?? '',
  tags: overrides.tags ?? [],
  tech: overrides.tech ?? [],
  repo: overrides.repo ?? null,
  changelog: overrides.changelog ?? null,
  status: overrides.status ?? 'live',
  year: overrides.year ?? 2020,
  ...overrides,
});

const ids = (results) => results.map(({ item }) => item.id);

describe('matchText', () => {
  it('returns null for an empty query', () => assert.equal(matchText('', 'Hyphon'), null));
  it('returns null when there is no match at all', () => assert.equal(matchText('zzz', 'Hyphon'), null));
  it('scores an exact match highest', () => {
    const exact = matchText('hyphon', 'Hyphon');
    const prefix = matchText('hyph', 'Hyphon');
    assert.ok(exact.score > prefix.score);
    assert.deepEqual(exact.ranges, [[0, 6]]);
  });
  it('scores a prefix above a later substring', () => {
    const prefix = matchText('xm', 'XM Player');
    const later = matchText('play', 'XM Player');
    assert.ok(prefix.score > later.score);
    assert.deepEqual(prefix.ranges, [[0, 2]]);
  });
  it('falls back to a fuzzy subsequence match for a dropped-letter typo substring cannot cover', () => {
    // "hyphn" (missing the "o") isn't a substring of "Hyphon", but every
    // character still appears in order, so the subsequence fallback finds it.
    const fuzzy = matchText('hyphn', 'Hyphon');
    assert.ok(fuzzy);
    assert.equal(fuzzy.ranges.length > 0, true);
  });
  it('ranks a tighter (more consecutive) fuzzy match above a looser one', () => {
    const tight = matchText('abcd', 'abcdxyz');
    const loose = matchText('abcd', 'azbzczdz');
    assert.ok(tight.score > loose.score);
  });
});

describe('scoreCommands', () => {
  const items = [
    { id: 'hyphon', label: 'Hyphon' },
    { id: 'xm-player', label: 'XM Player' },
    { id: 'other', label: 'Something Else', keywords: ['unrelated'] },
  ];

  it('returns every item unscored for an empty query', () => {
    const results = scoreCommands('', items);
    assert.deepEqual(results.map((r) => r.item.id), ['hyphon', 'xm-player', 'other']);
    assert.ok(results.every((r) => r.score === 0 && r.ranges.length === 0));
  });

  it('ranks Hyphon first for a dropped-letter fuzzy query', () => {
    const results = scoreCommands('hyphn', items);
    assert.equal(results[0].item.id, 'hyphon');
  });

  it('ranks XM Player first for its prefix', () => {
    const results = scoreCommands('xm', items);
    assert.equal(results[0].item.id, 'xm-player');
  });

  it('excludes items that match nowhere', () => {
    const results = scoreCommands('zzz-no-match', items);
    assert.deepEqual(results, []);
  });

  it('falls back to keyword matches when the label does not match', () => {
    const results = scoreCommands('unrelated', items);
    assert.deepEqual(results.map((r) => r.item.id), ['other']);
    assert.deepEqual(results[0].ranges, []);
  });
});

describe('scoreCatalog', () => {
  const fixtures = [
    project({ id: 1, title: 'Alpha Game', description: 'Canvas adventure', tags: ['Game', 'Web'], tech: ['React'], year: 2023 }),
    project({ id: 2, title: 'Cave Crystals', description: 'Mining sim', tags: ['Game'], tech: [], year: 2024 }),
    project({ id: 3, title: 'Gamma Tool', description: 'cave-crystal themed weather data', tags: ['Utility'], tech: ['TypeScript'], year: 2025 }),
    project({ id: 4, title: 'Delta Experiment', description: 'Shader playground', tags: ['Graphics'], tech: ['WebGL'], year: 2021 }),
  ];

  it('returns every item unscored, in original order, for a blank query', () => {
    const results = scoreCatalog('   ', fixtures);
    assert.deepEqual(ids(results), [1, 2, 3, 4]);
    assert.ok(results.every((r) => r.score === 0));
  });

  it('requires every whitespace-delimited term, allowing different fields per term', () => {
    assert.deepEqual(ids(scoreCatalog('cave cry', fixtures)), [2, 3]);
    assert.deepEqual(ids(scoreCatalog('gamma audio', fixtures)), []);
  });

  it('ranks a title hit above a description-only hit for the same terms', () => {
    const results = scoreCatalog('cave cry', fixtures);
    assert.equal(results[0].item.id, 2);
  });

  it('gates year matches so a 4-digit term does not drown out title matches', () => {
    const results = scoreCatalog('2024', fixtures);
    assert.deepEqual(ids(results), [2]);
    assert.ok(results[0].score < 50);
  });

  it('does not treat a non-4-digit number as a year term', () => {
    assert.deepEqual(scoreCatalog('202', fixtures), []);
  });
});
