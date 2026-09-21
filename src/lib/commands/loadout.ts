import type { CommandDefinition } from '../commandTypes';
import {
  deleteLoadoutByName,
  exportLoadoutByName,
  findLoadoutByName,
  getLoadoutStore,
  listLoadoutsSummary,
  saveLoadoutFromFavorites,
} from '../loadoutTerminal';
import { missingArg } from './shared';

export const loadoutCommand: CommandDefinition = {
  name: 'loadout',
  aliases: ['pack'],
  args: [{ name: 'action', description: 'list|save|apply|share|export|delete', required: true }],
  help: 'Manage operator loadouts (named project collections).',
  usage: 'loadout <list|save|apply|share|export|delete> [name]',
  run(ctx, args) {
    if (args.length === 0) return missingArg('loadout <list|save|apply|share|export|delete> [name]');
    const action = args[0]!.toLowerCase();
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
      void import('../loadoutCodec').then(async ({ encodePackParamCompressed }) => {
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
};
