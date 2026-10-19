import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { BirthInput } from '../domain/chart';
import { greetingName, type Profile } from '../domain/profile';
import { CITIES } from './cities';
import { birthFromDraft, createBirthDraft, MANUAL_PLACE, type BirthDraft } from './birthDetails';
import tzLookup from 'tz-lookup';

interface Props {
  profile: Profile;
  onSubmit: (input: BirthInput) => void;
  onBack: () => void;
  draft?: BirthDraft;
  onDraftChange?: (draft: BirthDraft) => void;
  submitLabel?: string;
  subject?: 'self' | 'friend';
  stage?: 'date' | 'time' | 'place' | 'all';
  onNext?: () => void;
}

export function BirthForm({ profile, onSubmit, onBack, draft, onDraftChange, submitLabel = 'Chart it', subject = 'self', stage = 'all', onNext }: Props) {
  const [localDraft, setLocalDraft] = useState(() => createBirthDraft());
  const [error, setError] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (stage !== 'all') heading.current?.focus(); }, [stage]);
  const value = draft ?? localDraft;
  const search = citySearch.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matchingCities = CITIES.filter((city) => city.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(search));
  const selectedCity = CITIES.find((city) => city.name === value.city);
  const visibleCities = selectedCity && !matchingCities.includes(selectedCity) ? [selectedCity, ...matchingCities] : matchingCities;
  const placeZone = selectedCity ? tzLookup(selectedCity.latitude, selectedCity.longitude) : null;
  const update = (patch: Partial<BirthDraft>) => {
    const next = { ...value, ...patch };
    setLocalDraft(next);
    onDraftChange?.(next);
    setError(null);
  };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    try {
      if (stage === 'date') {
        birthFromDraft({ ...value, time: '', timeUnknown: true, city: '', timeZone: '', timeOccurrence: '' });
        setError(null);
        onNext?.();
        return;
      }
      if (stage === 'time') {
        if (!value.timeUnknown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)) {
          throw new Error('Enter your birth time, or choose “I don’t know the birth time”.');
        }
        setError(null);
        onNext?.();
        return;
      }
      const birth = birthFromDraft(value);
      setError(null);
      onSubmit(birth);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check your birth details.');
    }
  };

  return (
    <form className={`panel birth-form${stage !== 'all' ? ' birth-form--guided' : ''}`} data-intake-stage={stage} onSubmit={handleSubmit}>
      <p className="step-count">{stage === 'all' ? 'Step 2 of 2' : `Step ${stage === 'date' ? 2 : stage === 'time' ? 3 : 4} of 4`}</p>
      <h2 ref={heading} tabIndex={-1}>{stage === 'date' ? 'When were you born?' : stage === 'time' ? 'What time did you arrive?' : stage === 'place' ? 'Where did your story begin?' : subject === 'friend' ? `Birth details for ${greetingName(profile) ?? 'your friend'}` : greetingName(profile) ? `Now the sky, ${greetingName(profile)}` : 'Now the sky'}</h2>
      <p className="panel__hint">
        {stage === 'date' ? 'Your birthday gives us a starting point for your Sun, Moon and planetary signs.' : stage === 'time' ? 'Use the local time recorded at your birth. It helps locate the Moon and your Rising sign more precisely.' : stage === 'place' ? 'Your birthplace sets the historical timezone and local horizon. Use where you were born, rather than where you live now.' : subject === 'friend' ? 'Enter their birth date, local clock time and birth place. Only the date is required. These details stay on this device.' : 'Enter the date, local clock time and place of your birth. Only the date is required. Your details stay on this device.'}
      </p>
      {stage === 'all' && <p className="birth-form__section"><span>01</span> The day you arrived</p>}
      {(stage === 'date' || stage === 'time' || stage === 'all') && <>
      <div className="field-grid">
        {(stage === 'date' || stage === 'all') && <div className="field">
          <label htmlFor="date">Birth date</label>
          <input id="date" type="date" value={value.date} required min="0001-01-01" max="9999-12-31" onChange={(e) => update({ date: e.target.value })} />
        </div>}
        {(stage === 'time' || stage === 'all') && <div className="field">
          <label htmlFor="time">Birth time <span className="optional-tag">optional</span></label>
          <input id="time" type="time" value={value.time} disabled={value.timeUnknown} aria-describedby="time-help" onChange={(e) => update({ time: e.target.value, timeUnknown: false, timeOccurrence: '' })} />
          <label className="unknown-time"><input type="checkbox" checked={value.timeUnknown} onChange={(e) => update({ timeUnknown: e.target.checked, time: '', timeOccurrence: '' })} />I don’t know the birth time</label>
          <small id="time-help" className="field-help">Use the time on {subject === 'friend' ? 'their' : 'your'} birth record. {stage === 'time' ? 'If you don’t know it, choose the option above.' : 'Leave blank if unknown; positions will be estimates.'}</small>
        </div>}
      </div>
      {stage === 'date' && <p className="field-help">Time and place come next. You can still explore your chart if you don’t know them.</p>}
      {stage === 'time' && <p className="warning">If your birth time is unknown, we’ll use a noon estimate and leave Rising, Descendant and houses unavailable.</p>}
      </>}
      {(stage === 'place' || stage === 'all') && <>
      <fieldset className="fieldset">
        <legend>Birth place <span className="optional-tag">for Rising and Descendant</span></legend>
        <div className="field-grid">
          <div className="field city-search">
            <label htmlFor="city-search">Find a listed city</label>
            <input id="city-search" type="search" placeholder="Search the offline list" value={citySearch} autoComplete="off" onChange={(e) => setCitySearch(e.target.value)} />
            {search && <small className="field-help" role="status">{matchingCities.length ? `${matchingCities.length} ${matchingCities.length === 1 ? 'city matches' : 'cities match'}. Choose below.` : 'No listed city matches. Choose “Enter coordinates…” below for another place.'}</small>}
          </div>
          <div className="field city-select">
            <label htmlFor="city">City of birth</label>
            <select id="city" value={value.city} aria-describedby="place-help" onChange={(e) => update({ city: e.target.value, timeOccurrence: '' })}>
              <option value="">Not sure / skip</option>
              {visibleCities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
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
        {placeZone && <p className="place-zone">↳ {value.timeZone.trim() || placeZone} <span>{value.timeZone.trim() ? 'timezone override' : 'timezone from your birth place'}</span></p>}
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
      {stage === 'place' && <dl className="intake-review" aria-label="Your answers"><div><dt>Name</dt><dd>{profile.name || 'Not supplied'}</dd></div><div><dt>Birthday</dt><dd>{value.date}</dd></div><div><dt>Birth time</dt><dd>{value.time && !value.timeUnknown ? `${value.time} · local time` : 'Unknown · noon estimate'}</dd></div></dl>}
      <div className="intake-outcome" aria-live="polite"><span aria-hidden="true">✧</span><p><strong>{value.time && !value.timeUnknown && value.city ? 'Your full birth sky' : 'A place to begin'}</strong>{value.time && !value.timeUnknown && value.city ? 'Time and place enable Rising, Descendant and houses.' : value.time && !value.timeUnknown ? 'Planetary placements use your birth time. Add a place for Rising and houses.' : 'We’ll use a noon estimate for planetary signs. Add a time and place whenever you find them.'}</p></div>
      </>}
      {error && <p className="warning" role="alert">{error}</p>}
      <div className="step-actions">
        <button className="secondary" type="button" onClick={onBack}>Back</button>
        <button className="primary" type="submit">{stage === 'date' || stage === 'time' ? 'Continue' : submitLabel}</button>
      </div>
    </form>
  );
}
