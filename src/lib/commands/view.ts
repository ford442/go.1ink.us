import type { DisplayMode, SortOption } from '../../types';
import type { CommandContext, CommandDefinition } from '../commandTypes';
import { missingArg } from './shared';

export const VIEWS: DisplayMode[] = ['dense', 'grid', 'matrix', 'list', 'map', 'constellation'];
export const SORT_MAP: Record<string, SortOption> = {
  featured: 'Featured',
  newest: 'Newest',
  'a-z': 'A-Z',
  random: 'Random',
  complex: 'Most Complex',
};

export const sortCommand: CommandDefinition = {
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
};

export const viewCommand: CommandDefinition = {
  name: 'view',
  args: [{ name: 'mode', description: 'Layout mode', required: true, values: [...VIEWS] }],
  help: 'Switch display layout protocol.',
  usage: 'view <dense|grid|matrix|list|map|constellation>',
  omni: VIEWS.filter((v) => v !== 'list').map((view) => ({
    id: `view-${view}`,
    label: view === 'dense'
      ? 'View: Dense Grid'
      : view === 'map'
        ? 'View: Neural Map'
        : view === 'constellation'
          ? 'View: Constellation'
          : `View: ${view.charAt(0).toUpperCase()}${view.slice(1)}`,
    icon: view === 'dense' ? '▦' : view === 'grid' ? '🔲' : view === 'matrix' ? '☰' : view === 'constellation' ? '✦' : '🌌',
    keywords: ['view', view],
    action: (c: CommandContext) => c.handleDisplayModeChange(view),
  })),
  run(ctx, args) {
    if (args.length === 0) return missingArg('view <dense|grid|matrix|list|map|constellation>');
    const viewParam = args[0].toLowerCase() as DisplayMode;
    if (!VIEWS.includes(viewParam)) {
      return { type: 'error', text: `ERR: Unknown display protocol '${args[0]}'` };
    }
    ctx.handleDisplayModeChange(viewParam);
    return { type: 'success', text: `> DISPLAY_PROTOCOL_UPDATED: [${viewParam.toUpperCase()}]` };
  },
};

export const denseCommand: CommandDefinition = {
  name: 'dense',
  aliases: ['compact'],
  help: 'Quick switch to Dense Grid catalog view.',
  usage: 'dense',
  run(ctx) {
    ctx.handleDisplayModeChange('dense');
    return { type: 'success', text: '> DISPLAY_PROTOCOL_UPDATED: [DENSE]' };
  },
};

export const mapCommand: CommandDefinition = {
  name: 'map',
  aliases: ['graph'],
  help: 'Quick switch to Neural Map view.',
  usage: 'map',
  run(ctx) {
    ctx.handleDisplayModeChange('map');
    return { type: 'success', text: '> DISPLAY_PROTOCOL_UPDATED: [MAP]' };
  },
};

export const constellationCommand: CommandDefinition = {
  name: 'constellation',
  aliases: ['stars', '3d'],
  help: 'Quick switch to 3D Constellation view.',
  usage: 'constellation',
  run(ctx) {
    ctx.handleDisplayModeChange('constellation');
    return { type: 'success', text: '> DISPLAY_PROTOCOL_UPDATED: [CONSTELLATION]' };
  },
};
