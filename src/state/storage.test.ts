import { describe, expect, it } from 'vitest';
import { mergeDefaults } from './storage';

describe('mergeDefaults', () => {
  const defaults = { a: 1, nested: { x: true, y: 'keep' }, list: ['d'] };

  it('returns defaults when nothing is stored', () => {
    expect(mergeDefaults(defaults, undefined)).toEqual(defaults);
  });

  it('keeps stored values and fills new nested keys', () => {
    const merged = mergeDefaults(defaults, { a: 2, nested: { x: false } as typeof defaults.nested });
    expect(merged).toEqual({ a: 2, nested: { x: false, y: 'keep' }, list: ['d'] });
  });

  it('replaces arrays instead of merging them', () => {
    expect(mergeDefaults(defaults, { list: ['s'] }).list).toEqual(['s']);
  });
});
