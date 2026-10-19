import { useState, type FormEvent } from 'react';
import type { BirthInput } from '../domain/chart';
import { greetingName, type Profile } from '../domain/profile';
import { CITIES } from './cities';
import { birthFromDraft, createBirthDraft, MANUAL_PLACE, type BirthDraft } from './birthDetails';

interface Props {
  profile: Profile;
  onSubmit: (input: BirthInput) => void;
  onBack: () => void;
  draft?: BirthDraft;
  onDraftChange?: (draft: BirthDraft) => void;
  submitLabel?: string;
  subject?: 'self' | 'friend';
}

export function BirthForm({ profile, onSubmit, onBack, draft, onDraftChange, submitLabel = 'Chart it', subject = 'self' }: Props) {
  const [localDraft, setLocalDraft] = useState(() => createBirthDraft());
  const [error, setError] = useState<string | null>(null);
  const value = draft ?? localDraft;
  const update = (patch: Partial<BirthDraft>) => {
    const next = { ...value, ...patch };
    setLocalDraft(next);
    onDraftChange?.(next);
    setError(null);
  };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const birth = birthFromDraft(value);
      setError(null);
      onSubmit(birth);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check your birth details.');
    }
  };

  return (
    <form className="panel birth-form" onSubmit={handleSubmit}>
      <p className="step-count">Step 2 of 2</p>
      <h2>{subject === 'friend' ? `Birth details for ${greetingName(profile) ?? 'your friend'}` : greetingName(profile) ? `Now the sky, ${greetingName(profile)}` : 'Now the sky'}</h2>
      <p className="panel__hint">
        {subject === 'friend' ? 'Enter their birth date, local clock time and birth place. Only the date is required. These details stay on this device.' : 'Enter the date, local clock time and place of your birth. Only the date is required. Your details stay on this device.'}
      </p>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="date">Birth date</label>
          <input id="date" type="date" value={value.date} required min="0001-01-01" max="9999-12-31" onChange={(e) => update({ date: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="time">Birth time <span className="optional-tag">optional</span></label>
          <input id="time" type="time" value={value.time} aria-describedby="time-help" onChange={(e) => update({ time: e.target.value, timeOccurrence: '' })} />
          <small id="time-help" className="field-help">Use the time on {subject === 'friend' ? 'their' : 'your'} birth record. Leave blank if unknown; positions will be estimates.</small>
        </div>
      </div>
      <fieldset className="fieldset">
        <legend>Birth place <span className="optional-tag">for Rising and Descendant</span></legend>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="city">City of birth</label>
            <select id="city" value={value.city} aria-describedby="place-help" onChange={(e) => update({ city: e.target.value, timeOccurrence: '' })}>
              <option value="">Not sure / skip</option>
              {CITIES.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
              <option value={MANUAL_PLACE}>Enter coordinates…</option>
            </select>
          </div>
          {value.city === MANUAL_PLACE && <>
            <div className="field">
              <label htmlFor="lat">Latitude</label>
              <input id="lat" type="number" step="any" min="-90" max="90" required placeholder="40.7128" value={value.latitude} onChange={(e) => update({ latitude: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="lon">Longitude</label>
              <input id="lon" type="number" step="any" min="-180" max="180" required placeholder="-74.0060" value={value.longitude} onChange={(e) => update({ longitude: e.target.value })} />
            </div>
          </>}
        </div>
        <p id="place-help" className="field-help">Use {subject === 'friend' ? 'where they were born, rather than where they live now' : 'where you were born, rather than where you live now'}. A place sets the historical timezone even when the birth time is unknown. Rising, Descendant and houses need both a time and place.</p>
      </fieldset>
      <details className="birth-options" open={Boolean(value.time && !value.city) || Boolean(error?.includes('occurred twice')) || undefined}>
        <summary>Timezone and clock-change options</summary>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="timezone">Birth timezone {value.time && !value.city ? '(required without a place)' : '(override)'}</label>
            <input id="timezone" type="text" value={value.timeZone} placeholder="America/New_York" required={Boolean(value.time && !value.city)} autoCapitalize="none" spellCheck={false} aria-describedby="timezone-help" onChange={(e) => update({ timeZone: e.target.value, timeOccurrence: '' })} />
            <small id="timezone-help" className="field-help">Normally found from your birth place. Use a region such as America/New_York or Europe/London; enter UTC only for a time already recorded in UTC.</small>
          </div>
          {value.time && <div className="field">
            <label htmlFor="time-occurrence">If the clocks repeated this time</label>
            <select id="time-occurrence" value={value.timeOccurrence} onChange={(e) => update({ timeOccurrence: e.target.value as BirthDraft['timeOccurrence'] })}>
              <option value="">Not applicable / not sure</option>
              <option value="earlier">First occurrence (earlier instant)</option>
              <option value="later">Second occurrence (later instant)</option>
            </select>
            <small className="field-help">Only needed during a backward clock change. We will ask if this birth time is ambiguous.</small>
          </div>}
        </div>
      </details>
      {error && <p className="warning" role="alert">{error}</p>}
      <div className="step-actions">
        <button className="secondary" type="button" onClick={onBack}>Back</button>
        <button className="primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
