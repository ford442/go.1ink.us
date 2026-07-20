import type { DisplayMode } from '../types';

export const ANALYTICS_STORAGE_KEY = 'curator_operator_stats';
export const ANALYTICS_DISABLED_KEY = 'curator_analytics_disabled';
export const ANALYTICS_UPDATED_EVENT = 'curator:stats-updated';

const STATS_VERSION = 1 as const;
const MAX_RECENT_LAUNCHES = 12;
const ROLLING_MS = 30 * 24 * 60 * 60 * 1000;

export type AnalyticsEvent = 'project_launch' | 'filter_use' | 'display_mode';

export type ProjectLaunchSource = 'modal' | 'context_menu' | 'embed_dock';

export interface RecentLaunch {
  projectId: number;
  ts: number;
  source?: ProjectLaunchSource;
}

export interface OperatorStats {
  version: typeof STATS_VERSION;
  projectLaunches: Record<string, number>;
  recentLaunches: RecentLaunch[];
  filterUsage: Record<string, number>;
  displayModes: Record<string, number>;
  totalLaunches: number;
  lastUpdated: number;
}

type TrackPayload =
  | { projectId: number; source?: ProjectLaunchSource }
  | { filter: string; action: 'add' | 'remove' | 'clear' }
  | { mode: DisplayMode };

function emptyStats(): OperatorStats {
  return {
    version: STATS_VERSION,
    projectLaunches: {},
    recentLaunches: [],
    filterUsage: {},
    displayModes: {},
    totalLaunches: 0,
    lastUpdated: Date.now(),
  };
}

function readStats(): OperatorStats {
  if (typeof localStorage === 'undefined') return emptyStats();

  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<OperatorStats>;
    if (parsed.version !== STATS_VERSION) return emptyStats();

    return {
      version: STATS_VERSION,
      projectLaunches: parsed.projectLaunches ?? {},
      recentLaunches: Array.isArray(parsed.recentLaunches) ? parsed.recentLaunches : [],
      filterUsage: parsed.filterUsage ?? {},
      displayModes: parsed.displayModes ?? {},
      totalLaunches: typeof parsed.totalLaunches === 'number' ? parsed.totalLaunches : 0,
      lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now(),
    };
  } catch {
    return emptyStats();
  }
}

function writeStats(stats: OperatorStats): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(stats));
}

function notifyStatsUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ANALYTICS_UPDATED_EVENT));
}

function pruneRecentLaunches(recent: RecentLaunch[], now: number): RecentLaunch[] {
  return recent
    .filter((entry) => now - entry.ts <= ROLLING_MS)
    .slice(0, MAX_RECENT_LAUNCHES);
}

/** Build-time kill switch (`VITE_ANALYTICS_DISABLED=true`) plus local opt-out. */
export function isAnalyticsEnabled(): boolean {
  if (import.meta.env.VITE_ANALYTICS_DISABLED === 'true') return false;
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(ANALYTICS_DISABLED_KEY) !== 'true';
}

export function setAnalyticsEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  if (enabled) {
    localStorage.removeItem(ANALYTICS_DISABLED_KEY);
  } else {
    localStorage.setItem(ANALYTICS_DISABLED_KEY, 'true');
  }
  notifyStatsUpdated();
}

export function getOperatorStats(): OperatorStats {
  const stats = readStats();
  const now = Date.now();
  return {
    ...stats,
    recentLaunches: pruneRecentLaunches(stats.recentLaunches, now),
  };
}

export function clearOperatorStats(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  notifyStatsUpdated();
}

function incrementCounter(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function applyEvent(stats: OperatorStats, event: AnalyticsEvent, payload: TrackPayload): OperatorStats {
  const now = Date.now();
  const next: OperatorStats = {
    ...stats,
    projectLaunches: { ...stats.projectLaunches },
    recentLaunches: [...stats.recentLaunches],
    filterUsage: { ...stats.filterUsage },
    displayModes: { ...stats.displayModes },
    lastUpdated: now,
  };

  switch (event) {
    case 'project_launch': {
      const { projectId, source } = payload as Extract<TrackPayload, { projectId: number }>;
      const key = String(projectId);
      incrementCounter(next.projectLaunches, key);
      next.totalLaunches += 1;
      next.recentLaunches.unshift({ projectId, ts: now, source });
      next.recentLaunches = pruneRecentLaunches(next.recentLaunches, now);
      break;
    }
    case 'filter_use': {
      const { filter, action } = payload as Extract<TrackPayload, { filter: string }>;
      if (action === 'clear') {
        incrementCounter(next.filterUsage, '__clear__');
      } else {
        incrementCounter(next.filterUsage, filter);
      }
      break;
    }
    case 'display_mode': {
      const { mode } = payload as Extract<TrackPayload, { mode: DisplayMode }>;
      incrementCounter(next.displayModes, mode);
      break;
    }
    default:
      break;
  }

  return next;
}

function postToBeacon(event: AnalyticsEvent, payload: TrackPayload): void {
  const url = import.meta.env.VITE_ANALYTICS_BEACON_URL;
  if (!url || typeof navigator === 'undefined') return;

  const body = JSON.stringify({
    event,
    payload,
    ts: Date.now(),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(url, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  } catch {
    // Fire-and-forget — never block UI for telemetry.
  }
}

/** Local-first aggregate telemetry. No third-party scripts; beacon is opt-in via env. */
export function track(event: AnalyticsEvent, payload: TrackPayload): void {
  if (!isAnalyticsEnabled()) return;

  const stats = applyEvent(readStats(), event, payload);
  writeStats(stats);
  notifyStatsUpdated();
  postToBeacon(event, payload);
}

export function trackProjectLaunch(projectId: number, source?: ProjectLaunchSource): void {
  track('project_launch', { projectId, source });
}

export function trackFilterUse(filter: string, action: 'add' | 'remove' | 'clear'): void {
  track('filter_use', { filter, action });
}

export function trackDisplayMode(mode: DisplayMode): void {
  track('display_mode', { mode });
}
