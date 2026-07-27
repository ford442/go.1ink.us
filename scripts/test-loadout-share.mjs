import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodePackParam } from '../src/lib/loadoutCodec.ts';
import {
  applyLoadoutShare,
  parseLoadoutShareSearch,
  resolveLoadoutShare,
} from '../src/lib/loadoutShare.ts';

describe('loadout share URL application', () => {
  it('captures pack and ids query parameters', () => {
    assert.deepEqual(parseLoadoutShareSearch('?pack=abc&ids=1%2C3'), { pack: 'abc', ids: '1,3' });
  });
  it('returns null when no share parameters exist', async () => assert.equal(await resolveLoadoutShare({ pack: null, ids: null }), null));
  it('sanitizes ids while preserving valid order', async () => {
    assert.deepEqual((await resolveLoadoutShare({ pack: null, ids: '3,999,3,1' })).ids, [3, 1]);
  });
  it('decodes named pack URLs', async () => {
    const pack = { version: 1, name: 'Demo', ids: [1, 3] };
    assert.deepEqual(await resolveLoadoutShare({ pack: encodePackParam(pack), ids: '4' }), pack);
  });
  it('applies ids through favorites, filter, page, toast, and activity callbacks', () => {
    const calls = [];
    applyLoadoutShare({ version: 1, ids: [3, 1] }, {
      replaceFavorites: (...args) => calls.push(['replace', ...args]),
      setActiveFilters: (...args) => calls.push(['filters', ...args]),
      setCurrentPage: (...args) => calls.push(['page', ...args]),
      addToast: (...args) => calls.push(['toast', ...args]),
      addActivityLog: (...args) => calls.push(['activity', ...args]),
    });
    assert.deepEqual(calls.slice(0, 3), [
      ['replace', [3, 1], undefined, { silent: true }],
      ['filters', ['Favorites']],
      ['page', 1],
    ]);
    assert.match(calls[3][1], /2 NODES/);
    assert.match(calls[4][1], /2 NODES/);
  });
  it('uses a named pack label in deployment feedback', () => {
    const messages = [];
    applyLoadoutShare({ version: 1, name: 'Night Set', ids: [1] }, {
      replaceFavorites: () => {}, setActiveFilters: () => {}, setCurrentPage: () => {},
      addToast: (message) => messages.push(message), addActivityLog: (message) => messages.push(message),
    });
    assert.ok(messages.every((message) => message.includes('[NIGHT SET]')));
  });
});
