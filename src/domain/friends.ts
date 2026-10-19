import { decodeSavedProfile, type SavedProfile } from './savedProfile';

export interface FriendProfile extends SavedProfile {
  id: string;
}

export interface SavedWorkspace extends SavedProfile {
  friends: FriendProfile[];
}

export function encodeWorkspace(workspace: SavedWorkspace): string {
  return JSON.stringify({ version: 2, profile: workspace.profile, birth: workspace.birth, friends: workspace.friends });
}

/** Upgrade old single-person saves and validate every friend before restoration. */
export function decodeWorkspace(raw: string): SavedWorkspace {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== 'object' || !value || !('version' in value)) throw new Error('Invalid saved workspace.');
  if (value.version === 1) return { ...decodeSavedProfile(raw), friends: [] };
  if (value.version !== 2 || !('friends' in value) || !Array.isArray(value.friends)) throw new Error('Unsupported saved workspace.');
  const owner = decodeSavedProfile(JSON.stringify({ ...value, version: 1 }));
  const ids = new Set<string>();
  const friends = value.friends.map((item: unknown): FriendProfile => {
    if (typeof item !== 'object' || !item || !('id' in item) || typeof item.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) || ids.has(item.id)) {
      throw new Error('Invalid or duplicate friend identifier.');
    }
    ids.add(item.id);
    const friend = decodeSavedProfile(JSON.stringify({ ...item, version: 1 }));
    if (!friend.profile.name.trim()) throw new Error('A friend needs a name.');
    return { ...friend, id: item.id };
  });
  return { ...owner, friends };
}
