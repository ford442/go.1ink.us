import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCommandRegistry } from '../src/lib/commandRegistry.ts';
import { executeCommandLine } from '../src/lib/terminalParser.ts';

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

afterEach(() => {
  if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
  else delete globalThis.localStorage;
});

function makeContext() {
  const calls = [];
  const record = (name) => (...args) => calls.push([name, ...args]);
  return {
    calls,
    addActivityLog: record('activity'), changeTheme: record('theme'), favorites: [1, 3], activeFilters: [],
    handleDisplayModeChange: record('view'), handleProjectSelect: record('open'), projectsMatchingQuery: [],
    setCurrentPage: record('page'), setIsCrtEnabled: record('crt'), setIsHoloTerminalOpen: record('holo'),
    setIsLockdown: record('lockdown'), setIsMatrixMode: record('matrix'), setIsSoundEnabled: record('sound'),
    setPerformanceMode: record('perf'), setRandomSeed: record('seed'), setSortOption: record('sort'),
    toggleFavorite: record('favorite'), toggleFilter: record('filter'), replaceFavorites: record('replace'),
    setActiveFilters: record('activeFilters'), isCrtEnabled: false, isHoloTerminalOpen: false,
    isLockdown: false, isMatrixMode: false, isSoundEnabled: false,
    performanceMode: 'balanced', effectiveMode: 'balanced',
  };
}

function run(command) {
  const ctx = makeContext();
  const result = executeCommandLine(command, ctx, createCommandRegistry(ctx));
  return { ctx, result };
}

describe('commandRegistry integration', () => {
  it('help lists live registry commands', () => {
    const { result } = run('help');
    assert.match(result.text, /AVAILABLE PROTOCOLS/);
    assert.match(result.text, /loadout/);
  });
  it('help returns command-specific usage', () => assert.match(run('help filter').result.text, /filter <category/));
  it('filter resolves category names case-insensitively', () => assert.deepEqual(run('filter games').ctx.calls, [['filter', 'Games']]));
  it('filter resolves punctuated category names case-insensitively', () => assert.deepEqual(run('filter audio/visual').ctx.calls, [['filter', 'Audio/Visual']]));
  it('filter rejects unknown targets without mutation', () => {
    const { ctx, result } = run('filter nope');
    assert.equal(result.type, 'error');
    assert.deepEqual(ctx.calls, []);
  });
  it('sort updates the option and resets pagination', () => {
    assert.deepEqual(run('sort newest').ctx.calls, [['sort', 'Newest'], ['page', 1]]);
  });
  it('sort rejects unknown algorithms', () => assert.equal(run('sort oldest').result.type, 'error'));
  it('view invokes the display-mode contract', () => assert.deepEqual(run('view constellation').ctx.calls, [['view', 'constellation']]));
  it('view rejects unknown modes', () => assert.equal(run('view table').result.type, 'error'));
  it('theme invokes the typed palette contract', () => assert.deepEqual(run('theme gold').ctx.calls, [['theme', 'gold']]));
  it('theme rejects unsupported palettes', () => assert.equal(run('theme orange').result.type, 'error'));
  it('loadout validates required action and names', () => {
    assert.match(run('loadout').result.text, /Missing parameter/);
    assert.match(run('loadout apply').result.text, /loadout apply <name>/);
  });
  it('loadout apply replaces favorites and activates the pseudo-filter', () => {
    const stored = JSON.stringify({
      version: 1,
      loadouts: [{ id: 'demo', version: 1, name: 'Demo Set', ids: [3, 1], createdAt: '', updatedAt: '' }],
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: (key) => key === 'curator_loadouts' ? stored : null, setItem: () => {} },
    });
    const { ctx, result } = run('loadout apply demo set');
    assert.equal(result.type, 'success');
    assert.deepEqual(ctx.calls, [
      ['replace', [3, 1], 'Demo Set'],
      ['activeFilters', ['Favorites']],
      ['page', 1],
      ['activity', 'LOADOUT APPLIED: [DEMO SET]'],
    ]);
  });
  it('loadout rejects unknown actions without browser storage', () => assert.match(run('loadout teleport demo').result.text, /Unknown loadout action/));
});
