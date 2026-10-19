import { describe, expect, it } from 'vitest';
import { compareCharts, type ComparisonChart } from './synastry';
import type { BodyName, PrecisionTier } from './types';

function chart(placements: Partial<Record<BodyName, number>>, tier: PrecisionTier = 'place'): ComparisonChart {
  return { tier, placements: new Map(Object.entries(placements).map(([body, longitude]) => [body as BodyName, { longitude }])) };
}

const a = chart({ sun: 15, moon: 46, mercury: 20, venus: 70, mars: 91, ascendant: 130 });
const b = chart({ sun: 135, moon: 140, mercury: 141, venus: 87, mars: 190, ascendant: 270 });

describe('two-chart comparison', () => {
  it.each(['general', 'friendship', 'romantic'] as const)('is symmetric in %s mode', (mode) => {
    expect(compareCharts(a, b, mode).score).toBe(compareCharts(b, a, mode).score);
  });

  it('uses degrees rather than treating all planets in a sign alike', () => {
    const exact = compareCharts(chart({ sun: 15 }), chart({ sun: 135 }));
    const wide = compareCharts(chart({ sun: 15 }), chart({ sun: 149 }));
    expect(exact.score).toBe(85);
    expect(wide.score).toBe(50);
    expect(wide.contributions[0]?.hit).toBeNull();
  });

  it('detects a conjunction across a sign boundary', () => {
    const result = compareCharts(chart({ sun: 359 }), chart({ sun: 1 }));
    expect(result.contributions[0]?.hit?.aspect.name).toBe('conjunction');
    expect(result.contributions[0]?.hit?.orb).toBe(2);
  });

  it('fades to neutral at the aspect orb boundary', () => {
    const exact = compareCharts(chart({ sun: 0 }), chart({ sun: 120 }));
    const halfway = compareCharts(chart({ sun: 0 }), chart({ sun: 124 }));
    const boundary = compareCharts(chart({ sun: 0 }), chart({ sun: 128 }));
    expect(exact.score).toBe(85);
    expect(halfway.score).toBe(67.5);
    expect(boundary.score).toBe(50);
  });

  it('uses both Sun–Moon directions with equal weight', () => {
    const result = compareCharts(a, b);
    const forward = result.contributions.find((entry) => entry.a === 'sun' && entry.b === 'moon');
    const reverse = result.contributions.find((entry) => entry.a === 'moon' && entry.b === 'sun');
    expect(forward?.weight).toBe(reverse?.weight);
    expect(forward?.longitudeA).toBe(15);
    expect(forward?.longitudeB).toBe(140);
    expect(reverse?.longitudeA).toBe(46);
    expect(reverse?.longitudeB).toBe(135);
  });

  it('renormalizes missing pairs without penalizing incomplete charts', () => {
    const result = compareCharts(chart({ sun: 15 }), chart({ sun: 135 }));
    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0]?.weight).toBe(1);
    expect(result.coverage).toBeCloseTo(0.15);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.score).toBe(85);
  });

  it('marks a sign-based fallback when either birth time is unknown', () => {
    const result = compareCharts(chart({ sun: 15 }, 'date'), chart({ sun: 149 }));
    expect(result.method).toBe('estimated-signs');
    expect(result.contributions[0]?.hit).toBeNull();
    expect(result.score).toBe(98);
    expect(compareCharts(chart({ sun: 149 }), chart({ sun: 15 }, 'date')).score).toBe(98);
  });

  it('does not fabricate an index when nothing can be compared', () => {
    expect(compareCharts(chart({}), chart({})).score).toBeNull();
  });

  it('responds to Mercury changes in friendship and Venus–Mars changes in romantic mode', () => {
    const mercuryChanged = chart({ sun: 135, moon: 140, mercury: 230, venus: 87, mars: 190, ascendant: 270 });
    expect(compareCharts(a, mercuryChanged, 'friendship').score).not.toBe(compareCharts(a, b, 'friendship').score);
    expect(compareCharts(a, mercuryChanged, 'romantic').score).toBe(compareCharts(a, b, 'romantic').score);
    expect(compareCharts(a, b, 'friendship').contributions.some((entry) => entry.a === 'venus' && entry.b === 'mars')).toBe(false);
    expect(compareCharts(a, b, 'romantic').contributions.some((entry) => entry.a === 'venus' && entry.b === 'mars')).toBe(true);
  });

  it('keeps normalized weights and the index within range for every mode', () => {
    for (const mode of ['general', 'friendship', 'romantic'] as const) {
      const result = compareCharts(a, b, mode);
      expect(result.contributions.reduce((sum, entry) => sum + entry.weight, 0)).toBeCloseTo(1);
      expect(result.coverage).toBeCloseTo(1);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });
});
