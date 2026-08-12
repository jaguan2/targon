import { useState, type FormEvent } from 'react';
import {
  PRONOUN_SETS,
  type Profile,
  type PronounKey,
} from '../domain/profile';

interface Props {
  initial: Profile;
  onNext: (profile: Profile) => void;
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
export function AboutYouStep({ initial, onNext }: Props) {
  const [name, setName] = useState(initial.name);
  const [pronouns, setPronouns] = useState<PronounKey>(initial.pronouns);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onNext({ name: name.trim(), pronouns });
  };

  const trimmed = name.trim();

  return (
    <form className="panel panel--intro" onSubmit={handleSubmit}>
      <div className="intro">
        <ConstellationMark />
        <p className="step-count">Step 1 of 2</p>
        <h2>Tell us about yourself</h2>
        <p className="intro__lede">
          Nothing here changes your chart — that depends only on when and where
          you were born. It just lets us talk to you properly.
        </p>
      </div>

      <div className="field field--feature">
        <label htmlFor="name">What should we call you?</label>
        <input
          id="name"
          type="text"
          autoComplete="given-name"
          placeholder="Your name"
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <fieldset className="fieldset fieldset--centred">
        <legend>
          And your pronouns?
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

      <button className="primary" type="submit">
        {trimmed ? `Nice to meet you, ${trimmed}` : 'Continue'}
      </button>

      <p className="intro__skip">
        Both are optional — carry on without them if you would rather.
      </p>
    </form>
  );
}
