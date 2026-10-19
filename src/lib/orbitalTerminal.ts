// Bodies of the `station` / `passes` / `horizon` terminal commands. Loaded
// with import() from lib/commands/orbital.ts so none of this — nor the
// propagator/pass half of src/ground/ it pulls in via orbitalOps.ts — sits
// in the entry chunk.
import projectData from '../data/projectData';
import { PRESET_STATIONS, formatCoordinates, stationFrame, type GroundStation } from '../ground/GroundStation';
import {
  findTrack,
  formatHorizonReport,
  formatPassesReport,
  lookAngleRows,
  predictTrackPasses,
  projectsToTracks,
} from './orbitalOps';
import type { CommandContext, TerminalResult } from './commandTypes';

export function findPresetStation(query: string): GroundStation | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  return PRESET_STATIONS.find((station) => station.id === needle)
    ?? PRESET_STATIONS.find((station) => station.name.toLowerCase().startsWith(needle))
    ?? PRESET_STATIONS.find((station) => station.id.startsWith(needle.replace(/\s+/g, '-')))
    ?? null;
}

function describeStation(station: GroundStation): string {
  return [
    `STATION: ${station.name.toUpperCase()} [${station.source.toUpperCase()}]`,
    `POS: ${formatCoordinates(station.latitudeDeg, station.longitudeDeg)} · ALT ${Math.round(station.altitudeM)} m`,
    `MIN_EL: ${station.minElevationDeg}°`,
  ].join('\n');
}

export async function runStation(ctx: CommandContext, args: string[]): Promise<TerminalResult> {
  if (args.length === 0) return { type: 'system', text: describeStation(ctx.groundStation) };

  const query = args.join(' ');
  const keyword = query.toLowerCase();

  if (keyword === 'list') {
    const rows = PRESET_STATIONS.map((station) => {
      const marker = station.id === ctx.groundStation.id ? '*' : ' ';
      return `${marker} ${station.id.padEnd(14)} ${station.name}`;
    });
    return { type: 'system', text: ['PRESET STATIONS', '---------------', ...rows].join('\n') };
  }

  if (keyword === 'locate' || keyword === 'gps' || keyword === 'here') {
    // Typing the command and pressing Enter is the user gesture; the browser
    // still shows its own permission prompt. A refusal resolves to null and
    // leaves the current station untouched.
    const station = await ctx.requestGeolocation();
    if (!station) {
      return {
        type: 'warning',
        text: `> POSITION FIX DENIED OR UNAVAILABLE — station unchanged (${ctx.groundStation.name})`,
      };
    }
    return { type: 'success', text: `> STATION LOCKED\n${describeStation(station)}` };
  }

  const preset = findPresetStation(query);
  if (!preset) {
    return { type: 'error', text: `ERR: Unknown station '${query}'. Try 'station list'.` };
  }
  ctx.setGroundStation(preset);
  return { type: 'success', text: `> STATION SET\n${describeStation(preset)}` };
}

export async function runPasses(ctx: CommandContext, args: string[]): Promise<TerminalResult> {
  const station = ctx.groundStation;
  const query = args.join(' ');
  const tracks = projectsToTracks(projectData);
  let selected = tracks;
  if (query) {
    const track = findTrack(tracks, query);
    if (!track) {
      const names = tracks.map((t) => `${t.projectId}:${t.title}`).join(', ');
      return { type: 'error', text: `ERR: '${query}' has no orbit. Tracked: ${names || 'none'}` };
    }
    selected = [track];
  }
  const now = Date.now();
  const rows = predictTrackPasses(stationFrame(station), selected, now, {
    maxRows: query ? 5 : 8,
    maxPerTrack: query ? 5 : 3,
  });
  return { type: 'system', text: formatPassesReport(station, rows, now) };
}

export async function runHorizon(ctx: CommandContext): Promise<TerminalResult> {
  const station = ctx.groundStation;
  const rows = lookAngleRows(stationFrame(station), projectsToTracks(projectData), Date.now());
  return { type: 'system', text: formatHorizonReport(station, rows) };
}
