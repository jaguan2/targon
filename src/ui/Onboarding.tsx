import { useState } from 'react';
import type { BirthInput } from '../domain/chart';
import { EMPTY_PROFILE, type Profile } from '../domain/profile';
import { AboutYouStep } from './AboutYouStep';
import { BirthForm } from './BirthForm';
import { createBirthDraft } from './birthDetails';
import { ObservatoryArt } from './ObservatoryArt';

interface Props {
  onComplete: (profile: Profile, birth: BirthInput) => void;
  initialProfile?: Profile;
  initialBirth?: BirthInput;
  editing?: boolean;
  subject?: 'self' | 'friend';
}

const SETUP_STEPS = ['Name', 'Birthday', 'Birth time', 'Birthplace'];

/** First-time setup asks one question at a time; edits and friends stay compact. */
export function Onboarding({ onComplete, initialProfile = EMPTY_PROFILE, initialBirth, editing = false, subject = 'self' }: Props) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [draft, setDraft] = useState(() => createBirthDraft(initialBirth));
  const guided = subject === 'self' && !editing;
  const stage = !guided ? 'all' : step === 2 ? 'date' : step === 3 ? 'time' : 'place';

  const form = step === 1 ? (
      <AboutYouStep
        initial={profile}
        subject={subject}
        totalSteps={guided ? 4 : 2}
        onNext={(next) => {
          setProfile(next);
          setStep(2);
        }}
      />
    ) : (
    <BirthForm
      key={stage}
      profile={profile}
      subject={subject}
      stage={stage}
      draft={draft}
      onDraftChange={setDraft}
      submitLabel={subject === 'friend' ? editing ? 'Update friend' : 'Add friend' : editing ? 'Update profile' : 'Create my profile'}
      onBack={() => setStep((current) => current - 1)}
      onNext={() => setStep((current) => current + 1)}
      onSubmit={(birth) => onComplete(profile, birth)}
    />
  );

  if (subject === 'friend') return form;
  return (
    <div className="onboarding-layout">
      <aside className="intro-hero">
        <p className="step-count">A small guide to your universe</p>
        <h2>{editing ? <>Return to<br />your beginning.</> : <>Written in the sky.<br /><em>Discovered by you.</em></>}</h2>
        <p className="intro-hero__copy">{step === 1
          ? 'Meet your Sun, Moon and Rising. Then explore the connections between your chart and the people in your orbit.'
          : 'A date begins the story. Your birth time and place reveal the horizon you arrived under.'}</p>
        <ObservatoryArt />
        <div className="intro-hero__note"><span aria-hidden="true">✧</span><p>No account needed. Your chart is calculated on your device, and saving is always your choice.</p></div>
      </aside>
      <div className="onboarding-form">
        {guided ? <ol className="intake-progress intake-progress--wizard" aria-label="Profile setup">
          {SETUP_STEPS.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={step > index + 1 ? 'is-complete' : ''}>
            <button type="button" disabled={index + 1 >= step} onClick={() => setStep(index + 1)} aria-label={`${index + 1 < step ? 'Back to ' : ''}${label}`}>
              <span className="intake-progress__number" aria-hidden="true">{step > index + 1 ? '✓' : `0${index + 1}`}</span><span>{label}</span>
            </button>
          </li>)}
        </ol> : <div className="intake-progress" aria-label={`Step ${step} of 2`}><span className="is-complete">01 <span>You</span></span><i aria-hidden="true" /><span className={step === 2 ? 'is-complete' : ''}>02 <span>Your birth sky</span></span></div>}
        {form}
      </div>
    </div>
  );
}
