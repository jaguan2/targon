import { useEffect, useRef, type FormEvent } from 'react';
import { resolveBirthMoment, type BirthInput } from '@/lib/chart';
import { CITIES } from '@/lib/cities';
import { getPronouns, type Profile } from '@/lib/profile';

interface Props {
  profile: Profile;
  birth: BirthInput;
  onEditName: () => void;
  onEditBirth: () => void;
  onConfirm: () => void;
}

/** A separate confirmation screen; nothing is created until the final submit. */
export function ProfileReview({ profile, birth, onEditName, onEditBirth, onConfirm }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const hasTime = birth.hour !== undefined;
  const hasPlace = birth.latitude !== undefined;
  const city = CITIES.find((item) => item.latitude === birth.latitude && item.longitude === birth.longitude);
  const date = `${String(birth.year).padStart(4, '0')}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`;
  const time = hasTime ? `${String(birth.hour).padStart(2, '0')}:${String(birth.minute ?? 0).padStart(2, '0')}` : 'Not provided — noon estimate';
  const place = city?.name ?? (hasPlace ? `${birth.latitude}°, ${birth.longitude}°` : 'Not provided');
  const { timeZone } = resolveBirthMoment(birth);
  const submit = (event: FormEvent) => { event.preventDefault(); onConfirm(); };

  return (
    <form className="panel profile-review" data-intake-stage="review" onSubmit={submit}>
      <p className="step-count">One last look</p>
      <h2 ref={heading} tabIndex={-1}>Review your details</h2>
      <p className="panel__hint">Check everything below before creating your profile.</p>
      <dl className="intake-review" aria-label="Your answers">
        <div><dt>Name</dt><dd>{profile.name || 'Not provided'}</dd></div>
        {profile.pronouns !== 'unspecified' && <div><dt>Pronouns</dt><dd>{getPronouns(profile.pronouns).label}</dd></div>}
        <div><dt>Birthday</dt><dd>{date}</dd></div>
        <div><dt>Birth location</dt><dd>{place}</dd></div>
        <div><dt>Birth time</dt><dd>{time}{birth.timeOccurrence ? ` · ${birth.timeOccurrence === 'earlier' ? 'first' : 'second'} clock occurrence` : ''}</dd></div>
        <div><dt>Birth timezone</dt><dd>{timeZone}{!hasPlace && !birth.timeZone ? ' · assumed' : ''}</dd></div>
      </dl>
      <div className="review-edit-actions">
        <button className="secondary" type="button" onClick={onEditName}>Edit name</button>
        <button className="secondary" type="button" onClick={onEditBirth}>Edit birth details</button>
      </div>
      {(!hasTime || !hasPlace) && <p className="warning">
        {!hasTime
          ? 'Without a birth time, planetary placements are estimates based on noon. Rising, Descendant and houses will be unavailable.'
          : 'Without a birth location, Rising, Descendant and houses will be unavailable. Planetary placements use the time and timezone you supplied.'}
      </p>}
      <button className="primary" type="submit">Create my profile</button>
    </form>
  );
}
