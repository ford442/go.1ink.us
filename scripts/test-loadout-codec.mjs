import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodePackParamSync,
  encodePackParam,
  parseIdsParam,
  parseLoadoutPack,
  sanitizeIds,
  serializeLoadoutPack,
} from '../src/lib/loadoutCodec.ts';

describe('loadoutCodec', () => {
  it('sanitizeIds preserves order and dedupes invalid ids', () => {
    assert.deepEqual(sanitizeIds([3, 999, 3, 7, 1, 0, -1]), [3, 7, 1]);
  });

  it('parseIdsParam preserves order', () => {
    assert.deepEqual(parseIdsParam('3,7,12,1'), [3, 7, 12, 1]);
  });

  it('export/import round-trip preserves order', () => {
    const pack = { version: 1, name: 'Games night', ids: [9, 1, 4, 3] };
    const json = serializeLoadoutPack(pack);
    const restored = parseLoadoutPack(json);
    assert.deepEqual(restored.ids, pack.ids);
    assert.equal(restored.name, pack.name);
  });

  it('pack param encode/decode round-trip preserves order', () => {
    const pack = { version: 1, name: 'VJ set', ids: [2, 5, 8] };
    const param = encodePackParam(pack);
    const decoded = decodePackParamSync(param);
    assert.deepEqual(decoded.ids, pack.ids);
    assert.equal(decoded.name, pack.name);
  });

  it('parseLoadoutPack rejects empty valid ids', () => {
    assert.throws(() => parseLoadoutPack({ version: 1, ids: [999, 888] }));
  });
});
