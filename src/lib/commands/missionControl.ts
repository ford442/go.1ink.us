// Deliberately does NOT import `../missionControl` (which pulls in
// analytics.ts) at module scope: this command lives in the always-bundled
// command registry (see commandRegistry.ts), so a static import here would
// drag operator-stats analytics into the entry chunk — the same reason
// trackEvent.ts dynamically imports analytics.ts instead of importing it
// directly. Health data comes from projectConnectivity.ts, which is already
// part of the entry bundle (CommandHeader/ActivityFeed use it eagerly), so
// reusing it here costs nothing extra. The full launch/transmission history
// lives in the lazy-loaded MissionControlPanel this command also opens.
import { getConnectivitySummary, getHealthSnapshot } from '../projectConnectivity';
import type { CommandContext, CommandDefinition } from '../commandTypes';

function buildOpsSummary(): string {
  const summary = getConnectivitySummary();
  const { generatedAt, source } = getHealthSnapshot();
  return [
    'MISSION CONTROL',
    '---------------',
    `NET: ${summary.live}/${summary.total} LIVE (${summary.degraded} DEGRADED, ${summary.unknown} UNKNOWN)`,
    `PROBE_STAMP: ${generatedAt.slice(0, 19).replace('T', ' ')}Z (${source})`,
    '',
    'Launch history and transmissions: see the Mission Control panel.',
  ].join('\n');
}

export const missionControlCommand: CommandDefinition = {
  name: 'ops',
  aliases: ['mission', 'mc'],
  help: 'Toggle the Mission Control dashboard and print health/launch summary.',
  usage: 'ops',
  omni: {
    id: 'toggle-mission-control',
    label: (c: CommandContext) => `Mission Control: ${c.isMissionControlOpen ? 'Close' : 'Open'}`,
    icon: '🛰️',
    keywords: ['mission', 'control', 'ops', 'dashboard', 'status', 'health'],
    action: (c: CommandContext) => c.setIsMissionControlOpen((prev) => !prev),
  },
  run(ctx) {
    const next = !ctx.isMissionControlOpen;
    ctx.setIsMissionControlOpen(next);
    if (!next) {
      return { type: 'system', text: '> MISSION_CONTROL DISENGAGED' };
    }
    return { type: 'system', text: `> MISSION_CONTROL ENGAGED\n\n${buildOpsSummary()}` };
  },
};
