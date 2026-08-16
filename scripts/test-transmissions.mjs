import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTransmissionDate,
  parseChangelog,
  deriveTransmissions,
} from '../src/lib/transmissions.ts';
import { validateProjects, ProjectValidationError } from '../src/lib/validateProjects.ts';

describe('transmissions module', () => {
  describe('formatTransmissionDate', () => {
    it('formats YYYY-MM-DD into MMM DD, YYYY', () => {
      assert.equal(formatTransmissionDate('2026-08-16'), 'AUG 16, 2026');
      assert.equal(formatTransmissionDate('2026-01-05'), 'JAN 5, 2026');
    });

    it('formats YYYY-MM into MMM YYYY', () => {
      assert.equal(formatTransmissionDate('2026-08'), 'AUG 2026');
      assert.equal(formatTransmissionDate('2025-12'), 'DEC 2025');
    });

    it('returns raw year or string fallback for non-date patterns', () => {
      assert.equal(formatTransmissionDate('2024'), '2024');
      assert.equal(formatTransmissionDate('v1.0'), 'v1.0');
    });

    it('handles empty input gracefully', () => {
      assert.equal(formatTransmissionDate(''), '');
    });
  });

  describe('parseChangelog', () => {
    it('extracts date and summary with middle dot separator', () => {
      const result = parseChangelog('2026-08-12 · New level editor and asset pipeline.', 2023);
      assert.equal(result.date, '2026-08-12');
      assert.equal(result.formattedDate, 'AUG 12, 2026');
      assert.equal(result.summary, 'New level editor and asset pipeline.');
    });

    it('extracts date and summary with hyphen separator', () => {
      const result = parseChangelog('2026-07 - Web Audio synth engine rewrite.', 2024);
      assert.equal(result.date, '2026-07');
      assert.equal(result.formattedDate, 'JUL 2026');
      assert.equal(result.summary, 'Web Audio synth engine rewrite.');
    });

    it('falls back to default year when no date prefix is present', () => {
      const result = parseChangelog('Legacy changelog text without a date prefix.', 2023);
      assert.equal(result.date, '2023');
      assert.equal(result.formattedDate, '2023');
      assert.equal(result.summary, 'Legacy changelog text without a date prefix.');
    });
  });

  describe('deriveTransmissions', () => {
    const sampleProjects = [
      {
        id: 1,
        title: 'Project Alpha',
        description: 'First test project',
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
        changelog: '2026-08-10 · Alpha major update with new levels.',
      },
      {
        id: 2,
        title: 'Project Beta',
        description: 'Second test project',
        url: 'https://example.com/2',
        image: '/img2.png',
        icon: '🎹',
        tags: ['Audio'],
        tech: ['React'],
        featured: false,
        year: 2024,
        status: 'live',
        repo: null,
        embedUrl: null,
        accent: null,
        relatedIds: [],
        changelog: null,
      },
      {
        id: 3,
        title: 'Project Gamma',
        description: 'Third test project',
        url: 'https://example.com/3',
        image: '/img3.png',
        icon: '🌈',
        tags: ['Graphics'],
        tech: ['WebGL'],
        featured: false,
        year: 2025,
        status: 'live',
        repo: null,
        embedUrl: null,
        accent: null,
        relatedIds: [],
        changelog: '2026-08-15 · Gamma latest shaders release.',
      },
    ];

    it('filters out projects with null or empty changelog', () => {
      const list = deriveTransmissions(sampleProjects);
      assert.equal(list.length, 2);
      assert.deepEqual(list.map((t) => t.projectId), [3, 1]);
    });

    it('sorts reverse-chronologically (newest date first)', () => {
      const list = deriveTransmissions(sampleProjects);
      assert.equal(list[0].projectId, 3);
      assert.equal(list[0].date, '2026-08-15');
      assert.equal(list[1].projectId, 1);
      assert.equal(list[1].date, '2026-08-10');
    });

    it('returns empty array when input is empty or invalid', () => {
      assert.deepEqual(deriveTransmissions([]), []);
    });
  });

  describe('validateProjects with changelog field', () => {
    it('accepts valid project catalog with null and string changelogs', () => {
      const valid = [
        {
          id: 1,
          title: 'App 1',
          description: 'Desc',
          url: 'https://example.com',
          image: '/1.png',
          icon: '💎',
          tags: ['Game'],
          tech: ['JS'],
          featured: true,
          year: 2023,
          status: 'live',
          repo: null,
          embedUrl: null,
          accent: null,
          relatedIds: [],
          changelog: '2026-08-12 · Valid changelog',
        },
      ];
      assert.doesNotThrow(() => validateProjects(valid));
    });

    it('throws when changelog is empty string', () => {
      const invalid = [
        {
          id: 1,
          title: 'App 1',
          description: 'Desc',
          url: 'https://example.com',
          image: '/1.png',
          icon: '💎',
          tags: ['Game'],
          tech: ['JS'],
          featured: true,
          year: 2023,
          status: 'live',
          repo: null,
          embedUrl: null,
          accent: null,
          relatedIds: [],
          changelog: '   ',
        },
      ];
      assert.throws(() => validateProjects(invalid), ProjectValidationError);
    });
  });
});
