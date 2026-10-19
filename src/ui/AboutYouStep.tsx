import { useState, type FormEvent } from 'react';
import {
  PRONOUN_SETS,
  type Profile,
  type PronounKey,
} from '../domain/profile';

interface Props {
  initial: Profile;
  onNext: (profile: Profile) => void;
  subject?: 'self' | 'friend';
}

/**
 * A small decorative constellation.
 *
 * Purely atmospheric, so it is hidden from assistive tech — it carries no
 * information the copy does not already give.
 */
function ConstellationMark() {
  const stars = [
    { x: 12, y: 40, r: 2 },
    { x: 38, y: 18, r: 3 },
    { x: 64, y: 34, r: 2.2 },
    { x: 88, y: 14, r: 2.6 },
    { x: 108, y: 42, r: 1.8 },
  ];

  return (
    <svg
      className="intro__mark"
      viewBox="0 0 120 56"
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={stars.map((s) => `${s.x},${s.y}`).join(' ')}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="0.75"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />
      {stars.map((star) => (
        <circle
          key={`${star.x}-${star.y}`}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="var(--gold)"
        />
      ))}
    </svg>
  );
}

/**
 * Step one. Deliberately light — a name and, if they want, pronouns.
 *
 * Nothing here is required. Someone who just wants to see a chart can press
 * straight through, and the app falls back to second person.
 */
export function AboutYouStep({ initial, onNext, subject = 'self' }: Props) {
  const [name, setName] = useState(initial.name);
  const [pronouns, setPronouns] = useState<PronounKey>(initial.pronouns);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (subject === 'friend' && !name.trim()) {
      setError('Enter a name so you can find this friend later.');
      return;
    }
    onNext({ name: name.trim(), pronouns });
  };

  const trimmed = name.trim();

  return (
    <form className="panel panel--intro" onSubmit={handleSubmit}>
      <div className="intro">
        <ConstellationMark />
        <p className="step-count">Step 1 of 2</p>
        <h2>{subject === 'friend' ? 'Add someone to your constellation' : 'Tell us about yourself'}</h2>
        <p className="intro__lede">
          {subject === 'friend'
            ? 'Start with a name or nickname, then add their birth details. Everything stays in this app on your device.'
            : 'Nothing here changes your chart — that depends only on when and where you were born. It just lets us talk to you properly.'}
        </p>
      </div>

      <div className="field field--feature">
        <label htmlFor="name">{subject === 'friend' ? 'Friend’s name or nickname' : 'What should we call you?'}</label>
        <input
          id="name"
          type="text"
          autoComplete={subject === 'friend' ? 'off' : 'given-name'}
          placeholder={subject === 'friend' ? 'Their name' : 'Your name'}
          value={name}
          maxLength={40}
          required={subject === 'friend'}
          autoFocus={subject === 'friend'}
          onChange={(event) => { setName(event.target.value); setError(null); }}
        />
      </div>

      <fieldset className="fieldset fieldset--centred">
        <legend>
          {subject === 'friend' ? 'Their pronouns?' : 'And your pronouns?'}
          <span className="optional-tag">optional</span>
        </legend>
        <div className="chip-row chip-row--centred">
          {PRONOUN_SETS.map((set) => (
            <button
              key={set.key}
              type="button"
              className="chip"
              aria-pressed={pronouns === set.key}
              onClick={() => setPronouns(set.key)}
            >
              {set.label}
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p className="warning" role="alert">{error}</p>}
      <button className="primary" type="submit">
        {subject === 'friend' ? 'Continue to birth details' : trimmed ? `Nice to meet you, ${trimmed}` : 'Continue'}
      </button>

      <p className="intro__skip">
        {subject === 'friend' ? 'A nickname is fine. Pronouns are optional and do not affect the comparison.' : 'Both are optional — carry on without them if you would rather.'}
      </p>
    </form>
  );
}
