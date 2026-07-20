import { ALL_TAGS } from '../constants';
import { assertEmbeddableProjectUrl } from './projectEmbed';
import type { ConnectivityHealth, Project, ProjectStatus } from '../types';

const VALID_CONNECTIVITY = new Set<ConnectivityHealth>(['live', 'degraded', 'unknown']);

const VALID_STATUSES = new Set<ProjectStatus>(['live', 'beta', 'archived', 'wip']);

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectValidationError';
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new ProjectValidationError(message);
}

/** Ensure every project tag is declared in CATEGORIES and cross-field rules hold. */
export function validateProjects(projects: Project[]): void {
  assert(projects.length > 0, 'projects.json must contain at least one project');

  const ids = new Set<number>();

  for (const project of projects) {
    assert(Number.isInteger(project.id) && project.id > 0, `Project "${project.title}" has invalid id`);
    assert(!ids.has(project.id), `Duplicate project id: ${project.id}`);
    ids.add(project.id);

    assert(typeof project.title === 'string' && project.title.length > 0, `Project id ${project.id} is missing title`);
    assert(Array.isArray(project.tags) && project.tags.length > 0, `Project "${project.title}" must have at least one tag`);

    for (const tag of project.tags) {
      assert(ALL_TAGS.has(tag), `Project "${project.title}" (id ${project.id}) has unknown tag "${tag}" — add it to CATEGORIES or fix the tag`);
    }

    assert(typeof project.year === 'number' && project.year >= 2000 && project.year <= 2100,
      `Project "${project.title}" has invalid year ${project.year}`);
    assert(typeof project.featured === 'boolean', `Project "${project.title}" must declare featured (boolean)`);
    assert(VALID_STATUSES.has(project.status), `Project "${project.title}" has invalid status "${project.status}"`);

    if (project.repo !== null) {
      assert(typeof project.repo === 'string' && project.repo.startsWith('http'),
        `Project "${project.title}" repo must be a URL or null`);
    }
    if (project.embedUrl !== null) {
      assertEmbeddableProjectUrl(project);
    }
    if (project.healthOverride != null) {
      assert(VALID_CONNECTIVITY.has(project.healthOverride),
        `Project "${project.title}" healthOverride must be live | degraded | unknown | null`);
    }
    if (project.accent !== null) {
      assert(typeof project.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(project.accent),
        `Project "${project.title}" accent must be a hex color (#RRGGBB) or null`);
    }
    if (project.changelog !== null) {
      assert(typeof project.changelog === 'string', `Project "${project.title}" changelog must be a string or null`);
    }

    assert(Array.isArray(project.relatedIds), `Project "${project.title}" relatedIds must be an array`);
    for (const relatedId of project.relatedIds) {
      assert(relatedId !== project.id, `Project "${project.title}" cannot reference itself in relatedIds`);
      assert(ids.has(relatedId) || projects.some((p) => p.id === relatedId),
        `Project "${project.title}" references unknown relatedId ${relatedId}`);
    }
  }
}
