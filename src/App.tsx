import { useState } from 'react';
import { computeChart, type BirthInput, type NatalChart } from './domain/chart';
import { describeProfile, greetingName, possessiveName, type Profile } from './domain/profile';
import { decodeSavedProfile, PROFILE_STORAGE_KEY, type SavedProfile } from './domain/savedProfile';
import { decodeWorkspace, encodeWorkspace, type FriendProfile, type SavedWorkspace } from './domain/friends';
import { Starfield } from './ui/Starfield';
import { Onboarding } from './ui/Onboarding';
import { ProfileView } from './ui/ProfileView';
import { Ranking } from './ui/Ranking';
import { StarChart } from './ui/StarChart';
import { useCompatibility } from './ui/useCompatibility';
import { FriendsTab } from './ui/FriendsTab';
import { MODE_LABELS } from './domain/compatibility';

interface Session extends SavedProfile {
  chart: NatalChart;
}

function loadSession(): { session: Session | null; friends: FriendProfile[]; notice: string | null } {
  if (typeof window === 'undefined') return { session: null, friends: [], notice: null };
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
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

function Results({ profile, chart }: Session) {
  const { mode, setMode, availableModes, ranked } = useCompatibility(chart);
  const summary = describeProfile(profile, {
    sun: chart.placements.get('sun')?.sign,
    moon: chart.placements.get('moon')?.sign,
    rising: chart.placements.get('ascendant')?.sign,
  }, ranked[0]?.target.name);
  return (
    <>
      <header className="results-heading">
        <p className="step-count">The space between signs</p>
        <h2>Follow the connections.</h2>
        <p>Different connections bring out different sides of you. Choose a lens to explore yours.</p>
        <div className="mode-switch" role="group" aria-label="Compatibility lens">
          {availableModes.map((m) => <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{MODE_LABELS[m]}</button>)}
        </div>
      </header>
      {chart.tier === 'date' ? (
        <p className="warning">These sign connections use estimated noon positions because your birth time is unknown. Check your Profile for assumptions and missing placements.</p>
      ) : <p className="profile-summary">{summary}</p>}
      <p className="panel__hint">Explore your chart against the twelve signs. Scores use a symbolic sign-based model; they are not percentages or comparisons with another person’s full chart.</p>
      <ol className="connection-highlights" aria-label="Strongest sign connections">
        {ranked.slice(0, 3).map((entry, index) => <li key={entry.target.name}>
          <div className="highlight-heading"><span className="step-count">0{index + 1} / {index === 0 ? 'Strongest connection' : 'In your orbit'}</span><span className="highlight-glyph" aria-hidden="true">{entry.target.glyph}</span></div>
          <div className="highlight-name"><h3>{entry.target.label}</h3><span>{entry.score}<small>index</small></span></div><p>{entry.summary}</p>
        </li>)}
      </ol>
      <div className="results-layout">
      <StarChart chart={chart} ranked={ranked} title={`${possessiveName(profile)} sky`} />
      <Ranking chart={chart} ranked={ranked} />
      </div>
    </>
  );
}

export function App() {
  const [initial] = useState(loadSession);
  const [session, setSession] = useState<Session | null>(initial.session);
  const [tab, setTab] = useState<'profile' | 'friends' | 'compatibility'>('profile');
  const [friends, setFriends] = useState<FriendProfile[]>(initial.friends);
  const [editing, setEditing] = useState(false);
  const [remember, setRemember] = useState(Boolean(initial.session));
  const [storageNotice, setStorageNotice] = useState<string | null>(initial.notice);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = (profile: Profile, birth: BirthInput) => {
    try {
      const chart = computeChart(birth, { houseSystem: 'placidus' });
      const next = { profile, birth, chart };
      setSession(next);
      setEditing(false);
      setTab('profile');
      setError(null);
      setStorageNotice(null);
      if (remember) {
        try {
          window.localStorage.setItem(PROFILE_STORAGE_KEY, encodeWorkspace({ ...next, friends }));
        } catch {
          setStorageNotice('Profile updated for this session, but the saved copy could not be updated.');
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not compute that chart.');
    }
  };

  const handleRemember = (next: boolean) => {
    if (!session) return;
    try {
      if (next) window.localStorage.setItem(PROFILE_STORAGE_KEY, encodeWorkspace({ ...session, friends }));
      else window.localStorage.removeItem(PROFILE_STORAGE_KEY);
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
        window.localStorage.setItem(PROFILE_STORAGE_KEY, encodeWorkspace({ ...session, friends: next }));
      } catch {
        setStorageNotice('Friends updated for this session, but the saved copy could not be updated.');
      }
    }
  };

  const handleReset = () => {
    let notice: string | null = null;
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      if (remember) {
        setStorageNotice('The saved copy could not be removed from this device. Try disabling storage restrictions and clearing again.');
        return;
      }
      notice = 'Session cleared. Device storage could not be accessed, so any older saved copy could not be removed.';
    }
    setSession(null);
    setFriends([]);
    setRemember(false);
    setEditing(false);
    setError(null);
    setStorageNotice(notice);
  };

  const name = session ? greetingName(session.profile) : null;
  return (
    <>
      <Starfield />
      <main className={`shell${!session || editing ? ' shell--intake' : ''}`}>
        <header className="masthead">
          <div className="brand"><span className="brand__mark" aria-hidden="true">✳</span><div><h1>Targon<span className="brand__caption">A personal observatory</span></h1></div></div>
        {session && !editing && (
          <nav className="profile-nav" aria-label="Main navigation">
            <button type="button" aria-pressed={tab === 'profile'} onClick={() => setTab('profile')}>Profile</button>
            <button type="button" aria-pressed={tab === 'friends'} onClick={() => setTab('friends')}>Friends</button>
            <button type="button" aria-pressed={tab === 'compatibility'} onClick={() => setTab('compatibility')}>Compatibility</button>
          </nav>
        )}
          <p className="masthead__note">{name ? `Your orbit, ${name}` : 'Look within. Connect beyond.'}</p>
        </header>
        {session && !editing ? (
          <>
            <div hidden={tab !== 'profile'}>
              <ProfileView profile={session.profile} chart={session.chart} remember={remember} storageNotice={storageNotice} onRemember={handleRemember} onEdit={() => { setError(null); setEditing(true); }} onReset={handleReset} onExplore={() => setTab('compatibility')} onFriends={() => setTab('friends')} />
            </div>
            <div hidden={tab !== 'friends'}>
              <FriendsTab chart={session.chart} friends={friends} remember={remember} storageNotice={storageNotice} onChange={handleFriendsChange} />
            </div>
            <div hidden={tab !== 'compatibility'}><Results {...session} /></div>
          </>
        ) : (
          <>
            {editing && <div className="edit-banner"><p>Editing your profile. Changes apply when you finish both steps.</p><button className="secondary" type="button" onClick={() => { setEditing(false); setError(null); }}>Cancel editing</button></div>}
            <Onboarding onComplete={handleComplete} {...(session ? { initialProfile: session.profile, initialBirth: session.birth } : {})} editing={editing} />
            {storageNotice && <p className="warning" role="status">{storageNotice}</p>}
          </>
        )}
        {error && <p className="warning" role="alert">{error}</p>}
        <p className="footnote">
          Planetary positions come from an astronomical ephemeris. Accuracy depends on your birth details.
          Compatibility readings use traditional astrological symbolism for exploration and reflection.
        </p>
      </main>
    </>
  );
}
