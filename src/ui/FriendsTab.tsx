import { useMemo, useState } from 'react';
import { computeChart, type BirthInput, type NatalChart } from '../domain/chart';
import type { FriendProfile } from '../domain/friends';
import type { Profile } from '../domain/profile';
import { getSignByName } from '../domain/signs';
import { ChartReadout } from './ChartReadout';
import { FriendComparison } from './FriendComparison';
import { Onboarding } from './Onboarding';

interface Props {
  chart: NatalChart;
  friends: FriendProfile[];
  remember: boolean;
  storageNotice: string | null;
  onChange: (friends: FriendProfile[]) => void;
}

export function FriendsTab({ chart, friends, remember, storageNotice, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<'new' | FriendProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<{ friend: FriendProfile; index: number } | null>(null);
  const charts = useMemo(() => new Map(friends.map((friend) => {
    try {
      return [friend.id, computeChart(friend.birth, { houseSystem: 'placidus' })] as const;
    } catch {
      return [friend.id, null] as const;
    }
  })), [friends]);
  const selected = friends.find((friend) => friend.id === selectedId) ?? null;
  const selectedChart = selected ? charts.get(selected.id) : null;

  const complete = (profile: Profile, birth: BirthInput) => {
    try {
      if (!profile.name.trim()) throw new Error('Enter a name for this friend.');
      computeChart(birth, { houseSystem: 'placidus' });
      const friend = { profile, birth, id: editor && editor !== 'new' ? editor.id : crypto.randomUUID() };
      const next = friends.some((item) => item.id === friend.id)
        ? friends.map((item) => item.id === friend.id ? friend : item)
        : [...friends, friend];
      onChange(next);
      setSelectedId(friend.id);
      setEditor(null);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not calculate this friend’s chart.');
    }
  };

  const remove = (friend: FriendProfile) => {
    setRemoved({ friend, index: friends.findIndex((item) => item.id === friend.id) });
    onChange(friends.filter((item) => item.id !== friend.id));
    if (selectedId === friend.id) setSelectedId(null);
  };
  const undo = () => {
    if (!removed) return;
    const next = [...friends];
    if (!next.some((item) => item.id === removed.friend.id)) next.splice(removed.index, 0, removed.friend);
    onChange(next);
    setSelectedId(removed.friend.id);
    setRemoved(null);
  };

  return (
    <div className="friends-tab">
      <section className="friends-header">
        <div>
          <p className="step-count">The people in your orbit</p>
          <h2>Your constellation</h2>
          <p>{friends.length ? `${friends.length} ${friends.length === 1 ? 'person' : 'people'} to explore the stars with.` : 'Every connection has its own constellation. Start with someone you know.'}</p>
        </div>
        {!editor && <button className="primary" type="button" onClick={() => { setEditor('new'); setError(null); }}>Add a friend</button>}
      </section>
      <p className="field-help">{remember ? 'Friends are remembered on this device with your profile.' : 'Friends are available for this session. Enable “Remember profile on this device” in Profile to keep them after closing.'} These are local birth profiles; no invitations or messages are sent.</p>
      {storageNotice && <p className="warning" role="status">{storageNotice}</p>}
      {removed && <div className="friend-undo" role="status"><span>{removed.friend.profile.name} removed.</span><button className="secondary" type="button" onClick={undo}>Undo removal</button></div>}

      {editor ? (
        <div className="friend-editor">
          <div className="edit-banner">
            <p>{editor === 'new' ? 'New friend' : `Editing ${editor.profile.name}`}</p>
            <button className="secondary" type="button" onClick={() => { setEditor(null); setError(null); }}>Cancel friend editing</button>
          </div>
          <Onboarding key={editor === 'new' ? 'new' : editor.id} subject="friend" editing={editor !== 'new'} onComplete={complete} {...(editor === 'new' ? {} : { initialProfile: editor.profile, initialBirth: editor.birth })} />
          {error && <p className="warning" role="alert">{error}</p>}
        </div>
      ) : friends.length === 0 ? (
        <section className="panel friends-empty">
          <span className="friends-empty__mark" aria-hidden="true">✧ · ✦ · ✧</span>
          <h3>A little birth data. A new perspective.</h3>
          <p>Add a name and birth date to begin. A time and place reveal their Rising sign and allow a more precise comparison.</p>
        </section>
      ) : (
        <>
          <ul className="friend-grid" aria-label="Your friends">
            {friends.map((friend) => {
              const friendChart = charts.get(friend.id);
              const sun = friendChart?.placements.get('sun');
              const sign = sun ? getSignByName(sun.sign) : null;
              return (
                <li className={`friend-card${selectedId === friend.id ? ' friend-card--selected' : ''}`} key={friend.id}>
                  <span className="friend-avatar" aria-hidden="true">{sign?.glyph ?? '✧'}</span>
                  <div className="friend-card__identity">
                    <h3>{friend.profile.name}</h3>
                    <p>{sign ? `${sign.label} Sun${friendChart?.tier === 'date' ? ' · estimated' : ''}` : 'Chart needs attention'}</p>
                  </div>
                  <div className="friend-card__actions">
                    <button type="button" className="secondary" aria-label={`Compare with ${friend.profile.name}`} aria-pressed={selectedId === friend.id} onClick={() => setSelectedId(friend.id)}>Compare</button>
                    <button type="button" className="secondary" aria-label={`Edit ${friend.profile.name}`} onClick={() => { setEditor(friend); setError(null); }}>Edit</button>
                    <button type="button" className="secondary" aria-label={`Remove ${friend.profile.name}`} onClick={() => remove(friend)}>Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
          {selected && selectedChart ? (
            <div className="friend-details">
              <FriendComparison key={selected.id} chart={chart} friendChart={selectedChart} name={selected.profile.name} />
              {chart.warnings.length > 0 && <details className="panel friend-chart-caveats"><summary>Assumptions in your chart</summary>{chart.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}</details>}
              <details className="friend-chart-details"><summary>View {selected.profile.name}’s birth chart and assumptions</summary><ChartReadout chart={selectedChart} title={`${selected.profile.name}’s signs & placements`} /></details>
            </div>
          ) : selected ? <p className="warning" role="alert">This birth chart could not be restored. Edit the friend’s birth details to recalculate it.</p> : <p className="friends-prompt">Choose Compare to explore a connection.</p>}
        </>
      )}
    </div>
  );
}
