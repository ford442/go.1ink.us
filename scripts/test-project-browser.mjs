import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFilters,
  computeCounts,
  computeSuggestedTags,
  deriveActiveCategories,
  enhanceProjects,
  getItemsPerPage,
  matchSearchQuery,
  paginate,
  sortProjects,
} from '../src/lib/projectBrowser.ts';

const project = (overrides) => ({
  id: overrides.id,
  title: overrides.title,
  description: overrides.description ?? '',
  url: '', image: '', icon: '', tags: [], tech: [], featured: false,
  year: 2020, status: 'live', repo: null, embedUrl: null, accent: null,
  relatedIds: [], changelog: null,
  ...overrides,
});

const fixtures = [
  project({ id: 1, title: 'Alpha Game', description: 'Canvas adventure', tags: ['Game', 'Web'], tech: ['React'], featured: true, year: 2023 }),
  project({ id: 2, title: 'Beta Audio', description: 'Music workstation', tags: ['Audio', 'DAW'], tech: ['Web Audio API'], year: 2025 }),
  project({ id: 3, title: 'Gamma Tool', description: 'Weather data', tags: ['Utility', 'Data', 'Web'], tech: ['TypeScript', 'React'], featured: true, year: 2025 }),
  project({ id: 4, title: 'Delta Experiment', description: 'Shader playground', tags: ['Graphics', 'Experiment'], tech: ['WebGL'], year: 2021 }),
];
const enhanced = enhanceProjects(fixtures);
const ids = (projects) => projects.map(({ id }) => id);

describe('project enhancement and metadata', () => {
  it('adds tagSet without mutating source records', () => {
    assert.deepEqual([...enhanced[0].tagSet], ['Game', 'Web']);
    assert.equal('tagSet' in fixtures[0], false);
  });
  it('adds every category implied by tags', () => {
    assert.deepEqual([...enhanced[0].categorySet].sort(), ['Experiments', 'Games']);
  });
  it('ignores unknown tags when deriving categories', () => {
    const [value] = enhanceProjects([project({ id: 9, title: 'Unknown', tags: ['Unmapped'] })]);
    assert.equal(value.categorySet.size, 0);
  });
  it('derives active categories from category and tag filters', () => {
    assert.deepEqual(deriveActiveCategories(['Games', 'Audio', 'Web']), ['Games', 'Audio/Visual', 'Experiments']);
  });
  it('counts tags and each category once per project', () => {
    const counts = computeCounts(enhanced);
    assert.equal(counts.tagCounts.Web, 2);
    assert.equal(counts.categoryCounts.Experiments, 3);
    assert.equal(counts.categoryCounts.Tools, 1);
  });
  it('returns top tag suggestions with a configurable limit', () => {
    assert.deepEqual(computeSuggestedTags(fixtures, 2), ['Web', 'Game']);
    assert.deepEqual(computeSuggestedTags(fixtures, 0), []);
  });
});

describe('matchSearchQuery', () => {
  it('returns the original array for a blank query', () => {
    assert.equal(matchSearchQuery(enhanced, '   '), enhanced);
  });
  it('matches title case-insensitively', () => assert.deepEqual(ids(matchSearchQuery(enhanced, 'ALPHA')), [1]));
  it('matches descriptions', () => assert.deepEqual(ids(matchSearchQuery(enhanced, 'workstation')), [2]));
  it('matches tags', () => assert.deepEqual(ids(matchSearchQuery(enhanced, 'utility')), [3]));
  it('matches technology names', () => assert.deepEqual(ids(matchSearchQuery(enhanced, 'webgl')), [4]));
  it('requires every term while allowing different fields', () => {
    assert.deepEqual(ids(matchSearchQuery(enhanced, 'gamma react data')), [3]);
    assert.deepEqual(matchSearchQuery(enhanced, 'gamma audio'), []);
  });
});

describe('applyFilters', () => {
  it('returns the original array when no filters are active', () => assert.equal(applyFilters(enhanced, [], []), enhanced));
  it('matches a specific tag', () => assert.deepEqual(ids(applyFilters(enhanced, ['Web'], [])), [1, 3]));
  it('matches any tag in a category', () => assert.deepEqual(ids(applyFilters(enhanced, ['Audio/Visual'], [])), [2, 4]));
  it('intersects category and tag filters', () => assert.deepEqual(ids(applyFilters(enhanced, ['Experiments', 'Data'], [])), [3]));
  it('intersects multiple tag filters', () => assert.deepEqual(ids(applyFilters(enhanced, ['Utility', 'Web'], [])), [3]));
  it('applies the Favorites pseudo-filter', () => assert.deepEqual(ids(applyFilters(enhanced, ['Favorites'], [4, 2])), [2, 4]));
  it('intersects Favorites with regular filters', () => assert.deepEqual(ids(applyFilters(enhanced, ['Favorites', 'Audio/Visual'], [1, 4])), [4]));
  it('treats All as no regular filter', () => assert.equal(applyFilters(enhanced, ['All'], []), enhanced));
});

describe('sortProjects', () => {
  it('sorts Featured first, then by id', () => assert.deepEqual(ids(sortProjects(fixtures, 'Featured', 1)), [1, 3, 2, 4]));
  it('does not mutate the input array', () => {
    const input = [...fixtures];
    sortProjects(input, 'Newest', 1);
    assert.deepEqual(ids(input), [1, 2, 3, 4]);
  });
  it('sorts Newest with id as the descending tie-breaker', () => assert.deepEqual(ids(sortProjects(fixtures, 'Newest', 1)), [3, 2, 1, 4]));
  it('sorts A-Z by title', () => assert.deepEqual(ids(sortProjects([...fixtures].reverse(), 'A-Z', 1)), [1, 2, 4, 3]));
  it('keeps Random deterministic for one seed', () => {
    assert.deepEqual(ids(sortProjects(fixtures, 'Random', 0.42)), ids(sortProjects(fixtures, 'Random', 0.42)));
  });
  it('changes Random ordering when the seed changes', () => {
    assert.notDeepEqual(ids(sortProjects(fixtures, 'Random', 0.42)), ids(sortProjects(fixtures, 'Random', 0.91)));
  });
  it('sorts Most Complex by combined tech and tag count', () => assert.deepEqual(ids(sortProjects(fixtures, 'Most Complex', 1)), [3, 1, 2, 4]));
  it('uses favorite list order for the Favorites-only Featured view', () => {
    assert.deepEqual(ids(sortProjects([fixtures[1], fixtures[3]], 'Featured', 1, { activeFilters: ['Favorites'], favorites: [4, 2] })), [4, 2]);
  });
});

describe('pagination', () => {
  it('returns the requested page slice', () => assert.deepEqual(paginate([1, 2, 3, 4, 5], 2, 2), [3, 4]));
  it('returns a partial final page', () => assert.deepEqual(paginate([1, 2, 3, 4, 5], 3, 2), [5]));
  it('returns empty beyond the last page', () => assert.deepEqual(paginate([1, 2], 3, 2), []));
  it('rejects invalid page and page-size bounds', () => {
    assert.deepEqual(paginate([1, 2], 0, 2), []);
    assert.deepEqual(paginate([1, 2], 1, 0), []);
  });
  it('maps every display mode to its production page size', () => {
    assert.deepEqual(['dense', 'grid', 'list', 'matrix', 'map', 'constellation'].map(getItemsPerPage), [24, 6, 8, 10, 100, 100]);
  });
});
