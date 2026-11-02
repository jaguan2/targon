import { useState } from 'react';
import { computeChart, type BirthInput, type NatalChart } from '@/lib/chart';
import type { Profile } from '@/lib/profile';
import { decodeSavedProfile, type SavedProfile } from '@/lib/savedProfile';
import { decodeWorkspace, type FriendProfile, type SavedWorkspace } from '@/lib/friends';
import { readWorkspace, saveWorkspace, removeWorkspace } from '@/services/storage';

interface Session extends SavedProfile {
  chart: NatalChart;
}

function loadSession(): { session: Session | null; friends: FriendProfile[]; notice: string | null } {
  if (typeof window === 'undefined') return { session: null, friends: [], notice: null };
  try {
    const raw = readWorkspace();
    if (!raw) return { session: null, friends: [], notice: null };
    let saved: SavedWorkspace;
    let notice: string | null = null;
    try {
      saved = decodeWorkspace(raw);
    } catch (cause) {
      const value: unknown = JSON.parse(raw);
      if (typeof value !== 'object' || !value || !('version' in value) || value.version !== 2) throw cause;
      // A damaged friend collection must not prevent access to a valid owner.
      saved = { ...decodeSavedProfile(JSON.stringify({ ...value, version: 1 })), friends: [] };
      notice = 'Saved friends could not be restored. Your own profile is available. The saved copy remains unchanged until you save new changes.';
    }
    return { session: { profile: saved.profile, birth: saved.birth, chart: computeChart(saved.birth, { houseSystem: 'placidus' }) }, friends: saved.friends, notice };
  } catch {
    return { session: null, friends: [], notice: 'The saved profile could not be loaded, or device storage is unavailable. You can still create a profile for this session.' };
  }
}

/** Owns profile/friend state and persistence; navigation stays in App. */
export function useWorkspace() {
  const [initial] = useState(loadSession);
  const [session, setSession] = useState<Session | null>(initial.session);
  const [friends, setFriends] = useState<FriendProfile[]>(initial.friends);
  const [remember, setRemember] = useState(Boolean(initial.session));
  const [storageNotice, setStorageNotice] = useState<string | null>(initial.notice);
  const [error, setError] = useState<string | null>(null);

  const completeProfile = (profile: Profile, birth: BirthInput) => {
    try {
      const chart = computeChart(birth, { houseSystem: 'placidus' });
      const next = { profile, birth, chart };
      setSession(next);
      setError(null);
      setStorageNotice(null);
      if (remember) {
        try {
          saveWorkspace({ ...next, friends });
        } catch {
          setStorageNotice('Profile updated for this session, but the saved copy could not be updated.');
        }
      }
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not compute that chart.');
      return false;
    }
  };

  const handleRemember = (next: boolean) => {
    if (!session) return;
    try {
      if (next) saveWorkspace({ ...session, friends });
      else removeWorkspace();
      setRemember(next);
      setStorageNotice(next ? 'Profile and friends saved on this device.' : 'Saved copy removed. Your profile and friends remain available for this session.');
    } catch {
      setStorageNotice('Device storage is unavailable. Your saved-profile preference could not be changed.');
    }
  };

  const handleFriendsChange = (next: FriendProfile[]) => {
    setFriends(next);
    setStorageNotice(null);
    if (remember && session) {
      try {
        saveWorkspace({ ...session, friends: next });
      } catch {
        setStorageNotice('Friends updated for this session, but the saved copy could not be updated.');
      }
    }
  };

  const clearProfile = () => {
    let notice: string | null = null;
    try {
      removeWorkspace();
    } catch {
      if (remember) {
        setStorageNotice('The saved copy could not be removed from this device. Try disabling storage restrictions and clearing again.');
        return false;
      }
      notice = 'Session cleared. Device storage could not be accessed, so any older saved copy could not be removed.';
    }
    setSession(null);
    setFriends([]);
    setRemember(false);
    setError(null);
    setStorageNotice(notice);
    return true;
  };

  return {
    session, friends, remember, storageNotice, error,
    completeProfile, handleRemember, handleFriendsChange, clearProfile,
    clearError: () => setError(null),
  };
}
