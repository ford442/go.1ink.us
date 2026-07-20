import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTabCompletion,
  executeCommandLine,
  getAutocompleteSuffix,
  parseCommandLine,
  shouldDedupeHistoryEntry,
} from '../src/lib/terminalParser';

const mockRegistry = [
  {
    name: 'help',
    aliases: ['?'],
    help: 'Show help',
    usage: 'help [command]',
    run: () => null,
  },
  {
    name: 'theme',
    args: [{ name: 'palette', description: 'Theme id', required: true, values: ['cyan', 'purple', 'emerald', 'gold'] }],
    help: 'Change theme',
    usage: 'theme <cyan|purple|emerald|gold>',
    run: (_ctx, args) => ({ type: 'success', text: `theme=${args[0]}` }),
  },
  {
    name: 'map',
    aliases: ['graph'],
    help: 'Open map view',
    usage: 'map',
    run: () => ({ type: 'success', text: 'map ok' }),
  },
  {
    name: 'stats',
    help: 'Show stats',
    usage: 'stats',
    run: () => ({ type: 'system', text: 'stats ok' }),
  },
];

const mockCtx = {};

describe('terminalParser.parseCommandLine', () => {
  it('parses command and args', () => {
    assert.deepEqual(parseCommandLine('theme cyan'), { command: 'theme', args: ['cyan'] });
    assert.equal(parseCommandLine('   '), null);
  });
});

describe('terminalParser.executeCommandLine', () => {
  it('returns structured help listing', () => {
    const result = executeCommandLine('help', mockCtx, mockRegistry);
    assert.match(result.text, /AVAILABLE PROTOCOLS/);
    assert.match(result.text, /theme/);
  });

  it('returns command-specific help', () => {
    const result = executeCommandLine('help theme', mockCtx, mockRegistry);
    assert.match(result.text, /COMMAND: theme/);
    assert.match(result.text, /USAGE:/);
  });

  it('resolves aliases', () => {
    const result = executeCommandLine('graph', mockCtx, mockRegistry);
    assert.equal(result.type, 'success');
    assert.equal(result.text, 'map ok');
  });

  it('reports unknown commands', () => {
    const result = executeCommandLine('not-a-command', mockCtx, mockRegistry);
    assert.equal(result.type, 'error');
    assert.match(result.text, /not recognized/);
  });

  it('executes registered handlers', () => {
    const result = executeCommandLine('theme purple', mockCtx, mockRegistry);
    assert.equal(result.text, 'theme=purple');
  });
});

describe('terminalParser autocomplete', () => {
  it('suggests unique command suffix', () => {
    assert.equal(getAutocompleteSuffix('st', mockRegistry, mockCtx), 'ats');
  });

  it('completes tab to command plus space', () => {
    assert.equal(applyTabCompletion('stat', mockRegistry, mockCtx), 'stats ');
  });

  it('completes theme argument', () => {
    assert.equal(applyTabCompletion('theme cy', mockRegistry, mockCtx), 'theme cyan ');
  });
});

describe('terminalParser history', () => {
  it('dedupes consecutive identical entries', () => {
    assert.equal(shouldDedupeHistoryEntry('theme cyan', 'theme cyan'), true);
    assert.equal(shouldDedupeHistoryEntry('theme cyan', 'theme purple'), false);
  });
});
