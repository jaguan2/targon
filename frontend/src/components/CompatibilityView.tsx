import type { NatalChart } from '@/lib/chart';
import { describeProfile, possessiveName, type Profile } from '@/lib/profile';
import { MODE_LABELS } from '@/lib/compatibility';
import { useCompatibility } from '@/hooks/useCompatibility';
import { Ranking } from './Ranking';
import { StarChart } from './StarChart';

export function CompatibilityView({ profile, chart }: { profile: Profile; chart: NatalChart }) {
  const { mode, setMode, availableModes, ranked } = useCompatibility(chart);
  const summary = describeProfile(profile, {
    sun: chart.placements.get('sun')?.sign,
    moon: chart.placements.get('moon')?.sign,
    rising: chart.placements.get('ascendant')?.sign,
  }, ranked[0]?.target.name);
  return (
    <>
      <header className="results-heading">
        <p className="step-count">The space between signs</p>
        <h2>Follow the connections.</h2>
        <p>Different connections bring out different sides of you. Choose a lens to explore yours.</p>
        <div className="mode-switch" role="group" aria-label="Compatibility lens">
          {availableModes.map((m) => <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{MODE_LABELS[m]}</button>)}
        </div>
      </header>
      {chart.tier === 'date' ? (
        <p className="warning">These sign connections use estimated noon positions because your birth time is unknown. Check your Profile for assumptions and missing placements.</p>
      ) : <p className="profile-summary">{summary}</p>}
      <p className="panel__hint">Explore your chart against the twelve signs. Scores use a symbolic sign-based model; they are not percentages or comparisons with another person’s full chart.</p>
      <ol className="connection-highlights" aria-label="Strongest sign connections">
        {ranked.slice(0, 3).map((entry, index) => <li key={entry.target.name}>
          <div className="highlight-heading"><span className="step-count">0{index + 1} / {index === 0 ? 'Strongest connection' : 'In your orbit'}</span><span className="highlight-glyph" aria-hidden="true">{entry.target.glyph}</span></div>
          <div className="highlight-name"><h3>{entry.target.label}</h3><span>{entry.score}<small>index</small></span></div><p>{entry.summary}</p>
        </li>)}
      </ol>
      <div className="results-layout">
      <StarChart chart={chart} ranked={ranked} title={`${possessiveName(profile)} sky`} />
      <Ranking chart={chart} ranked={ranked} />
      </div>
    </>
  );
}

