// Orbital Ops terminal commands (`orbital`, `station`, `passes`, `horizon`).
//
// Like commands/missionControl.ts, this file lives in the always-bundled
// command registry, so it holds only the command definitions. Their bodies
// live in `../orbitalTerminal` (and through it `../orbitalOps` plus the
// propagator/pass half of src/ground/), loaded with import() on first use;
// results are printed through `ctx.appendTerminalOutput` once it resolves.
import { PRESET_STATIONS } from '../../ground/GroundStation';
import type { CommandContext, CommandDefinition, TerminalResult } from '../commandTypes';

type OrbitalTerminal = typeof import('../orbitalTerminal');

function runDeferred(
  ctx: CommandContext,
  label: string,
  task: (module: OrbitalTerminal) => Promise<TerminalResult>,
): TerminalResult {
  import('../orbitalTerminal')
    .then(task)
    .then(ctx.appendTerminalOutput, (error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      ctx.appendTerminalOutput({ type: 'error', text: `ERR: ${label} failed (${reason})` });
    });
  return { type: 'system', text: `> ${label}...` };
}

export const orbitalCommand: CommandDefinition = {
  name: 'orbital',
  aliases: ['orbit', 'groundstation'],
  help: 'Toggle the Orbital Ops ground-station panel.',
  usage: 'orbital',
  omni: {
    id: 'toggle-orbital-ops',
    label: (c: CommandContext) => `Orbital Ops: ${c.isOrbitalOpsOpen ? 'Close' : 'Open'}`,
    icon: '📡',
    keywords: ['orbital', 'orbit', 'station', 'passes', 'satellite', 'ground', 'horizon'],
    action: (c: CommandContext) => c.setIsOrbitalOpsOpen((prev) => !prev),
  },
  run(ctx) {
    const next = !ctx.isOrbitalOpsOpen;
    ctx.setIsOrbitalOpsOpen(next);
    return { type: 'system', text: `> ORBITAL_OPS ${next ? 'ENGAGED' : 'DISENGAGED'}` };
  },
};

export const stationCommand: CommandDefinition = {
  name: 'station',
  help: 'Show or set the ground station (preset city, `list`, or `locate` for opt-in geolocation).',
  usage: 'station [list|locate|<preset>]',
  args: [{
    name: 'preset',
    description: 'Preset station id, `list`, or `locate`',
    values: ['list', 'locate', ...PRESET_STATIONS.map((station) => station.id)],
  }],
  run(ctx, args) {
    const label = args[0]?.toLowerCase() === 'locate'
      ? 'REQUESTING POSITION FIX (browser will ask permission)'
      : 'STATION UPLINK';
    return runDeferred(ctx, label, (module) => module.runStation(ctx, args));
  },
};

export const passesCommand: CommandDefinition = {
  name: 'passes',
  aliases: ['pass'],
  help: 'Predict the next passes over the ground station (optionally for one project id/title).',
  usage: 'passes [id|title]',
  run(ctx, args) {
    return runDeferred(ctx, 'COMPUTING PASS TABLE', (module) => module.runPasses(ctx, args));
  },
};

export const horizonCommand: CommandDefinition = {
  name: 'horizon',
  aliases: ['sky'],
  help: 'Show current elevation/azimuth of every tracked project from the ground station.',
  usage: 'horizon',
  run(ctx) {
    return runDeferred(ctx, 'SCANNING HORIZON', (module) => module.runHorizon(ctx));
  },
};
