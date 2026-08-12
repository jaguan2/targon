import type { SignName } from './types';
import { getSignByName } from './signs';

/**
 * Who the user is, as distinct from when they were born.
 *
 * Worth being straight about: none of this affects a single calculation. A
 * chart is determined entirely by time and place. This exists so the app can
 * address someone by name and describe them in their own words, which is a
 * better reason than "other apps ask for it".
 */

export type PronounKey = 'she' | 'he' | 'they' | 'unspecified';

export interface PronounSet {
  key: PronounKey;
  label: string;
  subject: string;
  possessive: string;
}

export const PRONOUN_SETS: readonly PronounSet[] = [
  { key: 'she', label: 'she / her', subject: 'she', possessive: 'her' },
  { key: 'he', label: 'he / him', subject: 'he', possessive: 'his' },
  { key: 'they', label: 'they / them', subject: 'they', possessive: 'their' },
  {
    key: 'unspecified',
    label: 'rather not say',
    // Singular they is the safe default when someone declines to specify.
    subject: 'they',
    possessive: 'their',
  },
];

export function getPronouns(key: PronounKey): PronounSet {
  const set = PRONOUN_SETS.find((p) => p.key === key);
  if (!set) throw new Error(`Unknown pronoun set: ${key}`);
  return set;
}

export interface Profile {
  /** Optional. Blank is fine — the app just uses second person throughout. */
  name: string;
  pronouns: PronounKey;
}

export const EMPTY_PROFILE: Profile = { name: '', pronouns: 'unspecified' };

/** `Jason's sky` / `Your sky` — a possessive that reads naturally either way. */
export function possessiveName(profile: Profile): string {
  const name = profile.name.trim();
  if (!name) return 'Your';
  // Names already ending in s take a bare apostrophe.
  return name.endsWith('s') || name.endsWith('S') ? `${name}'` : `${name}'s`;
}

export function greetingName(profile: Profile): string | null {
  const name = profile.name.trim();
  return name.length > 0 ? name : null;
}

/**
 * A third-person summary of the chart — the one place pronouns actually earn
 * their keep, since everything else addresses the user directly.
 */
export function describeProfile(
  profile: Profile,
  // Explicit `| undefined` rather than `?`: under exactOptionalPropertyTypes a
  // missing key and a key set to undefined are different types, and callers
  // read these straight off a Map lookup.
  placements: {
    sun?: SignName | undefined;
    moon?: SignName | undefined;
    rising?: SignName | undefined;
  },
  strongestMatch?: SignName | undefined,
): string {
  const pronouns = getPronouns(profile.pronouns);
  const name = greetingName(profile) ?? 'This chart';

  const parts: string[] = [];
  if (placements.sun) parts.push(`${getSignByName(placements.sun).label} sun`);
  if (placements.moon) parts.push(`${getSignByName(placements.moon).label} moon`);
  if (placements.rising)
    parts.push(`${getSignByName(placements.rising).label} rising`);

  if (parts.length === 0) return `${name} — chart pending.`;

  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;

  const opener = `${name} is ${list}.`;
  if (!strongestMatch) return opener;

  return `${opener} ${capitalise(pronouns.possessive)} closest sign is ${getSignByName(strongestMatch).label}.`;
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
