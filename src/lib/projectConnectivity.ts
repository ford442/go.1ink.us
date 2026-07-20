import projectData from '../data/projectData';
import healthSnapshot from '../data/projectHealth.json';
import type {
  ConnectivityHealth,
  Project,
  ProjectHealthSnapshot,
  ResolvedProjectConnectivity,
} from '../types';

const snapshot = healthSnapshot as ProjectHealthSnapshot;

export interface ConnectivityDisplay {
  label: 'LIVE' | 'DEGRADED' | 'UNKNOWN';
  dotClass: string;
  textClass: string;
  borderClass: string;
}

export const CONNECTIVITY_DISPLAY: Record<ConnectivityHealth, ConnectivityDisplay> = {
  live: {
    label: 'LIVE',
    dotClass: 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
  },
  degraded: {
    label: 'DEGRADED',
    dotClass: 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  unknown: {
    label: 'UNKNOWN',
    dotClass: 'bg-gray-400 shadow-[0_0_6px_rgba(156,163,175,0.6)]',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/30',
  },
};

export function getConnectivityDisplay(health: ConnectivityHealth): ConnectivityDisplay {
  return CONNECTIVITY_DISPLAY[health] ?? CONNECTIVITY_DISPLAY.unknown;
}

export function getHealthSnapshot(): ProjectHealthSnapshot {
  return snapshot;
}

export function getConnectivitySummary() {
  return snapshot.summary;
}

/** Effective reachability: manual override → build probe → unknown. */
export function resolveProjectConnectivity(
  project: Pick<Project, 'id' | 'healthOverride'>,
): ResolvedProjectConnectivity {
  if (project.healthOverride) {
    return {
      health: project.healthOverride,
      httpStatus: null,
      latencyMs: null,
      checkedAt: null,
      source: 'override',
    };
  }

  const probe = snapshot.projects[String(project.id)];
  if (probe) {
    return { ...probe, source: 'probe' };
  }

  return {
    health: 'unknown',
    httpStatus: null,
    latencyMs: null,
    checkedAt: null,
    source: 'default',
  };
}

export function getProjectConnectivity(projectId: number): ResolvedProjectConnectivity {
  const project = projectData.find((entry) => entry.id === projectId);
  if (!project) {
    return resolveProjectConnectivity({ id: projectId, healthOverride: null });
  }
  return resolveProjectConnectivity(project);
}

/** Build meaningful activity-feed lines from the latest probe snapshot. */
export function buildConnectivityActivityLogs(limit = 8): string[] {
  const lines: string[] = [];
  const { summary, generatedAt } = snapshot;

  lines.push(`CATALOG_PROBE: ${summary.live}/${summary.total} NODES REACHABLE`);

  const degraded = projectData.filter(
    (project) => resolveProjectConnectivity(project).health === 'degraded',
  );
  for (const project of degraded.slice(0, 3)) {
    const record = resolveProjectConnectivity(project);
    lines.push(
      `NODE_DEGRADED: [${project.title.toUpperCase()}] HTTP ${record.httpStatus ?? 'ERR'}`,
    );
  }

  const unknown = projectData.filter(
    (project) => resolveProjectConnectivity(project).health === 'unknown',
  );
  for (const project of unknown.slice(0, 2)) {
    lines.push(`NODE_UNREACHABLE: [${project.title.toUpperCase()}] — PROBE SKIPPED`);
  }

  const live = projectData
    .map((project) => ({ project, record: resolveProjectConnectivity(project) }))
    .filter(({ record }) => record.health === 'live' && record.latencyMs != null)
    .sort((a, b) => (a.record.latencyMs ?? 0) - (b.record.latencyMs ?? 0));

  for (const { project, record } of live.slice(0, 4)) {
    lines.push(`PING ${project.title.toUpperCase()} ... ${record.latencyMs}ms`);
  }

  if (generatedAt) {
    lines.push(`PROBE_STAMP: ${generatedAt.slice(0, 19).replace('T', ' ')}Z`);
  }

  return lines.slice(0, limit);
}

export function formatNetTelemetry(): { live: number; total: number; pct: number } {
  const { live, total } = snapshot.summary;
  const pct = total > 0 ? Math.round((live / total) * 100) : 0;
  return { live, total, pct };
}
