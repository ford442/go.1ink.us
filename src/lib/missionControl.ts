// Mission Control: joins the three partial operator surfaces (build-time
// health probes, local-only launch analytics, and per-project changelogs)
// into one report. `buildMissionControlReport` is pure — every input is a
// parameter, nothing reads localStorage/env/the bundled JSON singleton
// directly — so the join logic (override vs probe vs default, launch
// pruning, ranking) is unit-testable without a DOM or real clock.
// `buildLiveMissionControlReport` is the thin, non-pure convenience wrapper
// that feeds it real data; only that wrapper touches module-level state.
import projectData from '../data/projectData';
import { deriveTransmissions } from './transmissions';
import { getHealthSnapshot } from './projectConnectivity';
import { getOperatorStats } from './analytics';
import type { ConnectivityHealth, Project, ProjectHealthSnapshot } from '../types';
import type { OperatorStats, ProjectLaunchSource, RecentLaunch } from './analytics';

/** Matches analytics.ts's own rolling window so "recent" means the same thing everywhere. */
const RECENT_LAUNCH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface MissionControlNode {
  id: number;
  title: string;
  health: ConnectivityHealth;
  source: 'override' | 'probe' | 'default';
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string | null;
  launches: number;
}

export interface MissionControlLaunch {
  projectId: number;
  title: string;
  ts: number;
  source?: ProjectLaunchSource;
}

export interface MissionControlMission {
  projectId: number;
  title: string;
  count: number;
}

export interface MissionControlTransmission {
  id: string;
  projectId: number;
  title: string;
  formattedDate: string;
  summary: string;
}

export interface MissionControlReport {
  generatedAt: string;
  probeSource: ProjectHealthSnapshot['source'];
  buildSha: string | null;
  nodes: MissionControlNode[];
  healthCounts: ProjectHealthSnapshot['summary'];
  totalLaunches: number;
  recentLaunches: MissionControlLaunch[];
  topMissions: MissionControlMission[];
  transmissions: MissionControlTransmission[];
}

export interface BuildMissionControlReportParams {
  projects: Project[];
  healthSnapshot: ProjectHealthSnapshot;
  stats: OperatorStats;
  buildSha?: string | null;
  /** Injectable clock so launch pruning is deterministic in tests. */
  now?: number;
  recentLaunchesLimit?: number;
  topMissionsLimit?: number;
  transmissionsLimit?: number;
}

/** Effective reachability for one project: override wins over probe, else default/unknown. */
function resolveHealth(
  project: Pick<Project, 'id' | 'healthOverride'>,
  snapshot: ProjectHealthSnapshot,
): Pick<MissionControlNode, 'health' | 'source' | 'httpStatus' | 'latencyMs' | 'checkedAt'> {
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

  return { health: 'unknown', httpStatus: null, latencyMs: null, checkedAt: null, source: 'default' };
}

function pruneRecentLaunches(recent: RecentLaunch[], now: number): RecentLaunch[] {
  return recent.filter((entry) => now - entry.ts <= RECENT_LAUNCH_WINDOW_MS);
}

/** Pure join: `EnhancedProject`-shaped catalog + health snapshot + operator stats → dashboard rows. */
export function buildMissionControlReport({
  projects,
  healthSnapshot,
  stats,
  buildSha = null,
  now = Date.now(),
  recentLaunchesLimit = 8,
  topMissionsLimit = 5,
  transmissionsLimit = 8,
}: BuildMissionControlReportParams): MissionControlReport {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const resolveTitle = (projectId: number) => projectById.get(projectId)?.title ?? `ID ${projectId}`;

  const nodes: MissionControlNode[] = projects.map((project) => {
    const resolved = resolveHealth(project, healthSnapshot);
    return {
      id: project.id,
      title: project.title,
      launches: stats.projectLaunches[String(project.id)] ?? 0,
      ...resolved,
    };
  });

  const recentLaunches: MissionControlLaunch[] = pruneRecentLaunches(stats.recentLaunches, now)
    .slice(0, recentLaunchesLimit)
    .map((entry) => ({
      projectId: entry.projectId,
      title: resolveTitle(entry.projectId),
      ts: entry.ts,
      source: entry.source,
    }));

  const topMissions: MissionControlMission[] = Object.entries(stats.projectLaunches)
    .map(([id, count]) => ({ projectId: Number(id), count, title: resolveTitle(Number(id)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topMissionsLimit);

  const transmissions: MissionControlTransmission[] = deriveTransmissions(projects)
    .slice(0, transmissionsLimit)
    .map((transmission) => ({
      id: transmission.id,
      projectId: transmission.projectId,
      title: transmission.project.title,
      formattedDate: transmission.formattedDate,
      summary: transmission.summary,
    }));

  return {
    generatedAt: healthSnapshot.generatedAt,
    probeSource: healthSnapshot.source,
    buildSha,
    nodes,
    healthCounts: healthSnapshot.summary,
    totalLaunches: stats.totalLaunches,
    recentLaunches,
    topMissions,
    transmissions,
  };
}

/** Live wrapper: feeds the pure join real catalog/health/analytics state. */
export function buildLiveMissionControlReport(
  overrides: Partial<BuildMissionControlReportParams> = {},
): MissionControlReport {
  return buildMissionControlReport({
    projects: projectData,
    healthSnapshot: getHealthSnapshot(),
    stats: getOperatorStats(),
    buildSha: (import.meta.env.VITE_BUILD_SHA as string | undefined) ?? null,
    ...overrides,
  });
}
