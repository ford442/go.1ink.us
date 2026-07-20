import type { ProjectStatus } from '../types';

export interface StatusDisplay {
  label: string;
  dotClass: string;
  textClass: string;
  borderClass: string;
}

export const PROJECT_STATUS_DISPLAY: Record<ProjectStatus, StatusDisplay> = {
  live: {
    label: 'LIVE',
    dotClass: 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
  },
  beta: {
    label: 'BETA',
    dotClass: 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  wip: {
    label: 'WIP',
    dotClass: 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
  },
  archived: {
    label: 'ARCHIVED',
    dotClass: 'bg-gray-400 shadow-[0_0_6px_rgba(156,163,175,0.6)]',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/30',
  },
};

export function getStatusDisplay(status: ProjectStatus): StatusDisplay {
  return PROJECT_STATUS_DISPLAY[status] ?? PROJECT_STATUS_DISPLAY.live;
}
