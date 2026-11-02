import { useState } from 'react';
import type { BirthInput } from '@/lib/chart';
import { EMPTY_PROFILE, type Profile } from '@/lib/profile';
import { AboutYouStep } from './AboutYouStep';
import { BirthForm } from './BirthForm';
import { createBirthDraft } from '@/lib/birthDetails';
import { ProfileReview } from './ProfileReview';

interface Props {
  onComplete: (profile: Profile, birth: BirthInput) => void;
  initialProfile?: Profile;
  initialBirth?: BirthInput;
  editing?: boolean;
  subject?: 'self' | 'friend';
}

const SETUP_STEPS = ['Name', 'Birth details', 'Review'];

/** Two input steps, followed by review. Existing profiles and friends edit directly. */
export function Onboarding({ onComplete, initialProfile = EMPTY_PROFILE, initialBirth, editing = false, subject = 'self' }: Props) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [draft, setDraft] = useState(() => createBirthDraft(initialBirth));
  const [pendingBirth, setPendingBirth] = useState<BirthInput | null>(null);
  const guided = subject === 'self' && !editing;

  const form = step === 1 ? (
      <AboutYouStep
        initial={profile}
        subject={subject}
        totalSteps={2}
        onNext={(next) => {
          setProfile(next);
          setStep(2);
        }}
      />
    ) : step === 3 && pendingBirth ? (
      <ProfileReview
        profile={profile}
        birth={pendingBirth}
        onEditName={() => setStep(1)}
        onEditBirth={() => setStep(2)}
        onConfirm={() => onComplete(profile, pendingBirth)}
      />
    ) : (
    <BirthForm
      profile={profile}
      subject={subject}
      draft={draft}
      onDraftChange={setDraft}
      submitLabel={subject === 'friend' ? editing ? 'Update friend' : 'Add friend' : editing ? 'Update profile' : 'Review details'}
      onBack={() => setStep((current) => current - 1)}
      onSubmit={(birth) => {
        if (guided) {
          setPendingBirth(birth);
          setStep(3);
        } else onComplete(profile, birth);
      }}
    />
  );

  if (subject === 'friend') return form;
  return (
    <div className="onboarding-layout">
      <aside className="intro-hero">
        <p className="step-count"><span className="sky-spark" aria-hidden="true">✦</span> A little closer to the stars</p>
        <h2>{editing ? <>Return to<br />your beginning.</> : <>The sky remembers<br /><span>your beginning.</span></>}</h2>
        <p className="intro-hero__copy">{step === 1
          ? 'Meet your Sun, Moon and Rising. Then explore the connections between your chart and the people in your orbit.'
          : 'A date begins the story. Your birth time and place reveal the horizon you arrived under.'}</p>
        <div className="intro-hero__note"><span aria-hidden="true">✧</span><p>Just you and the stars. No account needed.<br />Calculated on your device. Saved only if you choose.</p></div>
      </aside>
      <div className="onboarding-form">
        {guided ? <ol className="intake-progress intake-progress--wizard" aria-label="Profile setup">
          {SETUP_STEPS.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={step > index + 1 ? 'is-complete' : ''}>
            <button type="button" disabled={index + 1 >= step} onClick={() => setStep(index + 1)} aria-label={`${index + 1 < step ? 'Back to ' : ''}${label}`}>
              {label}
            </button>
          </li>)}
        </ol> : <div className="intake-progress" aria-label={`Step ${step} of 2`}><span className="is-complete">01 <span>You</span></span><i aria-hidden="true" /><span className={step === 2 ? 'is-complete' : ''}>02 <span>Your birth sky</span></span></div>}
        {form}
      </div>
    </div>
  );
}
