import { describe, expect, it } from 'vitest';
import { birthFromDraft, createBirthDraft, MANUAL_PLACE } from './birthDetails';

describe('birth details intake', () => {
  it('starts with no invented birth date', () => {
    expect(createBirthDraft().date).toBe('');
    expect(() => birthFromDraft(createBirthDraft())).toThrow(/birth date/);
  });

  it('accepts a place without a known time', () => {
    const birth = birthFromDraft({ ...createBirthDraft(), date: '1990-07-04', city: 'New York, US' });
    expect(birth.latitude).toBe(40.7128);
    expect(birth.hour).toBeUndefined();
  });

  it('requires a timezone for a local time without a place', () => {
    expect(() => birthFromDraft({ ...createBirthDraft(), date: '1990-07-04', time: '14:30' })).toThrow(/timezone/);
  });

  it('preserves midnight and zero coordinates through editing', () => {
    const input = { year: 2000, month: 1, day: 1, hour: 0, minute: 0, latitude: 0, longitude: 0, timeZone: 'UTC' };
    expect(birthFromDraft(createBirthDraft(input))).toEqual(input);
  });

  it('omits clock data when the user explicitly selects unknown time', () => {
    const birth = birthFromDraft({ ...createBirthDraft(), date: '2000-01-01', time: '01:30', timeUnknown: true, timeOccurrence: 'later' });
    expect(birth.hour).toBeUndefined();
    expect(birth.timeOccurrence).toBeUndefined();
  });

  it('rejects partial coordinates instead of silently ignoring them', () => {
    expect(() => birthFromDraft({ ...createBirthDraft(), date: '2000-01-01', city: MANUAL_PLACE, latitude: '40' })).toThrow(/both coordinates/);
  });
});
