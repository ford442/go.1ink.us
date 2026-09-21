import type { ThemeId } from '../../types';
import type { CommandContext, CommandDefinition } from '../commandTypes';
import { missingArg, onOffResult } from './shared';

export const THEMES: ThemeId[] = ['cyan', 'purple', 'emerald', 'gold'];
export const ON_OFF = ['on', 'off'] as const;

export const themeCommand: CommandDefinition = {
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
    const theme = args[0]!.toLowerCase() as ThemeId;
    if (!THEMES.includes(theme)) {
      return { type: 'error', text: `ERR: Unsupported color matrix '${args[0]}'` };
    }
    ctx.changeTheme(theme);
    return { type: 'success', text: '> COLOR_PROTOCOL_UPDATED' };
  },
};

export const soundCommand: CommandDefinition = {
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
      args[0]!.toLowerCase(),
      () => ctx.setIsSoundEnabled(true),
      () => ctx.setIsSoundEnabled(false),
      '> AUDIO_FEEDBACK_SYSTEM: ONLINE',
      '> AUDIO_FEEDBACK_SYSTEM: OFFLINE',
    );
  },
};

export const crtCommand: CommandDefinition = {
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
      args[0]!.toLowerCase(),
      () => ctx.setIsCrtEnabled(true),
      () => ctx.setIsCrtEnabled(false),
      '> CRT_EFFECT_SYSTEM: ONLINE',
      '> CRT_EFFECT_SYSTEM: OFFLINE',
    );
  },
};

export const matrixCommand: CommandDefinition = {
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
    const stateParam = args[0]!.toLowerCase();
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
};
