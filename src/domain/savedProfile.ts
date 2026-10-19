import { resolveBirthMoment, type BirthInput } from './chart';
import { PRONOUN_SETS, type Profile } from './profile';

export interface SavedProfile {
  profile: Profile;
  birth: BirthInput;
}

export const PROFILE_STORAGE_KEY = 'star.profile.v1';

export function encodeSavedProfile(value: SavedProfile): string {
  return JSON.stringify({ version: 1, profile: value.profile, birth: value.birth });
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Stored browser data is untrusted. Persist inputs only, never derived charts. */
export function decodeSavedProfile(raw: string): SavedProfile {
  const value: unknown = JSON.parse(raw);
  if (!record(value) || value.version !== 1 || !record(value.profile) || !record(value.birth)) {
    throw new Error('Unsupported saved profile.');
  }
  const { profile, birth } = value;
  if (typeof profile.name !== 'string' || profile.name.length > 40 ||
      !PRONOUN_SETS.some((set) => set.key === profile.pronouns)) {
    throw new Error('Invalid saved identity.');
  }
  for (const key of ['year', 'month', 'day']) {
    if (typeof birth[key] !== 'number') throw new Error('Invalid saved birth date.');
  }
  const input: BirthInput = { year: birth.year as number, month: birth.month as number, day: birth.day as number };
  for (const key of ['hour', 'minute', 'latitude', 'longitude'] as const) {
    if (birth[key] !== undefined) {
      if (typeof birth[key] !== 'number') throw new Error('Invalid saved birth details.');
      input[key] = birth[key];
    }
  }
  if (birth.timeZone !== undefined) {
    if (typeof birth.timeZone !== 'string' || !birth.timeZone.trim()) throw new Error('Invalid saved timezone.');
    input.timeZone = birth.timeZone;
  }
  if (birth.timeOccurrence !== undefined) {
    if (birth.timeOccurrence !== 'earlier' && birth.timeOccurrence !== 'later') throw new Error('Invalid saved clock occurrence.');
    input.timeOccurrence = birth.timeOccurrence;
  }
  resolveBirthMoment(input);
  return {
    profile: { name: profile.name.trim(), pronouns: profile.pronouns as Profile['pronouns'] },
    birth: input,
  };
}
