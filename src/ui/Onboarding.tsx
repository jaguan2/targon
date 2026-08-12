import { useState } from 'react';
import type { BirthInput } from '../domain/chart';
import { EMPTY_PROFILE, type Profile } from '../domain/profile';
import { AboutYouStep } from './AboutYouStep';
import { BirthForm } from './BirthForm';

interface Props {
  onComplete: (profile: Profile, birth: BirthInput) => void;
}

/**
 * Two-step intake: who you are, then when and where you were born.
 *
 * Splitting it matters more than it looks. A single form opening with
 * "latitude" is a wall; opening with "what should we call you?" is a
 * conversation. The profile is held here so stepping back does not lose it.
 */
export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);

  if (step === 1) {
    return (
      <AboutYouStep
        initial={profile}
        onNext={(next) => {
          setProfile(next);
          setStep(2);
        }}
      />
    );
  }

  return (
    <BirthForm
      profile={profile}
      onBack={() => setStep(1)}
      onSubmit={(birth) => onComplete(profile, birth)}
    />
  );
}
