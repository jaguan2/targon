import { useState } from 'react';
import { computeChart, type BirthInput, type NatalChart } from './domain/chart';
import {
  describeProfile,
  greetingName,
  possessiveName,
  type Profile,
} from './domain/profile';
import { Starfield } from './ui/Starfield';
import { Onboarding } from './ui/Onboarding';
import { ChartReadout } from './ui/ChartReadout';
import { Ranking } from './ui/Ranking';
import { StarChart } from './ui/StarChart';
import { useCompatibility } from './ui/useCompatibility';

interface Session {
  profile: Profile;
  chart: NatalChart;
}

/**
 * Split out so `useCompatibility` has a chart to work with — hooks cannot be
 * called conditionally, and there is no chart until onboarding completes.
 */
function Results({ profile, chart }: Session) {
  const { mode, setMode, availableModes, ranked } = useCompatibility(chart);

  const summary = describeProfile(
    profile,
    {
      sun: chart.placements.get('sun')?.sign,
      moon: chart.placements.get('moon')?.sign,
      rising: chart.placements.get('ascendant')?.sign,
    },
    ranked[0]?.target.name,
  );

  return (
    <>
      <p className="profile-summary">{summary}</p>
      <StarChart chart={chart} ranked={ranked} title={`${possessiveName(profile)} sky`} />
      <ChartReadout chart={chart} />
      <Ranking
        chart={chart}
        ranked={ranked}
        mode={mode}
        availableModes={availableModes}
        onModeChange={setMode}
      />
    </>
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = (profile: Profile, birth: BirthInput) => {
    try {
      setSession({
        profile,
        chart: computeChart(birth, { houseSystem: 'placidus' }),
      });
      setError(null);
    } catch (cause) {
      setSession(null);
      setError(
        cause instanceof Error ? cause.message : 'Could not compute that chart.',
      );
    }
  };

  const name = session ? greetingName(session.profile) : null;

  return (
    <>
      <Starfield />
      <main className="shell">
        <header className="masthead">
          <h1>Star</h1>
          <p>
            {name
              ? `Welcome, ${name}.`
              : 'A birth chart, and the distances between signs.'}
          </p>
        </header>

        {session ? (
          <>
            <Results {...session} />
            <div className="restart">
              <button
                className="secondary"
                type="button"
                onClick={() => setSession(null)}
              >
                Start over
              </button>
            </div>
          </>
        ) : (
          <Onboarding onComplete={handleComplete} />
        )}

        {error && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}

        <p className="footnote">
          Positions are computed from a real ephemeris, accurate to about an
          arcminute. The compatibility readings are traditional astrological
          interpretation — a symbolic system worth exploring, not a predictive
          one.
        </p>
      </main>
    </>
  );
}
