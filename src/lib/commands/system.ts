import projectData from '../../data/projectData';
import { TAG_TO_CATEGORIES } from '../../constants';
import soundSystem from '../SoundSystem';
import { deriveTransmissions } from '../transmissions';
import type { PerformanceMode } from '../../types';
import type { CommandContext, CommandDefinition } from '../commandTypes';
import { missingArg } from './shared';

const perfLabel = (mode: PerformanceMode | string) =>
  ({ auto: 'AUTO', full: 'FULL', balanced: 'BALANCED', lite: 'LITE', random: 'RANDOM' } as const)[mode as PerformanceMode]
  ?? String(mode).toUpperCase();

const PERF_MODE_ICONS: Record<PerformanceMode, string> = {
  auto: '⚡',
  full: '🚀',
  balanced: '⚖️',
  lite: '🪶',
  random: '🎲',
};

export const PERF_MODES: PerformanceMode[] = ['auto', 'full', 'balanced', 'lite', 'random'];

function buildStats(ctx: CommandContext): string {
  const totalProjects = projectData.length;
  const favCount = ctx.favorites.length;
  let statsStr = 'SYSTEM DIAGNOSTICS\n';
  statsStr += '------------------\n';
  statsStr += `TOTAL PROJECTS : ${totalProjects}\n`;
  statsStr += `FAVORITES      : ${favCount}\n`;
  statsStr += `PERF PRESET    : ${perfLabel(ctx.performanceMode)}\n`;
  statsStr += `PERF ACTIVE    : ${perfLabel(ctx.effectiveMode)}\n\n`;
  statsStr += 'CATEGORY DISTRIBUTION:\n';

  const catCounts: Record<string, number> = {};
  projectData.forEach((p) => {
    const cats = new Set<string>();
    p.tags.forEach((t) => {
      TAG_TO_CATEGORIES[t]?.forEach((c) => cats.add(c));
    });
    cats.forEach((c) => {
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
  });

  Object.entries(catCounts).forEach(([cat, count]) => {
    const barLen = Math.round((count / totalProjects) * 20);
    const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
    statsStr += `[${bar}] ${cat.padEnd(15)} (${count})\n`;
  });

  return statsStr;
}

export const helpCommand: CommandDefinition = {
  name: 'help',
  aliases: ['?'],
  help: 'Display available commands or detailed help for one command.',
  usage: 'help [command]',
  run() {
    return null;
  },
};

export const lsCommand: CommandDefinition = {
  name: 'ls',
  help: 'List projects matching the current search query.',
  usage: 'ls',
  run(ctx) {
    if (ctx.projectsMatchingQuery.length === 0) {
      return { type: 'system', text: 'NO ACTIVE INSTANCES DETECTED.' };
    }
    return {
      type: 'system',
      text: ctx.projectsMatchingQuery
        .map((p) => `[${p.id.toString().padStart(4, '0')}] ${p.title}`)
        .join('\n'),
    };
  },
};

export const transmissionsCommand: CommandDefinition = {
  name: 'transmissions',
  aliases: ['news', 'updates', 'patchnotes'],
  help: 'List latest transmissions and project patch notes.',
  usage: 'transmissions',
  omni: [
    {
      id: 'transmissions-latest',
      label: 'Transmissions: View Latest Patch Notes',
      icon: '📡',
      keywords: ['transmissions', 'news', 'updates', 'changelog', 'patch'],
      action: (c: CommandContext) => {
        const list = deriveTransmissions(projectData);
        if (list.length > 0) {
          c.handleProjectSelect(list[0].project);
        }
      },
    },
  ],
  run() {
    const list = deriveTransmissions(projectData);
    if (list.length === 0) {
      return { type: 'system', text: 'NO_ACTIVE_TRANSMISSIONS_DETECTED.' };
    }
    return {
      type: 'system',
      text: list
        .map((t) => `[${t.formattedDate}] ${t.project.title.toUpperCase()}: ${t.summary}`)
        .join('\n\n'),
    };
  },
};

export const openCommand: CommandDefinition = {
  name: 'open',
  args: [{ name: 'id', description: 'Project id', required: true }],
  help: 'Open project quick view by catalog id.',
  usage: 'open <id>',
  run(ctx, args) {
    if (args.length === 0) return missingArg('open <id>');
    const idToOpen = parseInt(args[0], 10);
    const project = projectData.find((p) => p.id === idToOpen);
    if (!project) {
      return { type: 'error', text: `ERR: Instance ID ${args[0]} not found in database.` };
    }
    ctx.handleProjectSelect(project);
    return {
      type: 'success',
      text: `> INITIALIZING_VIEW: [${project.title.toUpperCase()}]`,
      closeTerminal: true,
    };
  },
};

export const perfCommand: CommandDefinition = {
  name: 'perf',
  aliases: ['performance'],
  args: [{ name: 'mode', description: 'Performance preset', required: false, values: [...PERF_MODES] }],
  help: 'Set or inspect performance mode preset.',
  usage: 'perf [auto|full|balanced|lite|random]',
  omni: PERF_MODES.map((mode) => ({
    id: `perf-${mode}`,
    label: (c: CommandContext) => {
      const active = c.performanceMode === mode ? ' ✓' : '';
      const forced = mode === 'lite' && c.effectiveMode === 'lite' && c.performanceMode !== 'lite' ? ' (active)' : '';
      return `Performance: ${mode.charAt(0).toUpperCase()}${mode.slice(1)}${active}${forced}`;
    },
    icon: PERF_MODE_ICONS[mode],
    keywords: ['perf', 'performance', mode],
    isActive: (c: CommandContext) => c.performanceMode === mode,
    action: (c: CommandContext) => c.setPerformanceMode(mode),
  })),
  run(ctx, args) {
    if (args.length === 0) {
      return {
        type: 'system',
        text: `> PERF_MODE: ${perfLabel(ctx.performanceMode)} (active: ${perfLabel(ctx.effectiveMode)})\nUsage: perf <auto|full|balanced|lite|random>`,
      };
    }
    const modeParam = args[0].toLowerCase() as PerformanceMode;
    if (!PERF_MODES.includes(modeParam)) {
      return { type: 'error', text: `ERR: Invalid mode '${modeParam}'. Use auto, full, balanced, lite, or random.` };
    }
    ctx.setPerformanceMode(modeParam);
    ctx.addActivityLog(`PERF MODE SET: ${modeParam.toUpperCase()}`);
    return { type: 'success', text: `> PERFORMANCE_GATE: ${modeParam.toUpperCase()}` };
  },
};

export const rerollCommand: CommandDefinition = {
  name: 'reroll',
  aliases: ['fx-reroll'],
  help: 'Re-roll the random performance mode\'s active effect subset.',
  usage: 'reroll',
  omni: {
    id: 'perf-reroll',
    label: (c: CommandContext) => c.effectiveMode === 'random' ? 'Reroll Random Effects 🎲' : 'Reroll Random Effects (switches to Random) 🎲',
    icon: '🎲',
    keywords: ['perf', 'performance', 'random', 'reroll', 'fx', 'dice'],
    isActive: (c: CommandContext) => c.performanceMode === 'random',
    action: (c: CommandContext) => c.rerollPerformance(),
  },
  run(ctx) {
    ctx.rerollPerformance();
    ctx.addActivityLog('PERF FX REROLLED');
    if (ctx.effectiveMode === 'lite' && ctx.performanceMode !== 'lite') {
      return {
        type: 'warning',
        text: '> FX_REROLL: new combination rolled, but LITE is still forced (reduced motion).',
      };
    }
    return { type: 'success', text: '> FX_REROLL: new random effect combination engaged.' };
  },
};

export const holoCommand: CommandDefinition = {
  name: 'holo',
  help: 'Toggle the holo-terminal panel.',
  usage: 'holo',
  omni: {
    id: 'toggle-holoterminal',
    label: (c: CommandContext) => `Holo Terminal: ${c.isHoloTerminalOpen ? 'Close' : 'Open'}`,
    icon: '💻',
    keywords: ['holo', 'terminal'],
    action: (c: CommandContext) => c.setIsHoloTerminalOpen((prev) => !prev),
  },
  run(ctx) {
    const next = !ctx.isHoloTerminalOpen;
    ctx.setIsHoloTerminalOpen(next);
    return { type: 'system', text: `> HOLO_TERMINAL ${next ? 'ENGAGED' : 'DISENGAGED'}` };
  },
};

export const statsCommand: CommandDefinition = {
  name: 'stats',
  help: 'Print system diagnostics and category distribution.',
  usage: 'stats',
  run(ctx) {
    return { type: 'system', text: buildStats(ctx) };
  },
};

export const clearCommand: CommandDefinition = {
  name: 'clear',
  aliases: ['cls'],
  help: 'Flush terminal output buffer.',
  usage: 'clear',
  run() {
    return { type: 'system', text: '', clearHistory: true, skipActivityLog: true };
  },
};

export const lockdownCommand: CommandDefinition = {
  name: 'lockdown',
  help: 'Engage system lockdown protocol.',
  usage: 'lockdown',
  omni: {
    id: 'toggle-lockdown',
    label: (c: CommandContext) => (c.isLockdown ? 'Override Lockdown' : 'Engage Lockdown'),
    icon: '🔒',
    keywords: ['lockdown', 'unlock', 'override'],
    action: (c: CommandContext) => {
      if (c.isLockdown) {
        c.setIsLockdown(false);
        soundSystem.playSuccess();
        soundSystem.speak('Lockdown overridden. System restored.');
        c.addActivityLog('SYSTEM ALERT: LOCKDOWN OVERRIDDEN');
      } else {
        c.setIsLockdown(true);
        soundSystem.playAlarm();
        soundSystem.speak('Warning. System lockdown protocol engaged. Access denied.');
        c.addActivityLog('SYSTEM ALERT: LOCKDOWN PROTOCOL');
      }
    },
  },
  run(ctx) {
    ctx.setIsLockdown(true);
    soundSystem.playAlarm();
    soundSystem.speak('Warning. System lockdown protocol engaged. Access denied.');
    ctx.addActivityLog('SYSTEM ALERT: LOCKDOWN PROTOCOL');
    return { type: 'error', text: '> CRITICAL: SYSTEM LOCKDOWN PROTOCOL ENGAGED' };
  },
};

export const unlockCommand: CommandDefinition = {
  name: 'unlock',
  aliases: ['override'],
  help: 'Override an active lockdown.',
  usage: 'unlock',
  run(ctx) {
    ctx.setIsLockdown(false);
    soundSystem.playSuccess();
    soundSystem.speak('Lockdown overridden. System restored.');
    ctx.addActivityLog('SYSTEM ALERT: LOCKDOWN OVERRIDDEN');
    return { type: 'success', text: '> LOCKDOWN OVERRIDDEN. SYSTEM RESTORED' };
  },
};

export const alertCommand: CommandDefinition = {
  name: 'alert',
  help: 'Trigger a system alert sound.',
  usage: 'alert',
  run() {
    soundSystem.playAlert();
    return { type: 'warning', text: '> SYSTEM ALERT TRIGGERED' };
  },
};

export const exitCommand: CommandDefinition = {
  name: 'exit',
  aliases: ['close', 'quit'],
  help: 'Close the terminal session.',
  usage: 'exit',
  run() {
    return { type: 'system', text: '', closeTerminal: true, skipActivityLog: true };
  },
};
