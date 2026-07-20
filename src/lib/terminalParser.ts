import {
  formatCommandHelp,
  formatRegistryHelp,
  listCommandNames,
  resolveCommand,
} from './commandParserUtils';
import type { CommandContext, CommandDefinition, TerminalResult } from './commandTypes';

export interface ParsedCommandLine {
  command: string;
  args: string[];
}

export function parseCommandLine(input: string): ParsedCommandLine | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const [command, ...args] = trimmed.split(/\s+/);
  return { command, args };
}

export function executeCommandLine(
  commandStr: string,
  ctx: CommandContext,
  registry: CommandDefinition[],
): TerminalResult {
  const parsed = parseCommandLine(commandStr);
  if (!parsed) {
    return { type: 'system', text: '', skipActivityLog: true };
  }

  const { command, args } = parsed;
  const cmd = resolveCommand(command, registry);

  if (!cmd) {
    return {
      type: 'error',
      text: `ERR: Command not recognized: '${command}'. Type 'help' for protocols.`,
    };
  }

  if (cmd.name === 'help') {
    if (args.length === 0) {
      return { type: 'system', text: formatRegistryHelp(registry) };
    }
    return { type: 'system', text: formatCommandHelp(args[0], registry) };
  }

  const result = cmd.run(ctx, args);
  return result ?? { type: 'error', text: `ERR: Command '${cmd.name}' returned no response.` };
}

function argValues(
  spec: NonNullable<CommandDefinition['args']>[number],
  ctx: CommandContext,
): string[] {
  if (!spec.values) return [];
  return typeof spec.values === 'function' ? spec.values(ctx) : spec.values;
}

export function getAutocompleteSuffix(
  input: string,
  registry: CommandDefinition[],
  ctx: CommandContext,
): string {
  const trimmed = input.trimStart();
  if (!trimmed) return '';

  const words = trimmed.split(' ');
  const cmdWord = words[0].toLowerCase();
  const cmd = resolveCommand(cmdWord, registry);

  if (words.length === 1) {
    const names = listCommandNames(registry);
    const matches = names.filter((name) => name.startsWith(cmdWord));
    if (matches.length === 1 && matches[0] !== cmdWord) {
      return matches[0].slice(cmdWord.length);
    }
    return '';
  }

  if (!cmd || words.length !== 2 || input.endsWith(' ')) return '';

  const argSpec = cmd.args?.[0];
  if (!argSpec) return '';

  const arg = words[1].toLowerCase();

  if (cmd.name === 'sort') {
    const fullValues = argValues(argSpec, ctx);
    const normalizedArg = arg.replace('-', '');
    const matches = fullValues.filter((v) => v.replace('-', '').startsWith(normalizedArg));
    if (matches.length === 1 && matches[0].replace('-', '') !== normalizedArg) {
      return matches[0].slice(words[1].length);
    }
    return '';
  }

  const values = argValues(argSpec, ctx);

  if (cmd.name === 'filter') {
    const matches = values.filter((v) => v.toLowerCase().startsWith(arg));
    if (matches.length === 1 && matches[0].toLowerCase() !== arg) {
      return matches[0].slice(words[1].length);
    }
    return '';
  }

  const matches = values.filter((v) => v.toLowerCase().startsWith(arg));
  if (matches.length === 1 && matches[0].toLowerCase() !== arg) {
    return matches[0].slice(words[1].length);
  }

  return '';
}

export function applyTabCompletion(
  input: string,
  registry: CommandDefinition[],
  ctx: CommandContext,
): string | null {
  const trimmed = input.trimStart();
  if (!trimmed) return null;

  const words = trimmed.split(' ');
  const cmdWord = words[0].toLowerCase();

  if (words.length === 1) {
    const names = listCommandNames(registry);
    const matches = names.filter((name) => name.startsWith(cmdWord));
    if (matches.length === 1) return `${matches[0]} `;
    return null;
  }

  const suffix = getAutocompleteSuffix(input, registry, ctx);
  if (!suffix) return null;

  if (words.length === 2) {
    return `${words[0]} ${words[1]}${suffix} `;
  }

  return null;
}

export function shouldDedupeHistoryEntry(previous: string | undefined, next: string): boolean {
  return previous === next;
}
