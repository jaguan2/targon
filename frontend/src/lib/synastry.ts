import { findAspect, type AspectHit } from './aspects';
import { scoreSignPair, type CompatibilityMode, type ScorableChart, type SignCompatibility } from './compatibility';
import { signFromLongitude } from './signs';
import type { BodyName, PrecisionTier } from './types';

export interface ComparisonChart extends ScorableChart {
  tier: PrecisionTier;
}

interface PairRule {
  a: BodyName;
  b: BodyName;
  weight: number;
}

// Product-defined weights, not calibrated relationship probabilities. Cross-body
// rules split their weight between both directions so swapping people is fair.
const PAIR_RULES: Record<CompatibilityMode, readonly PairRule[]> = {
  general: [
    { a: 'sun', b: 'sun', weight: 0.22 },
    { a: 'moon', b: 'moon', weight: 0.18 },
    { a: 'sun', b: 'moon', weight: 0.2 },
    { a: 'mercury', b: 'mercury', weight: 0.15 },
    { a: 'venus', b: 'venus', weight: 0.1 },
    { a: 'sun', b: 'ascendant', weight: 0.15 },
  ],
  friendship: [
    { a: 'sun', b: 'sun', weight: 0.15 },
    { a: 'moon', b: 'moon', weight: 0.15 },
    { a: 'mercury', b: 'mercury', weight: 0.3 },
    { a: 'sun', b: 'moon', weight: 0.15 },
    { a: 'sun', b: 'mercury', weight: 0.15 },
    { a: 'sun', b: 'ascendant', weight: 0.1 },
  ],
  romantic: [
    { a: 'sun', b: 'sun', weight: 0.1 },
    { a: 'moon', b: 'moon', weight: 0.2 },
    { a: 'sun', b: 'moon', weight: 0.2 },
    { a: 'venus', b: 'mars', weight: 0.25 },
    { a: 'venus', b: 'venus', weight: 0.15 },
    { a: 'sun', b: 'ascendant', weight: 0.1 },
  ],
};

export interface ChartPairContribution {
  a: BodyName;
  b: BodyName;
  longitudeA: number;
  longitudeB: number;
  /** Renormalized over available pairs. */
  weight: number;
  score: number;
  /** Only populated for known-time, degree-based comparisons. */
  hit: AspectHit | null;
  /** Only populated for an estimated, sign-based comparison. */
  signPair: SignCompatibility | null;
}

export interface ChartComparison {
  mode: CompatibilityMode;
  method: 'degrees' | 'estimated-signs';
  score: number | null;
  contributions: ChartPairContribution[];
  missing: { a: BodyName; b: BodyName }[];
  /** Fraction of the planned weights available, before renormalization. */
  coverage: number;
}

/** Compare selected inter-chart placements; this is not a complete synastry report. */
export function compareCharts(a: ComparisonChart, b: ComparisonChart, mode: CompatibilityMode = 'friendship'): ChartComparison {
  const estimated = a.tier === 'date' || b.tier === 'date';
  const rules = PAIR_RULES[mode].flatMap((rule) => rule.a === rule.b
    ? [rule]
    : [{ ...rule, weight: rule.weight / 2 }, { a: rule.b, b: rule.a, weight: rule.weight / 2 }]);
  const contributions: ChartPairContribution[] = [];
  const missing: ChartComparison['missing'] = [];
  for (const rule of rules) {
    const placementA = a.placements.get(rule.a);
    const placementB = b.placements.get(rule.b);
    if (!placementA || !placementB) {
      missing.push({ a: rule.a, b: rule.b });
      continue;
    }
    if (!Number.isFinite(placementA.longitude) || !Number.isFinite(placementB.longitude)) {
      throw new Error('Cannot compare a non-finite placement.');
    }
    const signPair = estimated ? scoreSignPair(signFromLongitude(placementA.longitude), signFromLongitude(placementB.longitude)) : null;
    const hit = estimated ? null : findAspect(placementA.longitude, placementB.longitude);
    // No in-orb contact is neutral (50). Fade each aspect's contribution
    // towards neutral as it approaches its orb boundary, without a score jump.
    const score = signPair?.score ?? (hit ? 50 + (hit.aspect.baseScore - 50) * hit.strength : 50);
    contributions.push({
      a: rule.a, b: rule.b, longitudeA: placementA.longitude, longitudeB: placementB.longitude,
      weight: rule.weight, score, hit, signPair,
    });
  }
  const coverage = contributions.reduce((sum, entry) => sum + entry.weight, 0);
  for (const entry of contributions) entry.weight /= coverage;
  const score = coverage ? contributions.reduce((sum, entry) => sum + entry.score * entry.weight, 0) : null;
  return {
    mode,
    method: estimated ? 'estimated-signs' : 'degrees',
    score: score === null ? null : Math.round(score * 10) / 10,
    coverage: Math.min(1, coverage),
    contributions,
    missing,
  };
}
