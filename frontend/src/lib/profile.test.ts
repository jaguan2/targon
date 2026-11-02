import { describe, expect, it } from 'vitest';
import {
  EMPTY_PROFILE,
  PRONOUN_SETS,
  describeProfile,
  getPronouns,
  greetingName,
  possessiveName,
  type Profile,
} from './profile';

const jason: Profile = { name: 'Jason', pronouns: 'he' };

describe('pronoun sets', () => {
  it('offers she, he, they and a decline option', () => {
    expect(PRONOUN_SETS.map((p) => p.key)).toEqual([
      'she',
      'he',
      'they',
      'unspecified',
    ]);
  });

  it('falls back to singular they when unspecified', () => {
    const set = getPronouns('unspecified');
    expect(set.subject).toBe('they');
    expect(set.possessive).toBe('their');
  });

  it('rejects an unknown key', () => {
    // @ts-expect-error deliberately invalid
    expect(() => getPronouns('xe')).toThrow();
  });
});

describe('greetingName', () => {
  it('returns the name when given', () => {
    expect(greetingName(jason)).toBe('Jason');
  });

  it('returns null for a blank or whitespace-only name', () => {
    expect(greetingName(EMPTY_PROFILE)).toBeNull();
    expect(greetingName({ name: '   ', pronouns: 'they' })).toBeNull();
  });
});

describe('possessiveName', () => {
  it('adds an apostrophe-s to an ordinary name', () => {
    expect(possessiveName(jason)).toBe("Jason's");
  });

  it('adds a bare apostrophe to names ending in s', () => {
    expect(possessiveName({ name: 'James', pronouns: 'they' })).toBe("James'");
    expect(possessiveName({ name: 'JONAS', pronouns: 'they' })).toBe("JONAS'");
  });

  it('falls back to "Your" when no name was given', () => {
    expect(possessiveName(EMPTY_PROFILE)).toBe('Your');
  });
});

describe('describeProfile', () => {
  it('lists the big three in natural language', () => {
    const summary = describeProfile(jason, {
      sun: 'cancer',
      moon: 'sagittarius',
      rising: 'libra',
    });
    expect(summary).toBe(
      'Jason is Cancer sun, Sagittarius moon and Libra rising.',
    );
  });

  it('appends the strongest match using the chosen pronouns', () => {
    const summary = describeProfile(
      jason,
      { sun: 'cancer', moon: 'sagittarius', rising: 'libra' },
      'pisces',
    );
    expect(summary).toContain('His closest sign is Pisces.');
  });

  it('uses singular they when pronouns are unspecified', () => {
    const summary = describeProfile(
      { name: 'Sam', pronouns: 'unspecified' },
      { sun: 'aries' },
      'leo',
    );
    expect(summary).toContain('Their closest sign is Leo.');
  });

  /** A date-only chart has no Moon or Ascendant to report. */
  it('handles a single placement without a dangling conjunction', () => {
    const summary = describeProfile(jason, { sun: 'cancer' });
    expect(summary).toBe('Jason is Cancer sun.');
  });

  it('joins exactly two placements with "and"', () => {
    const summary = describeProfile(jason, { sun: 'cancer', moon: 'leo' });
    expect(summary).toBe('Jason is Cancer sun and Leo moon.');
  });

  it('falls back gracefully when the chart has nothing yet', () => {
    expect(describeProfile(jason, {})).toBe('Jason — chart pending.');
  });

  it('works without a name', () => {
    const summary = describeProfile(EMPTY_PROFILE, { sun: 'cancer' });
    expect(summary).toBe('This chart is Cancer sun.');
  });
});
