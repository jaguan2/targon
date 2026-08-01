import { useState } from 'react';
import { computeChart, type BirthInput, type NatalChart } from './domain/chart';
import { Starfield } from './ui/Starfield';
import { BirthForm } from './ui/BirthForm';
import { ChartReadout } from './ui/ChartReadout';
import { Ranking } from './ui/Ranking';

export function App() {
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (input: BirthInput) => {
    try {
      setChart(computeChart(input, { houseSystem: 'placidus' }));
      setError(null);
    } catch (cause) {
      setChart(null);
      setError(cause instanceof Error ? cause.message : 'Could not compute that chart.');
    }
  };

  return (
    <>
      <Starfield />
      <main className="shell">
        <header className="masthead">
          <h1>Star</h1>
          <p>A birth chart, and the distances between signs.</p>
        </header>

        <BirthForm onSubmit={handleSubmit} />

        {error && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}

        {chart && (
          <>
            <ChartReadout chart={chart} />
            <Ranking chart={chart} />
          </>
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
