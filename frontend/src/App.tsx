import { useState } from 'react';
import type { BirthInput } from '@/lib/chart';
import { greetingName, type Profile } from '@/lib/profile';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Starfield } from '@/components/Starfield';
import { Onboarding } from '@/components/Onboarding';
import { ProfileView } from '@/components/ProfileView';
import { FriendsTab } from '@/components/FriendsTab';
import { CompatibilityView } from '@/components/CompatibilityView';
import { CometMark } from '@/components/CometMark';

export function App() {
  const {
    session, friends, remember, storageNotice, error,
    completeProfile, handleRemember, handleFriendsChange, clearProfile, clearError,
  } = useWorkspace();
  const [tab, setTab] = useState<'profile' | 'friends' | 'compatibility'>('profile');
  const [editing, setEditing] = useState(false);

  const handleComplete = (profile: Profile, birth: BirthInput) => {
    if (completeProfile(profile, birth)) {
      setEditing(false);
      setTab('profile');
    }
  };

  const handleReset = () => {
    if (clearProfile()) setEditing(false);
  };

  const name = session ? greetingName(session.profile) : null;
  return (
    <>
      <Starfield immersive={!session || editing} />
      <main className={`shell${!session || editing ? ' shell--intake' : ''}`}>
        <header className="masthead">
          <div className="brand"><CometMark /><div><h1>Targon<span className="brand__caption">Beneath the same sky</span></h1></div></div>
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
              <ProfileView profile={session.profile} chart={session.chart} remember={remember} storageNotice={storageNotice} onRemember={handleRemember} onEdit={() => { clearError(); setEditing(true); }} onReset={handleReset} onExplore={() => setTab('compatibility')} onFriends={() => setTab('friends')} />
            </div>
            <div hidden={tab !== 'friends'}>
              <FriendsTab chart={session.chart} friends={friends} remember={remember} storageNotice={storageNotice} onChange={handleFriendsChange} />
            </div>
            <div hidden={tab !== 'compatibility'}><CompatibilityView profile={session.profile} chart={session.chart} /></div>
          </>
        ) : (
          <>
            {editing && <div className="edit-banner"><p>Editing your profile. Changes apply when you finish both steps.</p><button className="secondary" type="button" onClick={() => { setEditing(false); clearError(); }}>Cancel editing</button></div>}
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
