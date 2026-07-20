/**
 * CI entry point — validates src/data/projects.json against CATEGORIES and schema rules.
 * Logic mirrors src/lib/validateProjects.ts (keep both in sync when rules change).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../src/data/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectsPath = path.join(__dirname, '../src/data/projects.json');

const ALL_TAGS = new Set(Object.values(CATEGORIES).flat());
const VALID_STATUSES = new Set(['live', 'beta', 'archived', 'wip']);
const VALID_CONNECTIVITY = new Set(['live', 'degraded', 'unknown']);

const TRUSTED_EMBED_HOSTS = new Set(['go.1ink.us', 'www.go.1ink.us', 'localhost', '127.0.0.1']);
const BLOCKED_EMBED_HOSTS = new Set(['noahcohn.com', 'www.noahcohn.com', 'projectm.1ink.us']);
const EXPLICIT_EMBED_ALLOWLIST = new Set();

function getUrlHostname(url) {
  try {
    return new URL(url).hostname.trim().toLowerCase();
  } catch {
    return null;
  }
}

function isEmbeddableUrl(url) {
  const host = getUrlHostname(url);
  if (!host) return false;
  if (BLOCKED_EMBED_HOSTS.has(host)) return EXPLICIT_EMBED_ALLOWLIST.has(host);
  if (TRUSTED_EMBED_HOSTS.has(host)) return true;
  return EXPLICIT_EMBED_ALLOWLIST.has(host);
}

function assertEmbeddableProjectUrl(project) {
  if (project.embedUrl === null) return;
  if (typeof project.embedUrl !== 'string' || !project.embedUrl.startsWith('http')) {
    fail(`Project "${project.title}" embedUrl must be a URL or null`);
  }
  if (!isEmbeddableUrl(project.embedUrl)) {
    fail(`Project "${project.title}" embedUrl "${project.embedUrl}" is not on an embed-allowlisted host`);
  }
}

function fail(message) {
  throw new Error(message);
}

function validateProjects(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    fail('projects.json must contain at least one project');
  }

  const ids = new Set();

  for (const project of projects) {
    if (!Number.isInteger(project.id) || project.id <= 0) {
      fail(`Project "${project.title}" has invalid id`);
    }
    if (ids.has(project.id)) fail(`Duplicate project id: ${project.id}`);
    ids.add(project.id);

    if (!project.title) fail(`Project id ${project.id} is missing title`);
    if (!Array.isArray(project.tags) || project.tags.length === 0) {
      fail(`Project "${project.title}" must have at least one tag`);
    }

    for (const tag of project.tags) {
      if (!ALL_TAGS.has(tag)) {
        fail(`Project "${project.title}" (id ${project.id}) has unknown tag "${tag}" — add it to CATEGORIES or fix the tag`);
      }
    }

    if (typeof project.year !== 'number' || project.year < 2000 || project.year > 2100) {
      fail(`Project "${project.title}" has invalid year ${project.year}`);
    }
    if (typeof project.featured !== 'boolean') {
      fail(`Project "${project.title}" must declare featured (boolean)`);
    }
    if (!VALID_STATUSES.has(project.status)) {
      fail(`Project "${project.title}" has invalid status "${project.status}"`);
    }

    if (project.repo !== null && (typeof project.repo !== 'string' || !project.repo.startsWith('http'))) {
      fail(`Project "${project.title}" repo must be a URL or null`);
    }
    if (project.embedUrl !== null) {
      assertEmbeddableProjectUrl(project);
    }
    if (project.healthOverride != null && !VALID_CONNECTIVITY.has(project.healthOverride)) {
      fail(`Project "${project.title}" healthOverride must be live | degraded | unknown | null`);
    }
    if (project.accent !== null && (typeof project.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(project.accent))) {
      fail(`Project "${project.title}" accent must be a hex color (#RRGGBB) or null`);
    }
    if (project.changelog !== null && typeof project.changelog !== 'string') {
      fail(`Project "${project.title}" changelog must be a string or null`);
    }

    if (!Array.isArray(project.relatedIds)) {
      fail(`Project "${project.title}" relatedIds must be an array`);
    }
    for (const relatedId of project.relatedIds) {
      if (relatedId === project.id) {
        fail(`Project "${project.title}" cannot reference itself in relatedIds`);
      }
      if (!projects.some((p) => p.id === relatedId)) {
        fail(`Project "${project.title}" references unknown relatedId ${relatedId}`);
      }
    }
  }
}

try {
  const projects = JSON.parse(readFileSync(projectsPath, 'utf8'));
  validateProjects(projects);
  console.log(`✓ ${projects.length} projects validated (tags ⊆ CATEGORIES, schema OK)`);
} catch (err) {
  console.error('Project validation failed:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
