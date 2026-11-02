import { describe, expect, it } from 'vitest';
import { decodeWorkspace, encodeWorkspace } from './friends';
import { encodeSavedProfile } from './savedProfile';

const owner = { profile: { name: 'Mira', pronouns: 'they' as const }, birth: { year: 2000, month: 1, day: 1 } };
const friend = { id: 'friend-1', profile: { name: 'Alex', pronouns: 'he' as const }, birth: { year: 1999, month: 5, day: 20 } };

describe('friends persistence', () => {
  it('upgrades the original profile format without losing any birth data', () => {
    expect(decodeWorkspace(encodeSavedProfile(owner))).toEqual({ ...owner, friends: [] });
  });

  it('round-trips friends and the owner without persisting computed charts', () => {
    const raw = encodeWorkspace({ ...owner, friends: [friend] });
    expect(decodeWorkspace(raw)).toEqual({ ...owner, friends: [friend] });
    expect(raw).not.toContain('placements');
  });

  it.each([
    null, [], { version: 3 },
    { version: 2, ...owner, friends: {} },
    { version: 2, ...owner, friends: [friend, friend] },
    { version: 2, ...owner, friends: [{ ...friend, id: '' }] },
    { version: 2, ...owner, friends: [{ ...friend, profile: { name: '', pronouns: 'he' } }] },
    { version: 2, ...owner, friends: [{ ...friend, birth: { year: 2000, month: 2, day: 30 } }] },
  ])('rejects invalid collections or friend records', (value) => {
    expect(() => decodeWorkspace(JSON.stringify(value))).toThrow();
  });
});
