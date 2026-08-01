import { describe, expect, it } from 'vitest';
import {
  COMPATIBILITY_SCALE,
  MAX_SIGN_SCORE,
  MIN_SIGN_SCORE,
  MODE_WEIGHTS,
  compareChartToSign,
  rankSignsForChart,
  scoreSignPair,
  scoreToDistance,
  type ScorableChart,
} from './compatibility';
import { SIGNS, getSignByName } from './signs';
import { signSeparation } from './aspects';
import type { BodyName } from './types';

/** Build a minimal chart stub from sign placements. */
function chartOf(placements: Partial<Record<BodyName, string>>): ScorableChart {
  const map = new Map<BodyName, { longitude: number }>();
  for (const [body, sign] of Object.entries(placements)) {
    // Place each body 15° into its sign, safely clear of both cusps.
    map.set(body as BodyName, {
      longitude: getSignByName(sign as never).startDegree + 15,
    });
  }
  return { placements: map };
}

describe('scoreSignPair', () => {
  it('is symmetric', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        expect(scoreSignPair(a, b).score).toBe(scoreSignPair(b, a).score);
      }
    }
  });

  it('keeps every score inside the published bounds', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        const { score } = scoreSignPair(a, b);
        expect(score).toBeGreaterThanOrEqual(MIN_SIGN_SCORE);
        expect(score).toBeLessThanOrEqual(MAX_SIGN_SCORE);
      }
    }
  });

  /**
   * The redundancy result from docs/RESEARCH.md §3: because element cycles
   * every 4 signs and modality every 3, a separation mod 12 fully determines
   * both. So the element and modality layers add explanation but no
   * independent signal, and only seven distinct scores are reachable.
   *
   * This test is what stops someone "improving" the modifiers without
   * realising the scale has a fixed shape.
   */
  it('produces exactly one score per separation', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        const separation = signSeparation(a.index, b.index);
        expect(scoreSignPair(a, b).score).toBe(COMPATIBILITY_SCALE[separation]);
      }
    }
  });

  it('reaches only seven distinct values across all 144 pairings', () => {
    const scores = new Set<number>();
    for (const a of SIGNS) for (const b of SIGNS) scores.add(scoreSignPair(a, b).score);
    expect(scores.size).toBe(7);
  });

  it('ranks trine highest and square lowest', () => {
    const trine = scoreSignPair('aries', 'leo').score;
    const sextile = scoreSignPair('aries', 'gemini').score;
    const conjunction = scoreSignPair('aries', 'aries').score;
    const opposition = scoreSignPair('aries', 'libra').score;
    const square = scoreSignPair('aries', 'cancer').score;

    expect(trine).toBeGreaterThan(sextile);
    expect(sextile).toBeGreaterThan(conjunction);
    expect(conjunction).toBeGreaterThan(opposition);
    expect(opposition).toBeGreaterThan(square);
  });

  it('does not clamp at the ceiling, so trines stay distinguishable', () => {
    // A trine collecting both bonuses must land below 100, or the top of the
    // scale would flatten and every same-element pair would tie.
    expect(scoreSignPair('aries', 'leo').score).toBeLessThan(100);
  });

  it('explains itself with an aspect, element and modality factor', () => {
    const result = scoreSignPair('taurus', 'virgo');
    expect(result.factors.map((f) => f.kind)).toEqual([
      'aspect',
      'element',
      'modality',
    ]);
    expect(result.aspect.name).toBe('trine');
    expect(result.factors.every((f) => f.explanation.length > 0)).toBe(true);
    expect(result.summary).toContain('Taurus');
    expect(result.summary).toContain('Virgo');
  });

  it('sums its factors to the reported score', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        const result = scoreSignPair(a, b);
        const total = result.factors.reduce((sum, f) => sum + f.delta, 0);
        expect(result.score).toBe(total);
      }
    }
  });

  it('accepts sign names and sign objects interchangeably', () => {
    expect(scoreSignPair('aries', 'leo').score).toBe(
      scoreSignPair(getSignByName('aries'), getSignByName('leo')).score,
    );
  });
});

describe('mode weights', () => {
  it('sum to 1 for every mode', () => {
    for (const [mode, weights] of Object.entries(MODE_WEIGHTS)) {
      const total = Object.values(weights).reduce((sum, w) => sum + (w ?? 0), 0);
      expect(total, `${mode} weights`).toBeCloseTo(1, 9);
    }
  });
});

describe('compareChartToSign', () => {
  const fullChart = chartOf({
    sun: 'aries',
    moon: 'leo',
    ascendant: 'sagittarius',
    venus: 'taurus',
    mars: 'gemini',
    mercury: 'pisces',
  });

  it('blends placements by weight', () => {
    const result = compareChartToSign(fullChart, 'leo', 'general');
    // Sun in Aries trines Leo, Moon in Leo is conjunct, ASC in Sagittarius trines.
    expect(result.contributions).toHaveLength(3);
    expect(result.score).toBeGreaterThan(80);
    expect(result.missing).toEqual([]);
  });

  it('reports which placements it could not use', () => {
    const sunOnly = chartOf({ sun: 'aries' });
    const result = compareChartToSign(sunOnly, 'leo', 'general');
    expect(result.missing).toEqual(['moon', 'ascendant']);
    expect(result.contributions).toHaveLength(1);
  });

  /**
   * A date-only chart must not be penalised for the placements it lacks. With
   * only the Sun available, an Aries chart against Leo is a pure trine and
   * should score as one — not 50% of one.
   */
  it('renormalises weights over available placements', () => {
    const sunOnly = chartOf({ sun: 'aries' });
    const result = compareChartToSign(sunOnly, 'leo', 'general');
    expect(result.contributions[0]?.weight).toBeCloseTo(1, 9);
    expect(result.score).toBe(scoreSignPair('aries', 'leo').score);
  });

  it('throws when the chart supports none of the mode’s placements', () => {
    const barren = chartOf({ pluto: 'scorpio' });
    expect(() => compareChartToSign(barren, 'leo', 'general')).toThrow(
      /none of the placements/,
    );
  });

  it('uses Venus and Mars in romantic mode but not general', () => {
    const romantic = compareChartToSign(fullChart, 'leo', 'romantic');
    const general = compareChartToSign(fullChart, 'leo', 'general');
    expect(romantic.contributions.map((c) => c.body)).toContain('venus');
    expect(general.contributions.map((c) => c.body)).not.toContain('venus');
  });

  it('names a dominant contributor', () => {
    const result = compareChartToSign(fullChart, 'leo', 'general');
    expect(result.dominant).not.toBeNull();
    expect(result.summary.length).toBeGreaterThan(0);
  });
});

describe('rankSignsForChart', () => {
  const chart = chartOf({ sun: 'aries', moon: 'leo', ascendant: 'sagittarius' });

  it('returns all twelve signs, highest score first', () => {
    const ranked = rankSignsForChart(chart);
    expect(ranked).toHaveLength(12);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score);
    }
  });

  it('puts a fire sign on top for an all-fire chart', () => {
    const top = rankSignsForChart(chart)[0]!;
    expect(['aries', 'leo', 'sagittarius']).toContain(top.target.name);
  });
});

describe('scoreToDistance', () => {
  it('inverts the score: better compatibility sits closer', () => {
    expect(scoreToDistance(MAX_SIGN_SCORE)).toBeLessThan(
      scoreToDistance(MIN_SIGN_SCORE),
    );
  });

  it('spans the full radius across the real score range', () => {
    expect(scoreToDistance(MAX_SIGN_SCORE, { min: 80, max: 320 })).toBeCloseTo(80, 9);
    expect(scoreToDistance(MIN_SIGN_SCORE, { min: 80, max: 320 })).toBeCloseTo(320, 9);
  });

  it('clamps values outside the expected range', () => {
    expect(scoreToDistance(0, { min: 80, max: 320 })).toBe(320);
    expect(scoreToDistance(100, { min: 80, max: 320 })).toBe(80);
  });
});
