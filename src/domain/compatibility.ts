import type { AspectQuality, BodyName, SignName } from './types';
import {
  ELEMENT_TEMPERAMENT,
  MODALITY_TEMPERAMENT,
  areElementsComplementary,
  getSign,
  getSignByName,
  signFromLongitude,
  type Sign,
} from './signs';
import { aspectBetweenSigns, findAspect, type Aspect } from './aspects';
import { getBody } from './bodies';

/**
 * Compatibility scoring.
 *
 * The model is three layers, per docs/RESEARCH.md §3:
 *
 *   1. Aspect base score, from the angular separation of the two placements.
 *   2. Element and modality modifiers.
 *   3. A weighted blend across the placements that matter for the chosen mode.
 *
 * An important property of layer 2, verified in the tests: for sign-to-sign
 * comparison it carries no *independent* information. Element cycles every 4
 * signs and modality every 3, so by the Chinese remainder theorem a separation
 * mod 12 fully determines both relations — every trine is same-element, every
 * square is same-modality, without exception.
 *
 * We compute it from the actual signs anyway, for two reasons. It is what
 * generates the human-readable reasons behind an edge, and at the degree level
 * the redundancy genuinely breaks down: two planets either side of a cusp can
 * be conjunct by orb while sitting in signs of different elements. Layer 2 is
 * doing real work there.
 */

/** Contribution of a single consideration to a score, with its reasoning. */
export interface CompatibilityFactor {
  kind: 'aspect' | 'element' | 'modality';
  label: string;
  /** Points added to (or removed from) the running score. */
  delta: number;
  explanation: string;
}

export interface SignCompatibility {
  a: Sign;
  b: Sign;
  /** 0–100. See COMPATIBILITY_SCALE for the values actually reachable. */
  score: number;
  aspect: Aspect;
  quality: AspectQuality;
  factors: CompatibilityFactor[];
  /** One-sentence plain-language reading of the pairing. */
  summary: string;
}

const ELEMENT_SAME_BONUS = 10;
const ELEMENT_COMPLEMENT_BONUS = 8;
const ELEMENT_CLASH_PENALTY = -5;
const MODALITY_SAME_PENALTY = -5;
const MODALITY_DIFFERENT_BONUS = 3;

/**
 * The seven scores a sign pair can produce, keyed by separation in signs.
 *
 * Because layer 2 is deterministic at sign level, these are the *only* possible
 * outputs — worth stating explicitly so the graph's distance mapping can be
 * calibrated against a known range rather than a guessed 0–100.
 */
export const COMPATIBILITY_SCALE: Readonly<Record<number, number>> = {
  0: 75, // conjunction
  1: 38, // semi-sextile
  2: 91, // sextile
  3: 20, // square
  4: 98, // trine
  5: 33, // quincunx
  6: 58, // opposition
};

export const MIN_SIGN_SCORE = 20;
export const MAX_SIGN_SCORE = 98;

function elementFactor(a: Sign, b: Sign): CompatibilityFactor {
  if (a.element === b.element) {
    return {
      kind: 'element',
      label: `Both ${a.element}`,
      delta: ELEMENT_SAME_BONUS,
      explanation: `Both bring ${ELEMENT_TEMPERAMENT[a.element]}, so you tend to want the same things without explaining why.`,
    };
  }
  if (areElementsComplementary(a.element, b.element)) {
    return {
      kind: 'element',
      label: `${a.element} + ${b.element}`,
      delta: ELEMENT_COMPLEMENT_BONUS,
      explanation: `${ELEMENT_TEMPERAMENT[a.element]} and ${ELEMENT_TEMPERAMENT[b.element]} feed each other — the classic complementary pairing.`,
    };
  }
  return {
    kind: 'element',
    label: `${a.element} vs ${b.element}`,
    delta: ELEMENT_CLASH_PENALTY,
    explanation: `${ELEMENT_TEMPERAMENT[a.element]} and ${ELEMENT_TEMPERAMENT[b.element]} pull in different directions and need conscious translation.`,
  };
}

function modalityFactor(a: Sign, b: Sign): CompatibilityFactor {
  if (a.modality === b.modality) {
    return {
      kind: 'modality',
      label: `Both ${a.modality}`,
      delta: MODALITY_SAME_PENALTY,
      explanation: `Both ${MODALITY_TEMPERAMENT[a.modality]} — the same strategy applied at the same moment, which competes rather than complements.`,
    };
  }
  return {
    kind: 'modality',
    label: `${a.modality} + ${b.modality}`,
    delta: MODALITY_DIFFERENT_BONUS,
    explanation: `One ${MODALITY_TEMPERAMENT[a.modality]} while the other ${MODALITY_TEMPERAMENT[b.modality]}, so you cover different ground.`,
  };
}

function clamp(value: number, low = 0, high = 100): number {
  return Math.min(high, Math.max(low, value));
}

function buildSummary(
  a: Sign,
  b: Sign,
  aspect: Aspect,
  score: number,
): string {
  const band =
    score >= 85
      ? 'traditionally read as one of the easy ones'
      : score >= 65
        ? 'read as workable, with real common ground'
        : score >= 45
          ? 'read as dynamic — engaging, but it asks for effort'
          : 'read as demanding; the friction is the point';

  return `${a.label} and ${b.label} sit ${aspect.label.toLowerCase()} — ${aspect.reading}. It is ${band}.`;
}

/**
 * Score one sign against another.
 *
 * Symmetric: `scoreSignPair(a, b)` always equals `scoreSignPair(b, a)`.
 */
export function scoreSignPair(
  signA: SignName | Sign,
  signB: SignName | Sign,
): SignCompatibility {
  const a = typeof signA === 'string' ? getSignByName(signA) : signA;
  const b = typeof signB === 'string' ? getSignByName(signB) : signB;

  const aspect = aspectBetweenSigns(a.index, b.index);

  const factors: CompatibilityFactor[] = [
    {
      kind: 'aspect',
      label: aspect.label,
      delta: aspect.baseScore,
      explanation: `${a.label} and ${b.label} are ${aspect.signDistance} sign${aspect.signDistance === 1 ? '' : 's'} apart (${aspect.angle}°) — ${aspect.reading}.`,
    },
    elementFactor(a, b),
    modalityFactor(a, b),
  ];

  const score = clamp(factors.reduce((sum, f) => sum + f.delta, 0));

  return {
    a,
    b,
    score,
    aspect,
    quality: aspect.quality,
    factors,
    summary: buildSummary(a, b, aspect, score),
  };
}

/** Blend weights per placement, per relationship lens. */
export type CompatibilityMode = 'general' | 'romantic' | 'friendship';

export const MODE_WEIGHTS: Readonly<
  Record<CompatibilityMode, Readonly<Partial<Record<BodyName, number>>>>
> = {
  // The "big three" — the standard foundation of a chart reading.
  general: { sun: 0.5, moon: 0.3, ascendant: 0.2 },
  // Venus (how you love) and Mars (what you want) carry romantic synastry.
  romantic: { sun: 0.35, moon: 0.25, venus: 0.25, mars: 0.15 },
  // Mercury matters disproportionately for friendship: shared wavelength.
  friendship: { sun: 0.4, moon: 0.25, mercury: 0.2, ascendant: 0.15 },
};

export const MODE_LABELS: Readonly<Record<CompatibilityMode, string>> = {
  general: 'Overall',
  romantic: 'Romantic',
  friendship: 'Friendship',
};

/** A single placement's contribution to a chart-level score. */
export interface PlacementContribution {
  body: BodyName;
  bodyLabel: string;
  /** The sign that placement falls in. */
  sign: SignName;
  /** Weight actually applied, after renormalising for missing placements. */
  weight: number;
  pairing: SignCompatibility;
}

export interface ChartSignCompatibility {
  target: Sign;
  score: number;
  mode: CompatibilityMode;
  contributions: PlacementContribution[];
  /** Placements the mode wanted but the chart could not supply. */
  missing: BodyName[];
  /** The single strongest contributor, for headline copy. */
  dominant: PlacementContribution | null;
  summary: string;
}

/** Minimal shape needed for scoring — `NatalChart` from chart.ts satisfies it. */
export interface ScorableChart {
  placements: ReadonlyMap<BodyName, { longitude: number }>;
}

/**
 * Score a full chart against a single sign.
 *
 * Weights are renormalised over the placements actually present, so a
 * date-only chart (no Ascendant) still produces a sensible score from Sun and
 * Moon rather than silently scoring low. Missing placements are reported so the
 * UI can prompt for a birth time instead of quietly degrading.
 */
export function compareChartToSign(
  chart: ScorableChart,
  target: SignName | Sign,
  mode: CompatibilityMode = 'general',
): ChartSignCompatibility {
  const targetSign = typeof target === 'string' ? getSignByName(target) : target;
  const weights = MODE_WEIGHTS[mode];

  const available: { body: BodyName; weight: number; sign: Sign }[] = [];
  const missing: BodyName[] = [];

  for (const [body, weight] of Object.entries(weights) as [
    BodyName,
    number,
  ][]) {
    const placement = chart.placements.get(body);
    if (!placement) {
      missing.push(body);
      continue;
    }
    available.push({
      body,
      weight,
      sign: signFromLongitude(placement.longitude),
    });
  }

  if (available.length === 0) {
    throw new Error(
      `Chart has none of the placements required for "${mode}" scoring`,
    );
  }

  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);

  const contributions: PlacementContribution[] = available.map((p) => ({
    body: p.body,
    bodyLabel: getBody(p.body).label,
    sign: p.sign.name,
    weight: p.weight / totalWeight,
    pairing: scoreSignPair(p.sign, targetSign),
  }));

  const score = contributions.reduce(
    (sum, c) => sum + c.pairing.score * c.weight,
    0,
  );

  const dominant =
    contributions.reduce<PlacementContribution | null>((best, c) => {
      if (!best) return c;
      return c.pairing.score * c.weight > best.pairing.score * best.weight
        ? c
        : best;
    }, null);

  const summary = dominant
    ? `Your ${dominant.bodyLabel} in ${getSignByName(dominant.sign).label} ${
        dominant.pairing.aspect.quality === 'challenging' ? 'squares off with' : 'connects to'
      } ${targetSign.label} by ${dominant.pairing.aspect.label.toLowerCase()}.`
    : `${targetSign.label} compatibility.`;

  return {
    target: targetSign,
    score: Math.round(score * 10) / 10,
    mode,
    contributions,
    missing,
    dominant,
    summary,
  };
}

/** Every sign scored against the chart, ordered highest first. */
export function rankSignsForChart(
  chart: ScorableChart,
  mode: CompatibilityMode = 'general',
): ChartSignCompatibility[] {
  return Array.from({ length: 12 }, (_, i) =>
    compareChartToSign(chart, getSign(i), mode),
  ).sort((x, y) => y.score - x.score);
}

/**
 * Map a compatibility score onto a layout distance.
 *
 * Inverted, so a high score sits close to the centre. Calibrated against the
 * scale's real bounds rather than 0–100, so the twelve nodes actually use the
 * full radius instead of bunching in the middle.
 */
export function scoreToDistance(
  score: number,
  { min = 80, max = 320 }: { min?: number; max?: number } = {},
): number {
  const span = MAX_SIGN_SCORE - MIN_SIGN_SCORE;
  const normalized = clamp((score - MIN_SIGN_SCORE) / span, 0, 1);
  return max - normalized * (max - min);
}

/**
 * Degree-level aspect between two placements.
 *
 * This is the layer where element/modality stop being redundant: planets in
 * adjacent signs can be conjunct across a cusp, and then the sign relationship
 * genuinely differs from the angular one.
 */
export function scorePlacementPair(
  longitudeA: number,
  longitudeB: number,
): { hit: ReturnType<typeof findAspect>; pairing: SignCompatibility } {
  return {
    hit: findAspect(longitudeA, longitudeB),
    pairing: scoreSignPair(
      signFromLongitude(longitudeA),
      signFromLongitude(longitudeB),
    ),
  };
}
