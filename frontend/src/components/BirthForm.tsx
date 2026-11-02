import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { BirthInput } from '@/lib/chart';
import { greetingName, type Profile } from '@/lib/profile';
import { CITIES } from '@/lib/cities';
import { birthFromDraft, createBirthDraft, MANUAL_PLACE, type BirthDraft } from '@/lib/birthDetails';
import tzLookup from 'tz-lookup';

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
  const [citySearch, setCitySearch] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);
  const value = draft ?? localDraft;
  const hasTime = Boolean(value.time && !value.timeUnknown);
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
      const birth = birthFromDraft(value);
      setError(null);
      onSubmit(birth);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check your birth details.');
    }
  };

  return (
    <form className="panel birth-form" data-intake-stage="birth" onSubmit={handleSubmit}>
      <p className="step-count">Step 2 of 2</p>
      <h2 ref={heading} tabIndex={-1}>{subject === 'friend' ? `Birth details for ${greetingName(profile) ?? 'your friend'}` : 'Your birth details'}</h2>
      <p className="panel__hint">Only the birthday is required. Add a birth location and time for a more precise chart.</p>
      <div className="field">
        <label htmlFor="date">Birth date</label>
        <input id="date" type="date" value={value.date} required min="0001-01-01" max="9999-12-31" onChange={(e) => update({ date: e.target.value })} />
      </div>
      <fieldset className="fieldset">
        <legend>Birth location <span className="optional-tag">optional</span></legend>
        <div className="field-grid">
          <div className="field city-search">
            <label htmlFor="city-search">Find a listed city</label>
            <input id="city-search" type="search" placeholder="Search the offline list" value={citySearch} autoComplete="off" onChange={(e) => setCitySearch(e.target.value)} />
            {search && <small className="field-help" role="status">{matchingCities.length ? `${matchingCities.length} ${matchingCities.length === 1 ? 'city matches' : 'cities match'}. Choose below.` : 'No listed city matches. Choose "Enter coordinates..." below for another place.'}</small>}
          </div>
          <div className="field city-select">
            <label htmlFor="city">City of birth</label>
            <select id="city" value={value.city} aria-describedby="place-help" onChange={(e) => update({ city: e.target.value, timeOccurrence: '' })}>
              <option value="">Not sure / skip</option>
              {visibleCities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
              <option value={MANUAL_PLACE}>Enter coordinates...</option>
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
        {placeZone && <p className="place-zone">{value.timeZone.trim() || placeZone} <span>{value.timeZone.trim() ? 'timezone override' : 'timezone from birth location'}</span></p>}
        <p id="place-help" className="field-help">Use {subject === 'friend' ? 'their' : 'your'} birth location, rather than the current location.</p>
      </fieldset>
      <div className="field birth-time-field">
        <label htmlFor="time">Birth time <span className="optional-tag">optional</span></label>
        <input id="time" type="time" value={value.time} disabled={value.timeUnknown} aria-describedby="time-help" onChange={(e) => update({ time: e.target.value, timeUnknown: false, timeOccurrence: '' })} />
        <label className="unknown-time"><input type="checkbox" checked={value.timeUnknown} onChange={(e) => update({ timeUnknown: e.target.checked, time: '', timeOccurrence: '' })} />I don't know the birth time</label>
        <small id="time-help" className="field-help">Use the local time on the birth record, or leave it blank.</small>
      </div>
      <details className="birth-options" open={Boolean(hasTime && !value.city) || Boolean(error?.includes('occurred twice')) || undefined}>
        <summary>Timezone and clock-change options</summary>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="timezone">Birth timezone {hasTime && !value.city ? '(required without a location)' : '(override)'}</label>
            <input id="timezone" type="text" value={value.timeZone} placeholder="America/New_York" required={hasTime && !value.city} autoCapitalize="none" spellCheck={false} aria-describedby="timezone-help" onChange={(e) => update({ timeZone: e.target.value, timeOccurrence: '' })} />
            <small id="timezone-help" className="field-help">A birth time needs a timezone. We find it from the birth location, or you can enter one here, such as America/New_York.</small>
          </div>
          {hasTime && <div className="field">
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
      <p className="field-help birth-accuracy">Without a birth time, planetary placements are estimates based on noon. Rising, Descendant and houses need both a time and location.</p>
      {error && <p className="warning" role="alert">{error}</p>}
      <div className="step-actions">
        <button className="secondary" type="button" onClick={onBack}>Back</button>
        <button className="primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
