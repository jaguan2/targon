/**
 * Shared vocabulary for the astrological domain.
 *
 * Everything here is pure data description — no calculation, no rendering.
 */

/** The four classical elements (triplicities). */
export type ElementName = 'fire' | 'earth' | 'air' | 'water';

/**
 * The three modalities (quadruplicities) — how a sign characteristically acts.
 * cardinal = initiates, fixed = sustains, mutable = adapts.
 */
export type ModalityName = 'cardinal' | 'fixed' | 'mutable';

/**
 * Sign polarity. Traditionally called masculine/feminine; modern practice
 * commonly uses active/receptive (or yang/yin), which is what we use.
 */
export type PolarityName = 'active' | 'receptive';

export type SignName =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

/**
 * Points placed in a chart. Includes the ten traditional "planets"
 * (Sun and Moon are luminaries, but are conventionally grouped in),
 * the calculated angles, and the commonly used extra points.
 */
export type BodyName =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'northNode'
  | 'southNode'
  | 'chiron'
  | 'ascendant'
  | 'descendant'
  | 'midheaven'
  | 'imumCoeli';

/** How significant a body is when weighting a compatibility score. */
export type BodyClass =
  | 'luminary' // Sun, Moon — the core of the chart
  | 'angle' // Ascendant, Midheaven — require an exact birth time
  | 'personal' // Mercury, Venus, Mars — individual temperament
  | 'social' // Jupiter, Saturn — how you meet the world
  | 'generational' // Uranus, Neptune, Pluto — shared by everyone born near you
  | 'point'; // Nodes, Chiron — calculated/symbolic points

export type AspectName =
  | 'conjunction'
  | 'semiSextile'
  | 'sextile'
  | 'square'
  | 'trine'
  | 'quincunx'
  | 'opposition';

/** Whether an aspect flows easily, creates friction, or sits ambiguously between. */
export type AspectQuality = 'harmonious' | 'challenging' | 'neutral';

/**
 * How much birth data the user supplied. Each tier unlocks more of the chart.
 *
 * Generational planets are technically available at `date` tier too, but they
 * move so slowly that they carry no individual information — see `bodies.ts`.
 */
export type PrecisionTier =
  /** Unknown time. Positions are estimates at noon; signs near a cusp can change. */
  | 'date'
  /** Known time. Planetary positions; angles and houses still need a place. */
  | 'time'
  /** Date + time + place. Full chart: angles, houses, the lot. */
  | 'place';

/** A position on the 360° ecliptic, plus its derived sign placement. */
export interface Placement {
  body: BodyName;
  /** Ecliptic longitude, 0–360°, measured from 0° Aries. */
  longitude: number;
  sign: SignName;
  /** Degrees into the sign, 0–30. */
  degreeInSign: number;
  /** House 1–12, when the chart was computed with a birth place. */
  house: number | null;
  /** Apparent retrograde motion. Never true for luminaries or angles. */
  retrograde: boolean;
}
