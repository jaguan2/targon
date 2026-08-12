import { useState, type FormEvent } from 'react';
import type { BirthInput } from '../domain/chart';
import { greetingName, type Profile } from '../domain/profile';
import { CITIES } from './cities';

interface Props {
  profile: Profile;
  onSubmit: (input: BirthInput) => void;
  onBack: () => void;
}

const MANUAL = '__manual__';

/**
 * Birth data entry.
 *
 * Time and place are optional by design — plenty of people genuinely do not
 * know their birth time, and refusing to show them anything until they find it
 * is a bad trade. The chart degrades tier by tier instead, and says what each
 * missing field would unlock.
 */
export function BirthForm({ profile, onSubmit, onBack }: Props) {
  const [date, setDate] = useState('1990-07-04');
  const [time, setTime] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) {
      setError('Please enter a birth date.');
      return;
    }

    const input: BirthInput = { year, month, day };

    if (time) {
      const [hour, minute] = time.split(':').map(Number);
      input.hour = hour ?? 0;
      input.minute = minute ?? 0;
    }

    if (city && city !== MANUAL) {
      const match = CITIES.find((c) => c.name === city);
      if (match) {
        input.latitude = match.latitude;
        input.longitude = match.longitude;
      }
    } else if (city === MANUAL && latitude && longitude) {
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        setError('Latitude must be between -90 and 90.');
        return;
      }
      if (Number.isNaN(lon) || lon < -180 || lon > 180) {
        setError('Longitude must be between -180 and 180.');
        return;
      }
      input.latitude = lat;
      input.longitude = lon;
    }

    // A place without a time buys nothing: the angles need both.
    if (input.latitude !== undefined && input.hour === undefined) {
      setError('A birth time is needed before a birth place can be used.');
      return;
    }

    onSubmit(input);
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <p className="step-count">Step 2 of 2</p>
      <h2>
        {greetingName(profile)
          ? `Now the sky, ${greetingName(profile)}`
          : 'Now the sky'}
      </h2>
      <p className="panel__hint">
        Only the date is required. Everything is calculated on this device —
        nothing is uploaded anywhere.
      </p>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="date">Birth date</label>
          <input
            id="date"
            type="date"
            value={date}
            required
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="time">
            Birth time
            <span className="optional-tag">unlocks the Moon</span>
          </label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <fieldset className="fieldset">
        <legend>
          Birth place
          <span className="optional-tag">unlocks your Rising sign</span>
        </legend>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="city">City</label>
            <select
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">Not sure / skip</option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
              <option value={MANUAL}>Enter coordinates…</option>
            </select>
          </div>

          {city === MANUAL && (
            <>
              <div className="field">
                <label htmlFor="lat">Latitude</label>
                <input
                  id="lat"
                  inputMode="decimal"
                  placeholder="40.7128"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="lon">Longitude</label>
                <input
                  id="lon"
                  inputMode="decimal"
                  placeholder="-74.0060"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </fieldset>

      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}

      <div className="step-actions">
        <button className="secondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="primary" type="submit">
          Chart it
        </button>
      </div>
    </form>
  );
}
