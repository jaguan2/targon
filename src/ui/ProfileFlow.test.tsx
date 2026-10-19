// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { encodeSavedProfile, PROFILE_STORAGE_KEY } from '../domain/savedProfile';

let container: HTMLDivElement;
let root: Root;

function button(text: string): HTMLButtonElement {
  const element = [...container.querySelectorAll('button')].find((item) => item.textContent === text);
  if (!element) throw new Error(`Missing button: ${text}`);
  return element;
}

function click(text: string) { act(() => button(text).click()); }
function fill(id: string, value: string) {
  const field = container.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
  if (!field) throw new Error(`Missing field: ${id}`);
  act(() => { field.value = value; Simulate.change(field); });
}
function submit() {
  const form = container.querySelector('form');
  if (!form) throw new Error('Missing form');
  act(() => Simulate.submit(form));
}
function mount() {
  root = createRoot(container);
  act(() => root.render(<App />));
}
function createProfile(full = true) {
  fill('name', 'Mira');
  submit();
  fill('date', '2000-01-01');
  submit();
  if (full) fill('time', '12:00');
  else act(() => container.querySelector<HTMLInputElement>('.unknown-time input')!.click());
  submit();
  if (full) fill('city', 'London, UK');
  submit();
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  if (root) act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('profile lifecycle', () => {
  it('restores original Star profiles and friends under the Targon name', () => {
    window.localStorage.setItem('star.profile.v1', JSON.stringify({
      version: 2,
      profile: { name: 'Legacy Mira', pronouns: 'they' },
      birth: { year: 2000, month: 1, day: 1 },
      friends: [{ id: 'legacy-alex', profile: { name: 'Legacy Alex', pronouns: 'unspecified' }, birth: { year: 2000, month: 4, day: 1 } }],
    }));
    mount();
    expect(container.querySelector('h1')?.textContent).toContain('Targon');
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Legacy Mira');
    click('Friends');
    expect(container.querySelector('.friend-card h3')?.textContent).toBe('Legacy Alex');
  });

  it('asks one question per step, validates answers, and creates only at the end', () => {
    mount();
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain('Name');
    expect(container.querySelector('#date')).toBeNull();
    fill('name', 'Mira');
    submit();
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain('Birthday');
    expect(container.querySelector('#time')).toBeNull();
    submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('birth date');
    fill('date', '2000-01-01');
    submit();
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain('Birth time');
    expect(document.activeElement?.tagName).toBe('H2');
    expect(container.querySelector('#city')).toBeNull();
    submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Enter your birth time');
    fill('time', '00:00');
    submit();
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain('Birthplace');
    expect(container.querySelector('.intake-review')?.textContent).toContain('00:00');
    expect(container.querySelector('.profile-view')).toBeNull();
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('timezone');
    fill('city', 'London, UK');
    document.documentElement.scrollTop = 600;
    click('Create my profile');
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Mira');
    expect(document.activeElement).toBe(container.querySelector('.profile-heading h2'));
    expect(document.documentElement.scrollTop).toBe(0);
    expect(container.querySelector('.birth-summary')?.textContent).toContain('00:00');
  });

  it('returns to a completed step without losing later answers', () => {
    mount();
    submit();
    fill('date', '2000-01-01');
    submit();
    fill('time', '12:00');
    submit();
    fill('city', 'London, UK');
    const birthday = container.querySelector<HTMLButtonElement>('[aria-label="Back to Birthday"]')!;
    act(() => birthday.click());
    fill('date', '2000-04-01');
    submit();
    expect(container.querySelector<HTMLInputElement>('#time')?.value).toBe('12:00');
    submit();
    expect(container.querySelector<HTMLSelectElement>('#city')?.value).toBe('London, UK');
    expect(container.querySelector('.intake-review')?.textContent).toContain('2000-04-01');
    submit();
    expect(container.querySelector('.big-three__value')?.textContent).toContain('Aries');
  });

  it('uses an explicit unknown time without retaining a previous clock value', () => {
    mount();
    submit();
    fill('date', '2000-01-01');
    submit();
    fill('time', '12:00');
    const unknown = container.querySelector<HTMLInputElement>('.unknown-time input')!;
    act(() => unknown.click());
    expect(container.querySelector<HTMLInputElement>('#time')?.disabled).toBe(true);
    click('Back');
    submit();
    expect(container.querySelector<HTMLInputElement>('.unknown-time input')?.checked).toBe(true);
    submit();
    fill('city', 'London, UK');
    submit();
    expect(container.querySelector('.chart-status')?.textContent).toBe('Noon estimate');
    expect(container.querySelector('.birth-summary')?.textContent).toContain('Unknown');
    expect(container.querySelector('.big-three')?.textContent).toContain('needs birth time');
    expect(container.querySelector('.birth-summary')?.textContent).toContain('Europe/London');
  });

  it('filters the offline cities without silently changing a selected birthplace', () => {
    mount();
    submit();
    fill('date', '2000-01-01');
    submit();
    act(() => container.querySelector<HTMLInputElement>('.unknown-time input')!.click());
    submit();
    fill('city-search', 'london');
    const select = container.querySelector<HTMLSelectElement>('#city')!;
    expect([...select.options].some((option) => option.value === 'London, UK')).toBe(true);
    expect([...select.options].some((option) => option.value === 'Tokyo, JP')).toBe(false);
    fill('city', 'London, UK');
    expect(container.querySelector('.place-zone')?.textContent).toContain('Europe/London');
    fill('city-search', 'no such city');
    expect(select.value).toBe('London, UK');
    expect(container.querySelector('[role="status"]')?.textContent).toContain('No listed city');
    submit();
    expect(container.querySelector('.birth-summary')?.textContent).toContain('London, UK');
  });

  it('keeps shared compatibility highlights and chart in the selected lens', () => {
    mount();
    createProfile();
    click('Explore compatibility');
    expect(button('Compatibility').getAttribute('aria-pressed')).toBe('true');
    const initial = container.querySelector('.connection-highlights')?.textContent;
    click('Romantic');
    expect(container.querySelector('.connection-highlights')?.textContent).not.toBe(initial);
    const strongest = container.querySelector('.highlight-name h3')?.textContent;
    expect(container.querySelector('.star-chart')?.getAttribute('aria-label')).toContain(strongest);
    expect(container.querySelector('.rank-row__name')?.textContent).toBe(strongest);
    click('Profile');
    click('Meet your constellation');
    expect(button('Friends').getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps birth details when returning to the identity step', () => {
    mount();
    submit();
    expect(container.querySelector<HTMLInputElement>('#date')?.value).toBe('');
    fill('date', '2000-01-01');
    submit();
    fill('time', '12:00');
    submit();
    fill('city', 'London, UK');
    click('Back');
    click('Back');
    click('Back');
    submit();
    expect(container.querySelector<HTMLInputElement>('#date')?.value).toBe('2000-01-01');
    submit();
    expect(container.querySelector<HTMLInputElement>('#time')?.value).toBe('12:00');
    submit();
    expect(container.querySelector<HTMLSelectElement>('#city')?.value).toBe('London, UK');
  });

  it('creates a full profile and saves only after the user opts in', () => {
    mount();
    createProfile();
    expect(button('Profile').getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain('Setting · Descendant');
    expect(container.textContent).toContain('Roots · Imum Coeli');
    expect(container.textContent).toContain('Europe/London');
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    act(() => container.querySelector<HTMLInputElement>('.remember-profile input')!.click());
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toContain('Mira');

    act(() => root.unmount());
    mount();
    expect(container.querySelector('form')).toBeNull();
    expect(container.textContent).toContain('Mira');
    expect(container.querySelector<HTMLInputElement>('.remember-profile input')?.checked).toBe(true);

    click('Clear profile and start over');
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    expect(container.textContent).toContain('Step 1 of 4');
  });

  it('updates chart results after editing while cancel leaves the profile intact', () => {
    mount();
    createProfile();
    click('Edit profile');
    fill('name', 'Cancelled');
    click('Cancel editing');
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Mira');
    click('Edit profile');
    fill('name', 'Nova');
    submit();
    expect(container.querySelector<HTMLInputElement>('#time')?.value).toBe('12:00');
    fill('date', '2000-04-01');
    submit();
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Nova');
    expect(container.querySelector('.big-three__value')?.textContent).toContain('Aries');
    click('Compatibility');
    expect(button('Compatibility').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelectorAll('.rank-row')).toHaveLength(12);
  });

  it('shows estimated positions and unavailable angles without inventing a birth time', () => {
    mount();
    createProfile(false);
    expect(container.querySelector('.profile-view')?.textContent).toContain('Estimated at noon');
    expect(container.querySelector('.profile-view')?.textContent).toContain('needs birth time and place');
    expect(container.querySelector('.birth-summary')?.textContent).toContain('Unknown');
    click('Compatibility');
    expect(container.textContent).toContain('estimated noon positions');
  });

  it('reports ambiguous times and lets the user choose the second occurrence', () => {
    mount();
    submit();
    fill('date', '2024-11-03');
    submit();
    fill('time', '01:30');
    submit();
    fill('city', 'New York, US');
    submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('occurred twice');
    fill('time-occurrence', 'later');
    submit();
    expect(container.querySelector('.profile-view')?.textContent).toContain('06:30:00 GMT');
    expect(container.querySelector('.birth-summary')?.textContent).toContain('second occurrence');
  });

  it('recovers from corrupted saved data', () => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, '{broken');
    mount();
    expect(container.textContent).toContain('saved profile could not be loaded');
    createProfile();
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Mira');
  });

  it('keeps the current profile usable when saving is denied', () => {
    mount();
    createProfile();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Denied'); });
    act(() => container.querySelector<HTMLInputElement>('.remember-profile input')!.click());
    expect(container.textContent).toContain('Device storage is unavailable');
    expect(container.querySelector<HTMLInputElement>('.remember-profile input')?.checked).toBe(false);
    click('Compatibility');
    expect(button('Compatibility').getAttribute('aria-pressed')).toBe('true');
  });

  it('removes the saved copy when remember is disabled', () => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, encodeSavedProfile({
      profile: { name: 'Saved', pronouns: 'they' }, birth: { year: 2000, month: 1, day: 1 },
    }));
    mount();
    act(() => container.querySelector<HTMLInputElement>('.remember-profile input')!.click());
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Saved');
  });

  it('recalculates and persists updated birth details for a remembered profile', () => {
    mount();
    createProfile();
    act(() => container.querySelector<HTMLInputElement>('.remember-profile input')!.click());
    click('Edit profile');
    submit();
    fill('date', '2000-04-01');
    submit();
    act(() => root.unmount());
    mount();
    expect(container.querySelector('.big-three__value')?.textContent).toContain('Aries');
    expect(container.querySelector('.birth-summary')?.textContent).toContain('2000-04-01');
  });

  it('can clear a session-only profile even when storage is blocked', () => {
    mount();
    createProfile();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Denied'); });
    click('Clear profile and start over');
    expect(container.textContent).toContain('Step 1 of 4');
    expect(container.textContent).toContain('Session cleared');
  });
});
