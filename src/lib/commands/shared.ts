import type { TerminalResult } from '../commandTypes';

export function onOffResult(
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

export function missingArg(usage: string): TerminalResult {
  return { type: 'error', text: `ERR: Missing parameter. Usage: ${usage}` };
}
