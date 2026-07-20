import type { Project } from '../types';

/** Hosts whose project URLs may be embedded in the hub iframe dock. */
export const TRUSTED_EMBED_HOSTS = new Set([
  'go.1ink.us',
  'www.go.1ink.us',
  'localhost',
  '127.0.0.1',
]);

/**
 * External domains that must never embed unless explicitly listed in
 * EXPLICIT_EMBED_ALLOWLIST (currently empty — reserved for future opt-in).
 */
export const BLOCKED_EMBED_HOSTS = new Set([
  'noahcohn.com',
  'www.noahcohn.com',
  'projectm.1ink.us',
]);

/** Cross-origin hosts explicitly cleared for embedding (empty by default). */
export const EXPLICIT_EMBED_ALLOWLIST = new Set<string>();

export const EMBED_THEME_MESSAGE = 'go1inkus:theme' as const;

export interface EmbedThemeMessage {
  source: 'go.1ink.us';
  type: typeof EMBED_THEME_MESSAGE;
  theme: string;
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase();
}

/** Parse a project URL / embedUrl and return its hostname, or null if invalid. */
export function getUrlHostname(url: string): string | null {
  try {
    return normalizeHost(new URL(url).hostname);
  } catch {
    return null;
  }
}

/** Whether a URL's host is permitted inside the sandboxed preview dock. */
export function isEmbeddableUrl(url: string): boolean {
  const host = getUrlHostname(url);
  if (!host) return false;

  if (BLOCKED_EMBED_HOSTS.has(host)) {
    return EXPLICIT_EMBED_ALLOWLIST.has(host);
  }

  if (TRUSTED_EMBED_HOSTS.has(host)) return true;
  return EXPLICIT_EMBED_ALLOWLIST.has(host);
}

/**
 * Resolve the iframe src for a project, or null when preview must not be offered.
 * Explicit `embedUrl` wins; otherwise same-origin/trusted `url` hosts auto-qualify.
 */
export function resolveProjectEmbedUrl(project: Pick<Project, 'url' | 'embedUrl'>): string | null {
  const candidate = project.embedUrl ?? project.url;
  return isEmbeddableUrl(candidate) ? candidate : null;
}

export function canPreviewProject(project: Pick<Project, 'url' | 'embedUrl'>): boolean {
  return resolveProjectEmbedUrl(project) !== null;
}

/** Build a theme handoff message for embedded child apps that opt in via postMessage. */
export function createEmbedThemeMessage(theme: string): EmbedThemeMessage {
  return {
    source: 'go.1ink.us',
    type: EMBED_THEME_MESSAGE,
    theme,
  };
}

/** Validate embedUrl field at data-load time (throws on policy violation). */
export function assertEmbeddableProjectUrl(project: Pick<Project, 'title' | 'embedUrl'>): void {
  if (project.embedUrl === null) return;

  if (typeof project.embedUrl !== 'string' || !project.embedUrl.startsWith('http')) {
    throw new Error(`Project "${project.title}" embedUrl must be a URL or null`);
  }

  if (!isEmbeddableUrl(project.embedUrl)) {
    throw new Error(
      `Project "${project.title}" embedUrl "${project.embedUrl}" is not on an embed-allowlisted host`,
    );
  }
}
