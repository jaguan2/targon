// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { decodeWorkspace } from '../domain/friends';
import { encodeSavedProfile, PROFILE_STORAGE_KEY } from '../domain/savedProfile';

const owner = {
  profile: { name: 'Mira', pronouns: 'they' as const },
  birth: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, latitude: 51.5074, longitude: -0.1278 },
};
let container: HTMLDivElement;
let root: Root;

function click(text: string) {
  const target = [...container.querySelectorAll('button')].find((item) => item.textContent === text);
  if (!target) throw new Error(`Missing button ${text}`);
  act(() => target.click());
}
function clickLabel(label: string) {
  const target = [...container.querySelectorAll('button')].find((item) => item.getAttribute('aria-label') === label);
  if (!target) throw new Error(`Missing button ${label}`);
  act(() => target.click());
}
function fill(id: string, value: string) {
  const field = container.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
  if (!field) throw new Error(`Missing field ${id}`);
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
function addFriend(name = 'Alex', full = true) {
  click('Add a friend');
  fill('name', name);
  submit();
  fill('date', '2000-04-01');
  if (full) { fill('time', '14:30'); fill('city', 'New York, US'); }
  submit();
}
function savedFriends() {
  return decodeWorkspace(window.localStorage.getItem(PROFILE_STORAGE_KEY)!).friends;
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  window.localStorage.clear();
  window.localStorage.setItem(PROFILE_STORAGE_KEY, encodeSavedProfile(owner));
  container = document.createElement('div');
  document.body.appendChild(container);
  mount();
  click('Friends');
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Friends tab', () => {
  it('starts with a useful empty state and keeps old saved profiles', () => {
    expect(container.querySelector('.friends-tab')?.textContent).toContain('Every connection has its own constellation');
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Mira');
    expect(container.querySelectorAll('.friend-card')).toHaveLength(0);
  });

  it('requires a friend name and preserves birth details on Back', () => {
    click('Add a friend');
    submit();
    expect(container.querySelector('.friend-editor [role="alert"]')?.textContent).toContain('Enter a name');
    fill('name', 'Alex');
    submit();
    fill('date', '2000-04-01');
    fill('city', 'New York, US');
    click('Back');
    submit();
    expect(container.querySelector<HTMLInputElement>('#date')?.value).toBe('2000-04-01');
    expect(container.querySelector<HTMLSelectElement>('#city')?.value).toBe('New York, US');
  });

  it('adds a friend, compares real placements, and restores them after reload', () => {
    addFriend();
    expect(container.querySelectorAll('.friend-card')).toHaveLength(1);
    expect(container.querySelector('.friend-card h3')?.textContent).toBe('Alex');
    expect(container.querySelector('.friend-comparison')?.textContent).toContain('You & Alex');
    expect(container.querySelector('.friend-comparison')?.textContent).toContain('degree-based aspects');
    expect(container.querySelectorAll('.interaspect').length).toBeGreaterThan(3);
    expect(savedFriends()[0]?.profile.name).toBe('Alex');

    act(() => root.unmount());
    mount();
    click('Friends');
    clickLabel('Compare with Alex');
    expect(container.querySelector('.friend-comparison')?.textContent).toContain('You & Alex');
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Mira');
  });

  it('switches lenses and keeps the selection while navigating tabs', () => {
    addFriend();
    const before = container.querySelector('.connection-score')?.textContent;
    click('Romantic');
    expect(container.querySelector('.friend-comparison [role="status"]')?.textContent).toContain('Romantic');
    expect(container.querySelector('.connection-score')?.textContent).not.toBe(before);
    click('Profile');
    click('Friends');
    expect(container.querySelector('.friend-comparison [role="status"]')?.textContent).toContain('Romantic');
  });

  it('edits a friend without duplicating them and cancel preserves their saved data', () => {
    addFriend();
    const id = savedFriends()[0]!.id;
    clickLabel('Edit Alex');
    fill('name', 'Cancelled');
    click('Cancel friend editing');
    expect(savedFriends()[0]?.profile.name).toBe('Alex');
    clickLabel('Edit Alex');
    fill('name', 'Nova');
    submit();
    expect(container.querySelector<HTMLInputElement>('#time')?.value).toBe('14:30');
    fill('date', '2000-08-01');
    submit();
    expect(savedFriends()).toHaveLength(1);
    expect(savedFriends()[0]?.id).toBe(id);
    expect(savedFriends()[0]?.profile.name).toBe('Nova');
    expect(container.querySelector('.friend-card p')?.textContent).toContain('Leo');
  });

  it('removes the selected friend and can undo without disturbing other friends', () => {
    addFriend('Alex');
    addFriend('Sam');
    clickLabel('Remove Sam');
    expect(savedFriends().map((item) => item.profile.name)).toEqual(['Alex']);
    expect(container.querySelector('.friend-comparison')).toBeNull();
    click('Undo removal');
    expect(savedFriends().map((item) => item.profile.name)).toEqual(['Alex', 'Sam']);
    expect(container.querySelector('.friend-comparison')?.textContent).toContain('You & Sam');
  });

  it('uses a clearly provisional fallback for an unknown friend birth time', () => {
    addFriend('Alex', false);
    expect(container.querySelector('.friend-comparison')?.textContent).toContain('Provisional sign comparison');
    expect(container.querySelector('.friend-comparison')?.textContent).toContain('One or both birth times are unknown');
    expect(container.querySelector('.friend-comparison')?.textContent).not.toContain('degree-based aspects');
    expect(container.querySelector('.friend-card p')?.textContent).toContain('estimated');
  });

  it('keeps friends in memory when saving fails and reports the stale saved copy', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Denied'); });
    addFriend();
    expect(container.querySelector('.friends-tab')?.textContent).toContain('saved copy could not be updated');
    expect(container.querySelector('.friend-card h3')?.textContent).toBe('Alex');
    expect(savedFriends()).toHaveLength(0);
  });

  it('removes friends from device storage along with the remember preference', () => {
    addFriend();
    click('Profile');
    act(() => container.querySelector<HTMLInputElement>('.remember-profile input')!.click());
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    click('Friends');
    expect(container.querySelector('.friend-card h3')?.textContent).toBe('Alex');
    expect(container.querySelector('.friends-tab')?.textContent).toContain('available for this session');
    addFriend('Sam');
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
  });

  it('clears friends when the owner starts over', () => {
    addFriend();
    click('Profile');
    click('Clear profile and start over');
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
    fill('name', 'New owner');
    submit();
    fill('date', '2001-01-01');
    submit();
    click('Friends');
    expect(container.querySelectorAll('.friend-card')).toHaveLength(0);
  });

  it('keeps the owner accessible if the saved friend collection is corrupted', () => {
    const raw = JSON.stringify({ version: 2, ...owner, friends: [{ id: 'damaged' }] });
    window.localStorage.setItem(PROFILE_STORAGE_KEY, raw);
    act(() => root.unmount());
    mount();
    expect(container.querySelector('.profile-heading h2')?.textContent).toBe('Mira');
    click('Friends');
    expect(container.querySelector('.friends-tab')?.textContent).toContain('Saved friends could not be restored');
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBe(raw);
  });

  it('recalculates a comparison when the owner changes birth details', () => {
    addFriend();
    const previous = container.querySelector('.connection-score')?.textContent;
    click('Profile');
    click('Edit profile');
    submit();
    fill('date', '2000-08-01');
    submit();
    click('Friends');
    clickLabel('Compare with Alex');
    expect(container.querySelector('.connection-score')?.textContent).not.toBe(previous);
    expect(savedFriends()).toHaveLength(1);
  });
});
