import type { DisplayMode } from '../types';
import type { AnalyticsEvent, ProjectLaunchSource } from './analytics';

type TrackPayload =
  | { projectId: number; source?: ProjectLaunchSource }
  | { filter: string; action: 'add' | 'remove' | 'clear' }
  | { mode: DisplayMode };

function deferTrack(event: AnalyticsEvent, payload: TrackPayload): void {
  void import('./analytics').then(({ track }) => track(event, payload));
}

export function trackProjectLaunch(projectId: number, source?: ProjectLaunchSource): void {
  deferTrack('project_launch', { projectId, source });
}

export function trackFilterUse(filter: string, action: 'add' | 'remove' | 'clear'): void {
  deferTrack('filter_use', { filter, action });
}

export function trackDisplayMode(mode: DisplayMode): void {
  deferTrack('display_mode', { mode });
}
