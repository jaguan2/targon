import { describe, expect, it } from 'vitest';
import { decodeSavedProfile, encodeSavedProfile } from './savedProfile';

const profile = { name: 'Mira', pronouns: 'they' as const };
const birth = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, latitude: 51.5074, longitude: -0.1278 };

describe('saved profile validation', () => {
  it('round-trips inputs without persisting a computed chart', () => {
    const raw = encodeSavedProfile({ profile, birth });
    expect(decodeSavedProfile(raw)).toEqual({ profile, birth });
    expect(raw).not.toContain('placements');
  });

  it.each([
    'null', '[]', 'broken JSON',
    JSON.stringify({ version: 2, profile, birth }),
    JSON.stringify({ version: 1, profile: { ...profile, pronouns: 'invalid' }, birth }),
    JSON.stringify({ version: 1, profile, birth: { ...birth, year: '2000' } }),
    JSON.stringify({ version: 1, profile, birth: { ...birth, latitude: 100 } }),
    JSON.stringify({ version: 1, profile, birth: { ...birth, timeZone: 12 } }),
  ])('rejects malformed stored data', (raw) => {
    expect(() => decodeSavedProfile(raw)).toThrow();
  });
});
