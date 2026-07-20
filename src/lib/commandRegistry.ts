import projectData from '../data/projectData';
import { CATEGORIES, TAG_TO_CATEGORIES, CATEGORY_ICONS } from '../data/constants';
import soundSystem from './SoundSystem';
import {
  deleteLoadoutByName,
  exportLoadoutByName,
  findLoadoutByName,
  getLoadoutStore,
  listLoadoutsSummary,
  saveLoadoutFromFavorites,
} from './loadoutTerminal';
import type { DisplayMode, PerformanceMode, SortOption, ThemeId } from '../types';
import type {
  CommandContext,
  CommandDefinition,
  TerminalResult,
} from './commandTypes';

export type {
  CommandContext,
  CommandDefinition,
  CommandArgSpec,
  OmniItemSpec,
  TerminalResult,
  TerminalResponseType,
} from './commandTypes';

export {
  formatCommandHelp,
  formatRegistryHelp,
  listCommandNames,
  resolveCommand,
} from './commandParserUtils';

const perfLabel = (mode: PerformanceMode | string) =>
  ({ auto: 'AUTO', full: 'FULL', balanced: 'BALANCED', lite: 'LITE' } as const)[mode as PerformanceMode]
  ?? String(mode).toUpperCase();

const ON_OFF = ['on', 'off'] as const;
const THEMES: ThemeId[] = ['cyan', 'purple', 'emerald', 'gold'];
const VIEWS: DisplayMode[] = ['grid', 'matrix', 'list', 'map', 'constellation'];
const PERF_MODES: PerformanceMode[] = ['auto', 'full', 'balanced', 'lite'];
const SORT_MAP: Record<string, SortOption> = {
  featured: 'Featured',
  newest: 'Newest',
  'a-z': 'A-Z',
  random: 'Random',
  complex: 'Most Complex',
};

function filterValues(): string[] {
  return ['all', 'favorites', ...Object.keys(CATEGORIES).map((c) => c.toLowerCase())];
}

function matchFilter(filterParam: string): string | null {
  if (filterParam.toLowerCase() === 'all') return 'All';
  if (filterParam.toLowerCase() === 'favorites') return 'Favorites';
  if (CATEGORIES[filterParam as keyof typeof CATEGORIES]) return filterParam;

  const allValidFilters: string[] = ['All', 'Favorites', ...Object.keys(CATEGORIES)];
  Object.values(CATEGORIES).forEach((tags) => allValidFilters.push(...tags));
  return allValidFilters.find((f) => f.toLowerCase() === filterParam.toLowerCase()) ?? null;
}

function onOffResult(
  stateParam: string,
  onEnable: () => void,
  onDisable: () => void,
  onlineLabel: string,
  offlineLabel: string,
): TerminalResult {
  if (stateParam === 'on') {
    onEnable();
    return { type: 'success', text: onlineLabel };
  }
  if (stateParam === 'off') {
    onDisable();
    return { type: 'success', text: offlineLabel };
  }
  return { type: 'error', text: `ERR: Invalid state '${stateParam}'. Use 'on' or 'off'.` };
}

function missingArg(usage: string): TerminalResult {
  return { type: 'error', text: `ERR: Missing parameter. Usage: ${usage}` };
}

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

/** Single source of operator commands for terminal + Omni palette. */
export function createCommandRegistry(_ctx: CommandContext): CommandDefinition[] {
  return [
    {
      name: 'help',
      aliases: ['?'],
      help: 'Display available commands or detailed help for one command.',
      usage: 'help [command]',
      run() {
        return null;
      },
    },
    {
      name: 'filter',
      args: [{ name: 'target', description: 'Category, tag, all, or favorites', required: true, values: filterValues }],
      help: 'Toggle a catalog filter.',
      usage: 'filter <category|tag|all|favorites>',
      omni: [
        ...Object.keys(CATEGORIES).map((cat) => ({
          id: `filter-${cat}`,
          label: `Filter: ${cat}`,
          icon: CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] ?? '📁',
          keywords: ['filter', cat.toLowerCase()],
          isActive: (c: CommandContext) => c.activeFilters.includes(cat),
          action: (c: CommandContext) => c.toggleFilter(cat),
        })),
        {
          id: 'filter-favorites',
          label: 'Filter: Favorites',
          icon: '💖',
          keywords: ['filter', 'favorites'],
          isActive: (c: CommandContext) => c.activeFilters.includes('Favorites'),
          action: (c: CommandContext) => c.toggleFilter('Favorites'),
        },
        {
          id: 'filter-all',
          label: 'Clear All Filters',
          icon: '🧹',
          keywords: ['filter', 'clear', 'all'],
          action: (c: CommandContext) => c.toggleFilter('All'),
        },
      ],
      run(ctx, args) {
        if (args.length === 0) return missingArg('filter <category|tag|all|favorites>');
        const matched = matchFilter(args.join(' '));
        if (!matched) {
          return { type: 'error', text: `ERR: Invalid filter target '${args.join(' ')}'` };
        }
        ctx.toggleFilter(matched);
        return { type: 'success', text: `> FILTER_PROTOCOL_TOGGLED: [${matched.toUpperCase()}]` };
      },
    },
    {
      name: 'sort',
      args: [{ name: 'algorithm', description: 'Sort order', required: true, values: Object.keys(SORT_MAP) }],
      help: 'Set project sort order.',
      usage: 'sort <featured|newest|a-z|random|complex>',
      omni: Object.entries(SORT_MAP).map(([key, label]) => ({
        id: `sort-${key}`,
        label: `Sort: ${label}`,
        icon: key === 'featured' ? '⭐' : key === 'random' ? '🎲' : key === 'complex' ? '🧠' : '✨',
        keywords: ['sort', key],
        action: (c: CommandContext) => {
          if (key === 'random') setTimeout(() => c.setRandomSeed(Math.random()), 0);
          c.setSortOption(label);
          c.setCurrentPage(1);
        },
      })),
      run(ctx, args) {
        if (args.length === 0) return missingArg('sort <featured|newest|a-z|random|complex>');
        const sortParam = args[0].toLowerCase();
        const mapped = SORT_MAP[sortParam];
        if (!mapped) {
          return { type: 'error', text: `ERR: Unknown sorting algorithm '${args[0]}'` };
        }
        if (sortParam === 'random') setTimeout(() => ctx.setRandomSeed(Math.random()), 0);
        ctx.setSortOption(mapped);
        ctx.setCurrentPage(1);
        return { type: 'success', text: `> SORT_MATRIX_UPDATED: [${mapped.toUpperCase()}]` };
      },
    },
    {
      name: 'view',
      args: [{ name: 'mode', description: 'Layout mode', required: true, values: [...VIEWS] }],
      help: 'Switch display layout protocol.',
      usage: 'view <grid|matrix|list|map|constellation>',
      omni: VIEWS.filter((v) => v !== 'list').map((view) => ({
        id: `view-${view}`,
        label: view === 'map'
          ? 'View: Neural Map'
          : view === 'constellation'
            ? 'View: Constellation'
            : `View: ${view.charAt(0).toUpperCase()}${view.slice(1)}`,
        icon: view === 'grid' ? '🔲' : view === 'matrix' ? '☰' : view === 'constellation' ? '✦' : '🌌',
        keywords: ['view', view],
        action: (c: CommandContext) => c.handleDisplayModeChange(view),
      })),
      run(ctx, args) {
        if (args.length === 0) return missingArg('view <grid|matrix|list|map|constellation>');
        const viewParam = args[0].toLowerCase() as DisplayMode;
        if (!VIEWS.includes(viewParam)) {
          return { type: 'error', text: `ERR: Unknown display protocol '${args[0]}'` };
        }
        ctx.handleDisplayModeChange(viewParam);
        return { type: 'success', text: `> DISPLAY_PROTOCOL_UPDATED: [${viewParam.toUpperCase()}]` };
      },
    },
    {
      name: 'map',
      aliases: ['graph'],
      help: 'Quick switch to Neural Map view.',
      usage: 'map',
      run(ctx) {
        ctx.handleDisplayModeChange('map');
        return { type: 'success', text: '> DISPLAY_PROTOCOL_UPDATED: [MAP]' };
      },
    },
    {
      name: 'constellation',
      aliases: ['stars', '3d'],
      help: 'Quick switch to 3D Constellation view.',
      usage: 'constellation',
      run(ctx) {
        ctx.handleDisplayModeChange('constellation');
        return { type: 'success', text: '> DISPLAY_PROTOCOL_UPDATED: [CONSTELLATION]' };
      },
    },
    {
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
    },
    {
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
    },
    {
      name: 'fav',
      args: [{ name: 'id', description: 'Project id', required: true }],
      help: 'Toggle favorite status for a project id.',
      usage: 'fav <id>',
      run(ctx, args) {
        if (args.length === 0) return missingArg('fav <id>');
        const idToFav = parseInt(args[0], 10);
        const project = projectData.find((p) => p.id === idToFav);
        if (!project) {
          return { type: 'error', text: `ERR: Instance ID ${args[0]} not found in database.` };
        }
        ctx.toggleFavorite(project);
        return { type: 'success', text: `> FAVORITE_STATUS_TOGGLED: [${project.title.toUpperCase()}]` };
      },
    },
    {
      name: 'theme',
      args: [{ name: 'palette', description: 'Theme id', required: true, values: [...THEMES] }],
      help: 'Change dashboard accent theme.',
      usage: 'theme <cyan|purple|emerald|gold>',
      omni: THEMES.map((theme) => ({
        id: `theme-${theme}`,
        label: `Set Theme: ${theme.charAt(0).toUpperCase()}${theme.slice(1)}`,
        icon: '🎨',
        keywords: ['theme', theme],
        action: (c: CommandContext) => c.changeTheme(theme),
      })),
      run(ctx, args) {
        if (args.length === 0) return missingArg('theme <cyan|purple|emerald|gold>');
        const theme = args[0].toLowerCase() as ThemeId;
        if (!THEMES.includes(theme)) {
          return { type: 'error', text: `ERR: Unsupported color matrix '${args[0]}'` };
        }
        ctx.changeTheme(theme);
        return { type: 'success', text: '> COLOR_PROTOCOL_UPDATED' };
      },
    },
    {
      name: 'sound',
      args: [{ name: 'state', description: 'on or off', required: true, values: [...ON_OFF] }],
      help: 'Toggle UI audio feedback.',
      usage: 'sound <on|off>',
      omni: {
        id: 'toggle-sound',
        label: (c: CommandContext) => `Audio: ${c.isSoundEnabled ? 'Disable' : 'Enable'}`,
        icon: '🔊',
        keywords: ['sound', 'audio'],
        action: (c: CommandContext) => c.setIsSoundEnabled(!c.isSoundEnabled),
      },
      run(ctx, args) {
        if (args.length === 0) return missingArg('sound <on|off>');
        return onOffResult(
          args[0].toLowerCase(),
          () => ctx.setIsSoundEnabled(true),
          () => ctx.setIsSoundEnabled(false),
          '> AUDIO_FEEDBACK_SYSTEM: ONLINE',
          '> AUDIO_FEEDBACK_SYSTEM: OFFLINE',
        );
      },
    },
    {
      name: 'crt',
      args: [{ name: 'state', description: 'on or off', required: true, values: [...ON_OFF] }],
      help: 'Toggle CRT retro scanline effect.',
      usage: 'crt <on|off>',
      omni: {
        id: 'toggle-crt',
        label: (c: CommandContext) => `CRT Effect: ${c.isCrtEnabled ? 'Disable' : 'Enable'}`,
        icon: '📺',
        keywords: ['crt'],
        action: (c: CommandContext) => c.setIsCrtEnabled(!c.isCrtEnabled),
      },
      run(ctx, args) {
        if (args.length === 0) return missingArg('crt <on|off>');
        return onOffResult(
          args[0].toLowerCase(),
          () => ctx.setIsCrtEnabled(true),
          () => ctx.setIsCrtEnabled(false),
          '> CRT_EFFECT_SYSTEM: ONLINE',
          '> CRT_EFFECT_SYSTEM: OFFLINE',
        );
      },
    },
    {
      name: 'matrix',
      args: [{ name: 'state', description: 'on or off', required: true, values: [...ON_OFF] }],
      help: 'Toggle Matrix rain background.',
      usage: 'matrix <on|off>',
      omni: {
        id: 'toggle-matrix',
        label: (c: CommandContext) => `Matrix Mode: ${c.isMatrixMode ? 'Disable' : 'Enable'}`,
        icon: '🌧️',
        keywords: ['matrix', 'rain'],
        action: (c: CommandContext) => c.setIsMatrixMode(!c.isMatrixMode),
      },
      run(ctx, args) {
        if (args.length === 0) return missingArg('matrix <on|off>');
        const stateParam = args[0].toLowerCase();
        if (stateParam === 'on') {
          ctx.setIsMatrixMode(true);
          return { type: 'system', text: '> SYSTEM_VISUALS: MATRIX_PROTOCOL_ENGAGED' };
        }
        if (stateParam === 'off') {
          ctx.setIsMatrixMode(false);
          return { type: 'system', text: '> SYSTEM_VISUALS: MATRIX_PROTOCOL_DISENGAGED' };
        }
        return { type: 'error', text: `ERR: Invalid state '${stateParam}'. Use 'on' or 'off'.` };
      },
    },
    {
      name: 'perf',
      aliases: ['performance'],
      args: [{ name: 'mode', description: 'Performance preset', required: false, values: [...PERF_MODES] }],
      help: 'Set or inspect performance mode preset.',
      usage: 'perf [auto|full|balanced|lite]',
      omni: PERF_MODES.map((mode) => ({
        id: `perf-${mode}`,
        label: (c: CommandContext) => {
          const active = c.performanceMode === mode ? ' ✓' : '';
          const forced = mode === 'lite' && c.effectiveMode === 'lite' && c.performanceMode !== 'lite' ? ' (active)' : '';
          return `Performance: ${mode.charAt(0).toUpperCase()}${mode.slice(1)}${active}${forced}`;
        },
        icon: mode === 'auto' ? '⚡' : mode === 'full' ? '🚀' : mode === 'balanced' ? '⚖️' : '🪶',
        keywords: ['perf', 'performance', mode],
        isActive: (c: CommandContext) => c.performanceMode === mode,
        action: (c: CommandContext) => c.setPerformanceMode(mode),
      })),
      run(ctx, args) {
        if (args.length === 0) {
          return {
            type: 'system',
            text: `> PERF_MODE: ${perfLabel(ctx.performanceMode)} (active: ${perfLabel(ctx.effectiveMode)})\nUsage: perf <auto|full|balanced|lite>`,
          };
        }
        const modeParam = args[0].toLowerCase() as PerformanceMode;
        if (!PERF_MODES.includes(modeParam)) {
          return { type: 'error', text: `ERR: Invalid mode '${modeParam}'. Use auto, full, balanced, or lite.` };
        }
        ctx.setPerformanceMode(modeParam);
        ctx.addActivityLog(`PERF MODE SET: ${modeParam.toUpperCase()}`);
        return { type: 'success', text: `> PERFORMANCE_GATE: ${modeParam.toUpperCase()}` };
      },
    },
    {
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
    },
    {
      name: 'stats',
      help: 'Print system diagnostics and category distribution.',
      usage: 'stats',
      run(ctx) {
        return { type: 'system', text: buildStats(ctx) };
      },
    },
    {
      name: 'clear',
      aliases: ['cls'],
      help: 'Flush terminal output buffer.',
      usage: 'clear',
      run() {
        return { type: 'system', text: '', clearHistory: true, skipActivityLog: true };
      },
    },
    {
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
    },
    {
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
    },
    {
      name: 'alert',
      help: 'Trigger a system alert sound.',
      usage: 'alert',
      run() {
        soundSystem.playAlert();
        return { type: 'warning', text: '> SYSTEM ALERT TRIGGERED' };
      },
    },
    {
      name: 'loadout',
      aliases: ['pack'],
      args: [{ name: 'action', description: 'list|save|apply|share|export|delete', required: true }],
      help: 'Manage operator loadouts (named project collections).',
      usage: 'loadout <list|save|apply|share|export|delete> [name]',
      run(ctx, args) {
        if (args.length === 0) return missingArg('loadout <list|save|apply|share|export|delete> [name]');
        const action = args[0].toLowerCase();
        const nameArg = args.slice(1).join(' ').trim();

        if (action === 'list') {
          const { loadouts } = getLoadoutStore();
          return {
            type: 'system',
            text: `OPERATOR LOADOUTS (${loadouts.length})\n------------------\n${listLoadoutsSummary()}`,
          };
        }

        if (action === 'save') {
          if (!nameArg) return missingArg('loadout save <name>');
          const saved = saveLoadoutFromFavorites(nameArg, ctx.favorites);
          if (!saved) {
            return { type: 'error', text: 'ERR: Favorites list is empty.' };
          }
          ctx.addActivityLog(`LOADOUT SAVED: [${nameArg.toUpperCase()}]`);
          return { type: 'success', text: `> LOADOUT_SAVED: [${nameArg.toUpperCase()}]` };
        }

        if (action === 'apply') {
          if (!nameArg) return missingArg('loadout apply <name>');
          const match = findLoadoutByName(nameArg);
          if (!match) {
            return { type: 'error', text: `ERR: Loadout '${nameArg}' not found.` };
          }
          ctx.replaceFavorites(match.ids, match.name);
          ctx.setActiveFilters(['Favorites']);
          ctx.setCurrentPage(1);
          ctx.addActivityLog(`LOADOUT APPLIED: [${match.name.toUpperCase()}]`);
          return { type: 'success', text: `> LOADOUT_APPLIED: [${nameArg.toUpperCase()}]` };
        }

        if (action === 'share') {
          if (!nameArg) return missingArg('loadout share <name>');
          const match = findLoadoutByName(nameArg);
          if (!match) {
            return { type: 'error', text: `ERR: Loadout '${nameArg}' not found.` };
          }
          void import('./loadoutCodec').then(async ({ encodePackParamCompressed }) => {
            const pack = await encodePackParamCompressed({ version: 1, name: match.name, ids: match.ids });
            const url = `${window.location.origin}${window.location.pathname}?pack=${pack}`;
            await navigator.clipboard?.writeText(url);
          });
          return { type: 'success', text: '> LOADOUT_SHARE_LINK_COPIED' };
        }

        if (action === 'export') {
          if (!nameArg) return missingArg('loadout export <name>');
          const json = exportLoadoutByName(nameArg);
          if (!json) {
            return { type: 'error', text: `ERR: Loadout '${nameArg}' not found.` };
          }
          return { type: 'system', text: json };
        }

        if (action === 'delete') {
          if (!nameArg) return missingArg('loadout delete <name>');
          if (!deleteLoadoutByName(nameArg)) {
            return { type: 'error', text: `ERR: Loadout '${nameArg}' not found.` };
          }
          return { type: 'success', text: `> LOADOUT_DELETED: [${nameArg.toUpperCase()}]` };
        }

        return { type: 'error', text: `ERR: Unknown loadout action '${action}'.` };
      },
    },
    {
      name: 'exit',
      aliases: ['close', 'quit'],
      help: 'Close the terminal session.',
      usage: 'exit',
      run() {
        return { type: 'system', text: '', closeTerminal: true, skipActivityLog: true };
      },
    },
  ];
}


export function buildOmniProtocolItems(ctx: CommandContext, registry: CommandDefinition[]) {
  const items: Array<{
    id: string;
    type: 'protocol' | 'filter';
    label: string;
    action: () => void;
    icon: string;
    keywords: string[];
    isActive?: boolean;
  }> = [];

  for (const cmd of registry) {
    if (!cmd.omni) continue;
    const specs = Array.isArray(cmd.omni) ? cmd.omni : [cmd.omni];
    const itemType = cmd.name === 'filter' ? 'filter' as const : 'protocol' as const;

    for (const spec of specs) {
      items.push({
        id: spec.id,
        type: itemType,
        label: typeof spec.label === 'function' ? spec.label(ctx) : spec.label,
        icon: spec.icon,
        keywords: spec.keywords ?? [cmd.name, ...(cmd.aliases ?? [])],
        isActive: spec.isActive?.(ctx),
        action: () => spec.action(ctx),
      });
    }
  }

  return items;
}

export { SORT_MAP, THEMES, VIEWS, PERF_MODES, ON_OFF, filterValues };
