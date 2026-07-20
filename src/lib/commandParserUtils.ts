import type { CommandDefinition } from './commandTypes';

export function resolveCommand(name: string, registry: CommandDefinition[]): CommandDefinition | undefined {
  const lower = name.toLowerCase();
  return registry.find((cmd) => cmd.name === lower || cmd.aliases?.includes(lower));
}

export function listCommandNames(registry: CommandDefinition[]): string[] {
  const names = new Set<string>();
  registry.forEach((cmd) => {
    names.add(cmd.name);
    cmd.aliases?.forEach((alias) => names.add(alias));
  });
  return [...names].sort();
}

export function formatRegistryHelp(registry: CommandDefinition[]): string {
  const lines = registry
    .filter((cmd) => cmd.name !== 'help')
    .map((cmd) => {
      const names = [cmd.name, ...(cmd.aliases ?? [])].join(', ');
      const usage = cmd.usage ?? cmd.name;
      return `  ${names.padEnd(14)} - ${cmd.help}\n                   usage: ${usage}`;
    });
  return `AVAILABLE PROTOCOLS:\n${lines.join('\n')}\n\nType 'help <command>' for details.`;
}

export function formatCommandHelp(name: string, registry: CommandDefinition[]): string {
  const cmd = resolveCommand(name, registry);
  if (!cmd) {
    return `ERR: Unknown command '${name}'. Type 'help' for protocols.`;
  }
  const lines = [
    `COMMAND: ${cmd.name}`,
    ...(cmd.aliases?.length ? [`ALIASES: ${cmd.aliases.join(', ')}`] : []),
    `HELP:    ${cmd.help}`,
    ...(cmd.usage ? [`USAGE:   ${cmd.usage}`] : []),
  ];
  if (cmd.args?.length) {
    lines.push('ARGS:');
    cmd.args.forEach((arg) => {
      const req = arg.required === false ? 'optional' : 'required';
      lines.push(`  ${arg.name} (${req}) — ${arg.description}`);
    });
  }
  return lines.join('\n');
}
