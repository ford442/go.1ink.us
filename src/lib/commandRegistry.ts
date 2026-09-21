import type { CommandContext, CommandDefinition } from './commandTypes';

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

import { filterCommand, favCommand, filterValues } from './commands/filter';
import { sortCommand, viewCommand, denseCommand, mapCommand, constellationCommand, SORT_MAP, VIEWS } from './commands/view';
import { themeCommand, soundCommand, crtCommand, matrixCommand, THEMES, ON_OFF } from './commands/theme';
import { loadoutCommand } from './commands/loadout';
import { missionControlCommand } from './commands/missionControl';
import {
  helpCommand,
  lsCommand,
  transmissionsCommand,
  openCommand,
  perfCommand,
  rerollCommand,
  holoCommand,
  statsCommand,
  clearCommand,
  lockdownCommand,
  unlockCommand,
  alertCommand,
  exitCommand,
  PERF_MODES,
} from './commands/system';

/** Single source of operator commands for terminal + Omni palette. */
export function createCommandRegistry(_ctx: CommandContext): CommandDefinition[] {
  return [
    helpCommand,
    filterCommand,
    sortCommand,
    viewCommand,
    denseCommand,
    mapCommand,
    constellationCommand,
    lsCommand,
    transmissionsCommand,
    openCommand,
    favCommand,
    themeCommand,
    soundCommand,
    crtCommand,
    matrixCommand,
    perfCommand,
    rerollCommand,
    holoCommand,
    statsCommand,
    missionControlCommand,
    clearCommand,
    lockdownCommand,
    unlockCommand,
    alertCommand,
    loadoutCommand,
    exitCommand,
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
