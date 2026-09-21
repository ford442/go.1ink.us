import projectData from '../../data/projectData';
import { CATEGORIES, CATEGORY_ICONS } from '../../constants';
import type { CommandContext, CommandDefinition } from '../commandTypes';
import { missingArg } from './shared';

export function filterValues(): string[] {
  return ['all', 'favorites', ...Object.keys(CATEGORIES).map((c) => c.toLowerCase())];
}

export function matchFilter(filterParam: string): string | null {
  if (filterParam.toLowerCase() === 'all') return 'All';
  if (filterParam.toLowerCase() === 'favorites') return 'Favorites';
  if (CATEGORIES[filterParam as keyof typeof CATEGORIES]) return filterParam;

  const allValidFilters: string[] = ['All', 'Favorites', ...Object.keys(CATEGORIES)];
  Object.values(CATEGORIES).forEach((tags) => allValidFilters.push(...tags));
  return allValidFilters.find((f) => f.toLowerCase() === filterParam.toLowerCase()) ?? null;
}

export const filterCommand: CommandDefinition = {
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
};

export const favCommand: CommandDefinition = {
  name: 'fav',
  args: [{ name: 'id', description: 'Project id', required: true }],
  help: 'Toggle favorite status for a project id.',
  usage: 'fav <id>',
  run(ctx, args) {
    if (args.length === 0) return missingArg('fav <id>');
    const idToFav = parseInt(args[0]!, 10);
    const project = projectData.find((p) => p.id === idToFav);
    if (!project) {
      return { type: 'error', text: `ERR: Instance ID ${args[0]} not found in database.` };
    }
    ctx.toggleFavorite(project);
    return { type: 'success', text: `> FAVORITE_STATUS_TOGGLED: [${project.title.toUpperCase()}]` };
  },
};
