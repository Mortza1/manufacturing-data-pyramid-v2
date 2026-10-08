import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { jsonStructurallyEqual } from './jsonStructuralEquality.ts';

describe('jsonStructurallyEqual', () => {
  it('ignores object key ordering at the snapshot and nested case levels', () => {
    const submitted = {
      format: 'manufacturing-data-pyramid-v2',
      schemaVersion: 1,
      case: {
        id: 'case-1',
        name: 'Example',
        levels: [{ id: 'level-1', index: 0, name: 'Signal' }],
        sectors: [{ id: 'sector-1', index: 0, name: 'Product' }],
        grid: { width: 8, height: 8 },
        overlays: {
          data: [{ id: 'data-1', name: 'Signal', level_id: 'level-1', sector_id: 'sector-1' }],
          models: [],
          agents: [],
          decisions: [],
          loops: [],
          connectivity: [],
        },
      },
    };
    const returnedFromJsonb = {
      case: {
        overlays: {
          connectivity: [],
          loops: [],
          decisions: [],
          agents: [],
          models: [],
          data: [{ sector_id: 'sector-1', level_id: 'level-1', name: 'Signal', id: 'data-1' }],
        },
        sectors: [{ name: 'Product', index: 0, id: 'sector-1' }],
        levels: [{ name: 'Signal', index: 0, id: 'level-1' }],
        grid: { height: 8, width: 8 },
        name: 'Example',
        id: 'case-1',
      },
      schemaVersion: 1,
      format: 'manufacturing-data-pyramid-v2',
    };

    assert.equal(jsonStructurallyEqual(returnedFromJsonb, submitted), true);
  });

  it('rejects differing values, missing keys, and reordered array items', () => {
    assert.equal(jsonStructurallyEqual({ a: 1 }, { a: 2 }), false);
    assert.equal(jsonStructurallyEqual({ a: 1, b: 2 }, { a: 1 }), false);
    assert.equal(jsonStructurallyEqual([{ id: 'first' }, { id: 'second' }], [{ id: 'second' }, { id: 'first' }]), false);
  });
});
