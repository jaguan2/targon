import { encodeWorkspace, type SavedWorkspace } from '@/lib/friends';
import { PROFILE_STORAGE_KEY } from '@/lib/savedProfile';

// The only browser-storage boundary. Callers handle failures so session changes
// can succeed even when a device's saved copy cannot be read or updated.
export function readWorkspace(): string | null {
  return window.localStorage.getItem(PROFILE_STORAGE_KEY);
}

export function saveWorkspace(workspace: SavedWorkspace): void {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, encodeWorkspace(workspace));
}

export function removeWorkspace(): void {
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}
