import {
  Body as AstroBody,
  Ecliptic,
  GeoVector,
  MakeTime,
  SiderealTime,
  SunPosition,
  type AstroTime,
} from 'astronomy-engine';
import { DateTime } from 'luxon';
import tzLookup from 'tz-lookup';

import type { BodyName, Placement, PrecisionTier } from './types';
import { COMPUTABLE_BODIES, getBody } from './bodies';
import { degreeInSign, normalizeDegrees, signFromLongitude } from './signs';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const sin = (deg: number) => Math.sin(deg * DEG);
const cos = (deg: number) => Math.cos(deg * DEG);
const tan = (deg: number) => Math.tan(deg * DEG);

export interface BirthInput {
  year: number;
  /** 1–12. Note this is *not* the JS Date convention. */
  month: number;
  day: number;
  /** Local clock time at the birth place. Omit if unknown. */
  hour?: number;
  minute?: number;
  /** Decimal degrees, north positive. */
  latitude?: number;
  /** Decimal degrees, east positive. */
  longitude?: number;
  /**
   * IANA zone, e.g. `America/New_York`. Derived from the coordinates when
   * omitted, which is what you want for historical births: the IANA database
   * carries the actual DST rules in force on the day, including the many
   * regions that have since changed them.
   */
  timeZone?: string;
  /** Select the first or second occurrence when daylight saving repeats a time. */
  timeOccurrence?: 'earlier' | 'later';
}

export type HouseSystem = 'whole-sign' | 'equal' | 'placidus';

export interface NatalChart {
  input: BirthInput;
  /** The birth moment as a UTC instant. */
  utc: Date;
  /** IANA zone actually used. */
  timeZone: string;
  tier: PrecisionTier;
  placements: ReadonlyMap<BodyName, Placement>;
  /** 12 cusps in ecliptic longitude, index 0 = 1st house. Null below `place` tier. */
  houses: readonly number[] | null;
  houseSystem: HouseSystem;
  /** Local sidereal time in degrees (RAMC). Null below `place` tier. */
  ramc: number | null;
  /** Mean obliquity of the ecliptic at the birth moment. */
  obliquity: number;
  /** Anything the caller should show a caveat about. */
  warnings: readonly string[];
}

/** Which astronomy-engine body backs each of our named points. */
const ASTRO_BODY: Partial<Record<BodyName, AstroBody>> = {
  moon: AstroBody.Moon,
  mercury: AstroBody.Mercury,
  venus: AstroBody.Venus,
  mars: AstroBody.Mars,
  jupiter: AstroBody.Jupiter,
  saturn: AstroBody.Saturn,
  uranus: AstroBody.Uranus,
  neptune: AstroBody.Neptune,
  pluto: AstroBody.Pluto,
};

/**
 * Mean obliquity of the ecliptic, Meeus *Astronomical Algorithms* ch. 22.
 *
 * We use mean rather than true obliquity: the nutation term is under 10
 * arcseconds, far below anything that could shift a house cusp into a
 * different sign.
 */
function meanObliquity(time: AstroTime): number {
  const t = time.tt / 36525;
  return (
    23.43929111 -
    (46.815 * t + 0.00059 * t * t - 0.001813 * t * t * t) / 3600
  );
}

/**
 * Mean longitude of the Moon's ascending node, Meeus ch. 47.
 *
 * Mean rather than true node — it is the default in most astrology software,
 * and the true node's wobble (up to ~1.5°) rarely changes the sign.
 */
function meanLunarNode(time: AstroTime): number {
  const t = time.tt / 36525;
  return normalizeDegrees(
    125.0445479 -
      1934.1362891 * t +
      0.0020754 * t * t +
      (t * t * t) / 467441 -
      (t * t * t * t) / 60616000,
  );
}

/** Geocentric ecliptic longitude of a body, in degrees of the zodiac. */
function geocentricLongitude(body: AstroBody, time: AstroTime): number {
  if (body === AstroBody.Sun) return normalizeDegrees(SunPosition(time).elon);
  // `true` applies aberration correction — the apparent position, which is
  // what an ephemeris (and therefore a chart) reports.
  return normalizeDegrees(Ecliptic(GeoVector(body, time, true)).elon);
}

/**
 * Midheaven: where the local meridian crosses the ecliptic.
 *
 * From tan(RA) = tan(λ)·cos(ε) for a point on the ecliptic, solved for λ.
 */
export function computeMidheaven(ramc: number, obliquity: number): number {
  return normalizeDegrees(
    Math.atan2(sin(ramc), cos(ramc) * cos(obliquity)) * RAD,
  );
}

/**
 * Ascendant: where the eastern horizon crosses the ecliptic.
 *
 * The classical formula. atan2 handles the quadrant, which a plain arctan
 * would get wrong for half the sky.
 */
export function computeAscendant(
  ramc: number,
  obliquity: number,
  latitude: number,
): number {
  const y = cos(ramc);
  const x = -(sin(ramc) * cos(obliquity) + tan(latitude) * sin(obliquity));
  return normalizeDegrees(Math.atan2(y, x) * RAD);
}

/**
 * Placidus intermediate cusps.
 *
 * Placidus divides each body's semi-arc into thirds, which has no closed-form
 * solution — the standard approach is to iterate until the right ascension
 * settles. Converges in a handful of passes away from the polar circles.
 *
 * Returns null above ~66.5° latitude, where the required arccos argument
 * leaves [-1, 1] because some degrees of the ecliptic never rise. Placidus is
 * genuinely undefined there rather than merely hard to compute, which is why
 * callers fall back to whole-sign.
 */
function placidusCusp(
  ramc: number,
  obliquity: number,
  latitude: number,
  offset: number,
  divisor: number,
  belowHorizon: boolean,
): number | null {
  let ra = ramc + offset;

  for (let i = 0; i < 40; i += 1) {
    // sin(ascensional difference) = tan(latitude)·tan(declination), and for a
    // point on the ecliptic tan(declination) follows sin(RA)·tan(obliquity).
    //
    // arccos(-x) = 90 + AD = the semi-DIURNAL arc, used by cusps 11 and 12
    // above the horizon. arccos(+x) = 90 - AD = the semi-NOCTURNAL arc, which
    // is what cusps 2 and 3 divide. Both collapse to 90° when the argument is
    // zero, so the sign error is invisible at the equator and only shows up as
    // lopsided house widths at latitude.
    const ad = sin(ra) * tan(latitude) * tan(obliquity);
    const argument = belowHorizon ? ad : -ad;
    if (!Number.isFinite(argument) || Math.abs(argument) > 1) return null;

    const arc = Math.acos(argument) * RAD;
    const next = belowHorizon
      ? ramc + 180 - arc / divisor
      : ramc + arc / divisor;

    if (Math.abs(next - ra) < 1e-9) {
      ra = next;
      break;
    }
    ra = next;
  }

  // Convert the right ascension of the cusp back to an ecliptic longitude.
  return normalizeDegrees(Math.atan2(sin(ra), cos(ra) * cos(obliquity)) * RAD);
}

/**
 * The twelve house cusps, index 0 = 1st house.
 *
 * Opposite houses are always exactly 180° apart, so only six cusps are
 * genuinely computed in the quadrant systems.
 */
function computeHouses(
  system: HouseSystem,
  ascendant: number,
  midheaven: number,
  ramc: number,
  obliquity: number,
  latitude: number,
): { cusps: number[]; system: HouseSystem; warning?: string } {
  if (system === 'whole-sign') {
    // Every house is one whole sign, starting from the sign holding the ASC.
    const start = Math.floor(ascendant / 30) * 30;
    return {
      cusps: Array.from({ length: 12 }, (_, i) => normalizeDegrees(start + i * 30)),
      system,
    };
  }

  if (system === 'equal') {
    return {
      cusps: Array.from({ length: 12 }, (_, i) => normalizeDegrees(ascendant + i * 30)),
      system,
    };
  }

  const c11 = placidusCusp(ramc, obliquity, latitude, 30, 3, false);
  const c12 = placidusCusp(ramc, obliquity, latitude, 60, 1.5, false);
  const c2 = placidusCusp(ramc, obliquity, latitude, 120, 1.5, true);
  const c3 = placidusCusp(ramc, obliquity, latitude, 150, 3, true);

  if (c11 === null || c12 === null || c2 === null || c3 === null) {
    const fallback = computeHouses(
      'whole-sign',
      ascendant,
      midheaven,
      ramc,
      obliquity,
      latitude,
    );
    return {
      ...fallback,
      warning:
        'Placidus houses are undefined at this latitude (inside the polar circle); using whole-sign instead.',
    };
  }

  const cusps = [
    ascendant, // 1
    c2, // 2
    c3, // 3
    normalizeDegrees(midheaven + 180), // 4 (IC)
    normalizeDegrees(c11 + 180), // 5
    normalizeDegrees(c12 + 180), // 6
    normalizeDegrees(ascendant + 180), // 7 (DC)
    normalizeDegrees(c2 + 180), // 8
    normalizeDegrees(c3 + 180), // 9
    midheaven, // 10 (MC)
    c11, // 11
    c12, // 12
  ];

  return { cusps, system };
}

/** Which house a longitude falls in, 1–12. Handles the 0° wrap. */
export function houseOf(longitude: number, cusps: readonly number[]): number {
  const lon = normalizeDegrees(longitude);
  for (let i = 0; i < 12; i += 1) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start === undefined || end === undefined) continue;

    const span = normalizeDegrees(end - start);
    const offset = normalizeDegrees(lon - start);
    if (offset < span) return i + 1;
  }
  return 1;
}

function resolveTier(input: BirthInput): PrecisionTier {
  const hasTime = input.hour !== undefined;
  const hasPlace = input.latitude !== undefined && input.longitude !== undefined;
  if (hasTime && hasPlace) return 'place';
  if (hasTime) return 'time';
  return 'date';
}

/**
 * Resolve local birth time to a UTC instant.
 *
 * Luxon reads the IANA database, so historical DST transitions are handled
 * correctly — which matters more than it sounds: a 1960s summer birth in a
 * region that has since changed its rules will be an hour out if you apply
 * today's offset, and an hour moves the Ascendant by ~15°.
 */
export function resolveBirthMoment(input: BirthInput): { utc: Date; timeZone: string } {
  if (![input.year, input.month, input.day].every(Number.isInteger) ||
      input.year < 1 || input.year > 9999) {
    throw new Error('Invalid birth date. Enter a year between 1 and 9999.');
  }
  if ((input.hour !== undefined && (!Number.isInteger(input.hour) || input.hour < 0 || input.hour > 23)) ||
      (input.minute !== undefined && (!Number.isInteger(input.minute) || input.minute < 0 || input.minute > 59)) ||
      (input.minute !== undefined && input.hour === undefined)) {
    throw new Error('Invalid birth time. Use hours 00–23 and minutes 00–59.');
  }
  if ((input.latitude === undefined) !== (input.longitude === undefined)) {
    throw new Error('Enter both latitude and longitude for a birth place.');
  }
  if (input.latitude !== undefined && (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90)) {
    throw new Error('Latitude must be between -90 and 90.');
  }
  if (input.longitude !== undefined && (!Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180)) {
    throw new Error('Longitude must be between -180 and 180.');
  }
  if (input.timeOccurrence !== undefined && !['earlier', 'later'].includes(input.timeOccurrence)) {
    throw new Error('Choose the first or second occurrence of the birth time.');
  }
  const timeZone =
    input.timeZone ??
    (input.latitude !== undefined && input.longitude !== undefined
      ? tzLookup(input.latitude, input.longitude)
      : 'UTC');

  let local = DateTime.fromObject(
    {
      year: input.year,
      month: input.month,
      day: input.day,
      // Noon is the standard convention for an unknown birth time: it
      // minimises the worst-case error, capping it at ±12 hours.
      hour: input.hour ?? 12,
      minute: input.minute ?? 0,
    },
    { zone: timeZone },
  );

  if (!local.isValid) {
    throw new Error(`Invalid birth date/time: ${local.invalidReason ?? 'unknown'}`);
  }

  // Luxon moves nonexistent clock times forward during a DST jump. A birth
  // chart must never silently replace the time the user supplied.
  if (local.year !== input.year || local.month !== input.month || local.day !== input.day ||
      local.hour !== (input.hour ?? 12) || local.minute !== (input.minute ?? 0)) {
    throw new Error('That local time does not exist in this timezone because the clocks changed. Check the birth time or timezone.');
  }
  if (input.hour !== undefined) {
    const possibilities = local.getPossibleOffsets().sort((a, b) => a.toMillis() - b.toMillis());
    if (possibilities.length > 1) {
      if (!input.timeOccurrence) {
        throw new Error('That birth time occurred twice when the clocks changed. Choose its first or second occurrence under clock-change options.');
      }
      local = possibilities[input.timeOccurrence === 'earlier' ? 0 : possibilities.length - 1]!;
    }
  }

  return { utc: local.toUTC().toJSDate(), timeZone };
}

/** Longitude of any supported point at a given moment. */
function longitudeFor(body: BodyName, time: AstroTime): number | null {
  if (body === 'sun') return geocentricLongitude(AstroBody.Sun, time);
  if (body === 'northNode') return meanLunarNode(time);
  if (body === 'southNode') return normalizeDegrees(meanLunarNode(time) + 180);

  const astro = ASTRO_BODY[body];
  if (astro === undefined) return null;
  return geocentricLongitude(astro, time);
}

/**
 * Compute a natal chart.
 *
 * Everything runs locally — no API, no network. Birth data never leaves the
 * device, which for data this personal is the only defensible default.
 */
export function computeChart(
  input: BirthInput,
  options: { houseSystem?: HouseSystem } = {},
): NatalChart {
  const houseSystem = options.houseSystem ?? 'whole-sign';
  const tier = resolveTier(input);
  const { utc, timeZone } = resolveBirthMoment(input);
  const time = MakeTime(utc);
  const obliquity = meanObliquity(time);
  const warnings: string[] = [];

  if (tier === 'date') {
    warnings.push(
      'No birth time given, so noon was assumed. Planetary positions are estimates; the Moon or any placement near a sign boundary may change. Rising, Descendant, Midheaven and houses need a birth time and place.',
    );
  } else if (tier === 'time') {
    warnings.push(
      'No birth place given, so the Ascendant, Descendant, Midheaven, Imum Coeli and houses are unavailable.',
    );
  }
  if (!input.timeZone && input.latitude === undefined) {
    warnings.push('No birth timezone or place supplied, so UTC was assumed. Add the birth place or historical timezone for more reliable positions.');
  }
  if (input.year < 1900 && input.latitude !== undefined && !input.timeZone) {
    warnings.push('Historical timezone rules may use a regional local mean time. For births before standard time, verify the original time convention and supply a timezone override if needed.');
  }

  let ramc: number | null = null;
  let ascendant: number | null = null;
  let midheaven: number | null = null;
  let houses: number[] | null = null;
  let resolvedSystem = houseSystem;

  if (tier === 'place') {
    const latitude = input.latitude as number;
    const longitude = input.longitude as number;

    if (Math.abs(latitude) === 90) {
      throw new Error('Rising and setting points are undefined at the geographic poles. Check the birth coordinates.');
    }

    // SiderealTime returns Greenwich apparent sidereal time in hours; adding
    // the observer's longitude gives local sidereal time, and ×15 converts
    // hours to the degrees the cusp formulae expect.
    const gast = SiderealTime(time);
    ramc = normalizeDegrees((gast + longitude / 15) * 15);

    midheaven = computeMidheaven(ramc, obliquity);
    ascendant = computeAscendant(ramc, obliquity, latitude);

    const result = computeHouses(
      houseSystem,
      ascendant,
      midheaven,
      ramc,
      obliquity,
      latitude,
    );
    houses = result.cusps;
    resolvedSystem = result.system;
    if (result.warning) warnings.push(result.warning);
  }

  const placements = new Map<BodyName, Placement>();

  const record = (body: BodyName, longitude: number, retrograde: boolean) => {
    placements.set(body, {
      body,
      longitude,
      sign: signFromLongitude(longitude).name,
      degreeInSign: degreeInSign(longitude),
      house: houses ? houseOf(longitude, houses) : null,
      retrograde,
    });
  };

  // A body is retrograde when its apparent longitude decreases. Sampling six
  // hours either side is well inside the window where a station could flip the
  // sign, and avoids a separate stationary-point search.
  const before = MakeTime(new Date(utc.getTime() - 6 * 3600 * 1000));
  const after = MakeTime(new Date(utc.getTime() + 6 * 3600 * 1000));

  for (const body of COMPUTABLE_BODIES) {
    if (body.class === 'angle') continue;

    const longitude = longitudeFor(body.name, time);
    if (longitude === null) continue;

    let retrograde = false;
    if (body.class !== 'luminary') {
      const lonBefore = longitudeFor(body.name, before);
      const lonAfter = longitudeFor(body.name, after);
      if (lonBefore !== null && lonAfter !== null) {
        // Signed shortest delta, so a body crossing 0° Aries is not mistaken
        // for a 359° backwards jump.
        const delta = ((lonAfter - lonBefore + 540) % 360) - 180;
        retrograde = delta < 0;
      }
    }

    record(body.name, longitude, retrograde);
  }

  if (ascendant !== null) record('ascendant', ascendant, false);
  if (ascendant !== null) record('descendant', normalizeDegrees(ascendant + 180), false);
  if (midheaven !== null) record('midheaven', midheaven, false);
  if (midheaven !== null) record('imumCoeli', normalizeDegrees(midheaven + 180), false);

  return {
    input,
    utc,
    timeZone,
    tier,
    placements,
    houses,
    houseSystem: resolvedSystem,
    ramc,
    obliquity,
    warnings,
  };
}

/** Convenience accessor — throws rather than returning undefined. */
export function placementOf(chart: NatalChart, body: BodyName): Placement {
  const placement = chart.placements.get(body);
  if (!placement) {
    throw new Error(
      `${getBody(body).label} is not available in this chart (tier: ${chart.tier})`,
    );
  }
  return placement;
}
