import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StarChart } from './StarChart';
import { BirthForm } from './BirthForm';
import { App } from '../App';
import { computeChart } from '../domain/chart';
import { rankSignsForChart } from '../domain/compatibility';
import { SIGNS } from '../domain/signs';

/**
 * Render smoke tests.
 *
 * These render the real components to markup, which catches the failures a
 * typecheck cannot: a crash during render, a filter that never gets defined,
 * a node drawn outside the viewBox. Effects do not run under static rendering,
 * so what we assert on is the initial paint — which is exactly the state a
 * user sees before any interaction.
 */

const fullChart = computeChart(
  {
    year: 1990,
    month: 7,
    day: 4,
    hour: 14,
    minute: 30,
    latitude: 40.7128,
    longitude: -74.006,
  },
  { houseSystem: 'placidus' },
);

const dateOnlyChart = computeChart({ year: 1990, month: 7, day: 4 });

function renderChart(chart = fullChart) {
  return renderToStaticMarkup(
    <StarChart chart={chart} ranked={rankSignsForChart(chart, 'general')} />,
  );
}

describe('StarChart rendering', () => {
  const markup = renderChart();

  it('renders an svg with the expected viewBox', () => {
    expect(markup).toContain('<svg');
    expect(markup).toContain('viewBox="-420 -420 840 840"');
  });

  it('names every sign', () => {
    for (const sign of SIGNS) {
      expect(markup, `missing ${sign.label}`).toContain(sign.label);
    }
  });

  it('draws the centre node', () => {
    expect(markup).toContain('>You<');
  });

  it('defines the glow filters it references', () => {
    expect(markup).toContain('id="node-glow"');
    expect(markup).toContain('url(#node-glow)');
  });

  it('draws twelve edges from the centre', () => {
    const lines = markup.match(/<line/g) ?? [];
    // 12 compatibility threads plus one tick per plotted placement.
    expect(lines.length).toBeGreaterThanOrEqual(12);
  });

  it('draws the zodiac ring in the default wheel view', () => {
    expect(markup).toContain('ring-sector');
    expect(markup).toContain('ring-glyph');
  });

  it('plots the natal placements on the ring', () => {
    expect(markup).toContain('natal-glyph');
    // Tooltips carry the real positions, e.g. "Sun at 12°31' Cancer".
    expect(markup).toMatch(/Sun at \d+°\d+&#x27;|Sun at \d+°\d+'/);
  });

  it('keeps every drawn point inside the viewBox', () => {
    const coordinates = [...markup.matchAll(/(?:cx|cy|x1|y1|x2|y2)="(-?[\d.]+)"/g)];
    expect(coordinates.length).toBeGreaterThan(0);
    for (const [, value] of coordinates) {
      expect(Math.abs(Number(value))).toBeLessThanOrEqual(420);
    }
  });

  it('offers both view modes', () => {
    expect(markup).toContain('Zodiac wheel');
    expect(markup).toContain('Constellation');
  });

  it('renders without a birth place, omitting the ring but keeping the nodes', () => {
    const reduced = renderChart(dateOnlyChart);
    expect(reduced).toContain('<svg');
    for (const sign of SIGNS) {
      expect(reduced).toContain(sign.label);
    }
  });
});

describe('App rendering', () => {
  const markup = renderToStaticMarkup(<App />);

  it('opens on the soft first step, not the birth form', () => {
    expect(markup).toContain('Step 1 of 4');
    expect(markup).toContain('What should we call you?');
    // Birth fields belong to step two and must not be on screen yet.
    expect(markup).not.toContain('Birth date');
    expect(markup).not.toContain('Chart it');
  });

  it('offers pronoun options', () => {
    expect(markup).toContain('she / her');
    expect(markup).toContain('he / him');
    expect(markup).toContain('they / them');
    expect(markup).toContain('rather not say');
  });

  it('renders the shell and starfield', () => {
    expect(markup).toContain('Targon');
    // The starfield draws its layers as box-shadows, not elements.
    expect(markup).toContain('starfield');
    expect(markup).toContain('box-shadow');
  });
});

describe('Onboarding step two', () => {
  it('greets by name and shows the birth fields', () => {
    const markup = renderToStaticMarkup(
      <BirthForm
        profile={{ name: 'Jason', pronouns: 'he' }}
        onSubmit={() => {}}
        onBack={() => {}}
      />,
    );
    expect(markup).toContain('Step 2 of 2');
    expect(markup).toContain('Now the sky, Jason');
    expect(markup).toContain('Birth date');
    expect(markup).toContain('Chart it');
    expect(markup).toContain('Back');
  });

  it('drops the greeting when no name was given', () => {
    const markup = renderToStaticMarkup(
      <BirthForm
        profile={{ name: '', pronouns: 'unspecified' }}
        onSubmit={() => {}}
        onBack={() => {}}
      />,
    );
    expect(markup).toContain('Now the sky');
    expect(markup).not.toContain('Now the sky,');
  });
});
