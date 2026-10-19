import type { NatalChart } from '../domain/chart';
import { greetingName, type Profile } from '../domain/profile';
import { ChartReadout } from './ChartReadout';
import { CITIES } from './cities';
import { useEffect, useRef } from 'react';

interface Props {
  profile: Profile;
  chart: NatalChart;
  remember: boolean;
  storageNotice: string | null;
  onRemember: (remember: boolean) => void;
  onEdit: () => void;
  onReset: () => void;
  onExplore: () => void;
  onFriends: () => void;
}

export function ProfileView({ profile, chart, remember, storageNotice, onRemember, onEdit, onReset, onExplore, onFriends }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [chart]);
  const input = chart.input;
  const city = CITIES.find((item) => item.latitude === input.latitude && item.longitude === input.longitude);
  const place = city?.name ?? (input.latitude !== undefined ? `${input.latitude}°, ${input.longitude}°` : 'Place not supplied');
  const date = `${String(input.year).padStart(4, '0')}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}`;
  const time = input.hour !== undefined ? `${String(input.hour).padStart(2, '0')}:${String(input.minute ?? 0).padStart(2, '0')}` : 'Unknown';

  return (
    <div className="profile-view">
      <header className="profile-welcome">
        <p className="step-count">Your cosmic profile</p>
        <div className="profile-heading">
          <div>
            <h2 ref={heading} tabIndex={-1}>{greetingName(profile) ?? 'Your place in the sky'}</h2>
            <p className="panel__hint">One moment in the universe. An entirely individual sky.</p>
          </div>
          <button type="button" className="secondary" onClick={onEdit}>Edit profile</button>
        </div>
      </header>
      <div className="profile-layout">
      <div className="profile-main">
      <ChartReadout chart={chart} />
      <section className="profile-next">
        <p className="step-count">Let your orbit grow</p>
        <h2>Every connection starts somewhere.</h2>
        <p>Explore how the signs connect with your chart, or bring someone you know into the picture.</p>
        <div><button type="button" className="primary" onClick={onExplore}>Explore compatibility</button><button type="button" className="secondary" onClick={onFriends}>Meet your constellation</button></div>
      </section>
      </div>
      <aside className="profile-sidebar">
      <section className="panel profile-overview">
        <div className="section-heading"><h2>Your starting point</h2><span className="chart-status">{chart.tier === 'place' ? 'Time + place' : chart.tier === 'date' ? 'Noon estimate' : 'Time supplied'}</span></div>
        <p className="panel__hint">The details behind your chart.</p>
        <dl className="birth-summary">
          <div><dt>Birth date</dt><dd>{date}</dd></div>
          <div><dt>Local birth time</dt><dd>{time}{input.timeOccurrence ? ` · ${input.timeOccurrence === 'earlier' ? 'first' : 'second'} occurrence` : ''}</dd></div>
          <div><dt>Birth place</dt><dd>{place}</dd></div>
          <div><dt>Birth timezone</dt><dd>{chart.timeZone}{input.timeZone ? ' · specified' : input.latitude !== undefined ? ' · from place' : ' · assumed'}</dd></div>
        </dl>
        <label className="remember-profile">
          <input type="checkbox" checked={remember} onChange={(event) => onRemember(event.target.checked)} />
          <span>Remember profile on this device<small>Stores your profile and friends’ birth details in this browser or desktop app. No account or upload.</small></span>
        </label>
        {storageNotice && <p className="warning" role="status">{storageNotice}</p>}
      </section>
      <section className="panel profile-guide">
        <details>
        <summary>Reading your chart</summary>
        <h2>How your profile is calculated</h2>
        <p>We use Western tropical zodiac signs. Planetary positions come from an astronomical ephemeris; Rising and setting points use your birth time and geographic coordinates.</p>
        <p>Your “falling” or setting sign is called the Descendant. It sits exactly opposite your Rising sign. Midheaven and Imum Coeli form the other pair of chart angles.</p>
        <p>Without a birth time, noon is a reference point, and planetary signs near a boundary may change. We leave Rising, Descendant and houses unavailable until you supply both time and place.</p>
        <p>These descriptions use traditional astrological symbolism. Compatibility scores are interpretive, rather than measured probabilities about a relationship.</p>
        </details>
      </section>
      <div className="restart"><button className="secondary" type="button" onClick={onReset}>Clear profile and start over</button><p className="field-help">Also clears your friends and the saved copy on this device.</p></div>
      </aside>
      </div>
    </div>
  );
}
