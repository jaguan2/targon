import { describe, expect, it } from 'vitest';
import {
  computeAscendant,
  computeChart,
  computeMidheaven,
  resolveBirthMoment,
  houseOf,
  placementOf,
  type BirthInput,
} from './chart';
import { formatLongitude, normalizeDegrees, signFromLongitude } from './signs';
import type { BodyName } from './types';
import { Horizon, Observer, RotateVector, Rotation_ECT_EQD, SphereFromVector, Spherical, VectorFromSphere } from 'astronomy-engine';

/**
 * Einstein's chart is the standard worked example: an AA (birth-certificate)
 * Rodden rating with placements published identically across every major
 * astrology site, which makes it a real external check rather than a
 * self-consistency test.
 *
 * Germany kept local mean time until 1893, so we convert by hand — Ulm at 10°E
 * is LMT +40 min, putting 11:30 local at 10:50 UTC. We pass UTC explicitly
 * because IANA's pre-1893 `Europe/Berlin` is *Berlin's* LMT (+53:28), which
 * would shift the Ascendant by roughly 3°.
 */
const EINSTEIN: BirthInput = {
  year: 1879,
  month: 3,
  day: 14,
  hour: 10,
  minute: 50,
  latitude: 48.4,
  longitude: 10.0,
  timeZone: 'UTC',
};

/** Absolute difference between two longitudes, in arcminutes. */
function arcminutesApart(a: number, b: number): number {
  const raw = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return (raw > 180 ? 360 - raw : raw) * 60;
}

/** Convert `23°30' Pisces` style coordinates into an absolute longitude. */
function longitudeOf(signIndex: number, degrees: number, minutes: number) {
  return signIndex * 30 + degrees + minutes / 60;
}

describe('natal chart against published reference (Einstein)', () => {
  const chart = computeChart(EINSTEIN, { houseSystem: 'placidus' });

  const expected: [BodyName, number, number, number, number][] = [
    // body, signIndex, degrees, minutes, tolerance (arcminutes)
    ['sun', 11, 23, 30, 2],
    ['mercury', 0, 3, 7, 2],
    ['venus', 0, 16, 58, 2],
    ['mars', 9, 26, 54, 2],
    ['jupiter', 10, 27, 29, 2],
    ['saturn', 0, 4, 11, 2],
    ['uranus', 5, 1, 17, 2],
    ['neptune', 1, 7, 52, 2],
    ['pluto', 1, 24, 44, 2],
    // The Moon moves ~33'/hour, so published values differ slightly between
    // sources depending on the exact LMT offset assumed for Ulm.
    ['moon', 8, 14, 23, 15],
  ];

  it.each(expected)(
    'places %s within tolerance of the published position',
    (body, signIndex, degrees, minutes, tolerance) => {
      const actual = placementOf(chart, body).longitude;
      const target = longitudeOf(signIndex, degrees, minutes);
      expect(
        arcminutesApart(actual, target),
        `${body}: got ${formatLongitude(actual)}, expected ${degrees}°${minutes}'`,
      ).toBeLessThanOrEqual(tolerance);
    },
  );

  it('computes the Ascendant to the arcminute', () => {
    const asc = placementOf(chart, 'ascendant').longitude;
    expect(formatLongitude(asc)).toBe("11°38' Cancer");
  });

  it('puts the Sun in the 10th house', () => {
    expect(placementOf(chart, 'sun').house).toBe(10);
  });

  it('marks the retrograde planets', () => {
    expect(placementOf(chart, 'uranus').retrograde).toBe(true);
    // Mean nodes always move backwards through the zodiac.
    expect(placementOf(chart, 'northNode').retrograde).toBe(true);
    // Luminaries never retrograde.
    expect(placementOf(chart, 'sun').retrograde).toBe(false);
    expect(placementOf(chart, 'moon').retrograde).toBe(false);
  });

  it('keeps the nodes exactly opposite', () => {
    const north = placementOf(chart, 'northNode').longitude;
    const south = placementOf(chart, 'southNode').longitude;
    expect(arcminutesApart(north + 180, south)).toBeLessThan(0.01);
  });
});

describe('ephemeris sanity at J2000', () => {
  // 2000-01-01 12:00 UTC. Published: Sun 10°22' Capricorn.
  const chart = computeChart({
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    timeZone: 'UTC',
  });

  it('matches the published Sun position', () => {
    expect(formatLongitude(placementOf(chart, 'sun').longitude)).toBe(
      "10°22' Capricorn",
    );
  });

  it('places the slow planets in their known signs', () => {
    expect(signFromLongitude(placementOf(chart, 'jupiter').longitude).name).toBe(
      'aries',
    );
    expect(signFromLongitude(placementOf(chart, 'saturn').longitude).name).toBe(
      'taurus',
    );
  });
});

describe('precision tiers', () => {
  it('reports date tier and warns when no time is given', () => {
    const chart = computeChart({ year: 1990, month: 7, day: 4 });
    expect(chart.tier).toBe('date');
    expect(chart.houses).toBeNull();
    expect(chart.placements.has('ascendant')).toBe(false);
    expect(chart.warnings.join(' ')).toMatch(/noon was assumed/i);
  });

  it('reports time tier when the place is missing', () => {
    const chart = computeChart({
      year: 1990,
      month: 7,
      day: 4,
      hour: 14,
      minute: 30,
      timeZone: 'UTC',
    });
    expect(chart.tier).toBe('time');
    expect(chart.placements.has('ascendant')).toBe(false);
    expect(chart.warnings.join(' ')).toMatch(/Ascendant/);
  });

  it('reports place tier with a full set of angles and houses', () => {
    const chart = computeChart({
      year: 1990,
      month: 7,
      day: 4,
      hour: 14,
      minute: 30,
      latitude: 40.7128,
      longitude: -74.006,
    });
    expect(chart.tier).toBe('place');
    expect(chart.houses).toHaveLength(12);
    expect(chart.placements.has('ascendant')).toBe(true);
    expect(chart.placements.has('midheaven')).toBe(true);
    expect(chart.warnings).toHaveLength(0);
  });

  it('never reports Chiron, which we cannot yet compute', () => {
    const chart = computeChart({ year: 1990, month: 7, day: 4 });
    expect(chart.placements.has('chiron')).toBe(false);
  });

  it('throws a helpful error for an unavailable placement', () => {
    const chart = computeChart({ year: 1990, month: 7, day: 4 });
    expect(() => placementOf(chart, 'ascendant')).toThrow(/not available/);
  });
});

describe('timezone handling', () => {
  it('uses the birth place timezone even when time is unknown', () => {
    const chart = computeChart({ year: 1990, month: 7, day: 4, latitude: 40.7128, longitude: -74.006 });
    expect(chart.utc.toISOString()).toBe('1990-07-04T16:00:00.000Z');
    expect(chart.tier).toBe('date');
    expect(chart.placements.has('descendant')).toBe(false);
  });

  it('warns rather than hiding a UTC assumption', () => {
    expect(computeChart({ year: 1990, month: 7, day: 4, hour: 14 }).warnings.join(' ')).toContain('UTC was assumed');
  });

  it('rejects a nonexistent local clock time during the spring DST jump', () => {
    expect(() => resolveBirthMoment({ year: 2024, month: 3, day: 10, hour: 2, minute: 30, timeZone: 'America/New_York' })).toThrow(/does not exist/);
  });

  it('requires a choice when the local clock repeats during the autumn change', () => {
    expect(() => resolveBirthMoment({ year: 2024, month: 11, day: 3, hour: 1, minute: 30, timeZone: 'America/New_York' })).toThrow(/occurred twice/);
  });

  it('resolves the two occurrences to distinct UTC instants', () => {
    const input = { year: 2024, month: 11, day: 3, hour: 1, minute: 30, timeZone: 'America/New_York' };
    expect(resolveBirthMoment({ ...input, timeOccurrence: 'earlier' }).utc.toISOString()).toBe('2024-11-03T05:30:00.000Z');
    expect(resolveBirthMoment({ ...input, timeOccurrence: 'later' }).utc.toISOString()).toBe('2024-11-03T06:30:00.000Z');
  });

  it('derives the zone from coordinates', () => {
    const chart = computeChart({
      year: 1990,
      month: 7,
      day: 4,
      hour: 14,
      minute: 30,
      latitude: 40.7128,
      longitude: -74.006,
    });
    expect(chart.timeZone).toBe('America/New_York');
    // July is daylight saving time: UTC-4.
    expect(chart.utc.toISOString()).toBe('1990-07-04T18:30:00.000Z');
  });

  it('applies standard time in winter', () => {
    const chart = computeChart({
      year: 1990,
      month: 1,
      day: 4,
      hour: 14,
      minute: 30,
      latitude: 40.7128,
      longitude: -74.006,
    });
    // January is standard time: UTC-5.
    expect(chart.utc.toISOString()).toBe('1990-01-04T19:30:00.000Z');
  });

  it('rejects an impossible date', () => {
    expect(() =>
      computeChart({ year: 1990, month: 13, day: 45, timeZone: 'UTC' }),
    ).toThrow(/Invalid birth date/);
  });
});

describe('chart angles and input integrity', () => {
  // Independent coordinate transforms check the handwritten horizon formula,
  // rather than merely deriving a second value from that same formula.
  it.each([
    { latitude: 40.7128, longitude: -74.006, hour: 0 },
    { latitude: -33.8688, longitude: 151.2093, hour: 8 },
    { latitude: 0, longitude: 0, hour: 12 },
    { latitude: 51.5074, longitude: -0.1278, hour: 20 },
  ])('puts the Rising point on the eastern horizon at %j', (location) => {
    const chart = computeChart({ year: 2000, month: 1, day: 1, ...location, timeZone: 'UTC' });
    const vector = VectorFromSphere(new Spherical(0, placementOf(chart, 'ascendant').longitude, 1), chart.utc);
    const equatorial = SphereFromVector(RotateVector(Rotation_ECT_EQD(chart.utc), vector));
    const horizon = Horizon(chart.utc, new Observer(location.latitude, location.longitude, 0), equatorial.lon / 15, equatorial.lat);
    // The engine uses true obliquity; our formula uses mean obliquity.
    expect(Math.abs(horizon.altitude)).toBeLessThan(0.01);
    expect(horizon.azimuth).toBeGreaterThan(0);
    expect(horizon.azimuth).toBeLessThan(180);
  });

  it('places Descendant and IC exactly opposite Ascendant and Midheaven', () => {
    const chart = computeChart(EINSTEIN);
    expect(arcminutesApart(placementOf(chart, 'descendant').longitude, placementOf(chart, 'ascendant').longitude + 180)).toBeLessThan(0.0001);
    expect(arcminutesApart(placementOf(chart, 'imumCoeli').longitude, placementOf(chart, 'midheaven').longitude + 180)).toBeLessThan(0.0001);
  });

  it.each([
    { latitude: NaN, longitude: 0 },
    { latitude: 91, longitude: 0 },
    { latitude: 40 },
    { latitude: 0, longitude: Infinity },
    { latitude: 0, longitude: 181 },
    { hour: 24 },
    { hour: 1, minute: 60 },
    { minute: 20 },
    { year: NaN },
    { month: 2, day: 30 },
    { timeZone: 'Invalid/Timezone' },
  ])('rejects invalid input %j', (patch) => {
    expect(() => computeChart({ year: 2000, month: 1, day: 1, ...patch })).toThrow();
  });

  it('does not compute undefined polar horizon angles', () => {
    expect(() => computeChart({ year: 2000, month: 1, day: 1, hour: 12, latitude: 90, longitude: 0 })).toThrow(/geographic poles/);
  });
});

describe('house systems', () => {
  const base: BirthInput = {
    year: 1990,
    month: 7,
    day: 4,
    hour: 14,
    minute: 30,
    latitude: 40.7128,
    longitude: -74.006,
  };

  it('starts whole-sign houses at 0° of the rising sign', () => {
    const chart = computeChart(base, { houseSystem: 'whole-sign' });
    const asc = placementOf(chart, 'ascendant').longitude;
    expect(chart.houses![0]).toBe(Math.floor(asc / 30) * 30);
    chart.houses!.forEach((cusp) => expect(cusp % 30).toBe(0));
  });

  it('starts equal houses exactly on the Ascendant', () => {
    const chart = computeChart(base, { houseSystem: 'equal' });
    const asc = placementOf(chart, 'ascendant').longitude;
    expect(chart.houses![0]).toBeCloseTo(asc, 9);
    expect(chart.houses![6]).toBeCloseTo(normalizeDegrees(asc + 180), 9);
  });

  describe('placidus', () => {
    const chart = computeChart(base, { houseSystem: 'placidus' });
    const cusps = chart.houses!;

    it('anchors the 1st on the Ascendant and the 10th on the Midheaven', () => {
      expect(cusps[0]).toBeCloseTo(placementOf(chart, 'ascendant').longitude, 9);
      expect(cusps[9]).toBeCloseTo(placementOf(chart, 'midheaven').longitude, 9);
    });

    it('keeps opposite cusps exactly 180° apart', () => {
      for (let i = 0; i < 6; i += 1) {
        expect(arcminutesApart(cusps[i]! + 180, cusps[i + 6]!)).toBeLessThan(0.01);
      }
    });

    it('has widths that sum to a full circle', () => {
      const total = cusps.reduce((sum, cusp, i) => {
        const next = cusps[(i + 1) % 12]!;
        return sum + normalizeDegrees(next - cusp);
      }, 0);
      expect(total).toBeCloseTo(360, 6);
    });

    /**
     * Placidus widths vary smoothly around the wheel. A sudden jump means the
     * wrong semi-arc is being divided — the exact bug that produced a 52°
     * first house next to a 21° second before the sign of the ascensional
     * difference was corrected for the below-horizon cusps.
     */
    it('varies house width smoothly, with no discontinuity', () => {
      const widths = cusps.map((cusp, i) =>
        normalizeDegrees(cusps[(i + 1) % 12]! - cusp),
      );
      for (let i = 0; i < widths.length; i += 1) {
        const current = widths[i]!;
        const next = widths[(i + 1) % 12]!;
        expect(
          Math.abs(next - current),
          `jump between house ${i + 1} (${current.toFixed(1)}°) and ${((i + 1) % 12) + 1} (${next.toFixed(1)}°)`,
        ).toBeLessThan(12);
      }
    });

    it('falls back to whole-sign inside the polar circle', () => {
      const polar = computeChart(
        { ...base, latitude: 78.2, longitude: 15.6 },
        { houseSystem: 'placidus' },
      );
      expect(polar.houseSystem).toBe('whole-sign');
      expect(polar.warnings.join(' ')).toMatch(/polar circle/i);
    });
  });
});

describe('angle formulae', () => {
  it('puts the Midheaven at 0° Aries when sidereal time is zero', () => {
    expect(computeMidheaven(0, 23.44)).toBeCloseTo(0, 9);
  });

  it('puts the Ascendant at 0° Cancer at the equator with RAMC 0', () => {
    // With no latitude tilt the horizon meets the ecliptic a quadrant on.
    expect(computeAscendant(0, 23.44, 0)).toBeCloseTo(90, 6);
  });

  it('moves the Ascendant with latitude', () => {
    const equator = computeAscendant(126, 23.44, 0);
    const midLatitude = computeAscendant(126, 23.44, 40.71);
    expect(equator).not.toBeCloseTo(midLatitude, 3);
  });
});

describe('houseOf', () => {
  const cusps = Array.from({ length: 12 }, (_, i) => i * 30);

  it('assigns a longitude to the containing house', () => {
    expect(houseOf(0, cusps)).toBe(1);
    expect(houseOf(29.9, cusps)).toBe(1);
    expect(houseOf(30, cusps)).toBe(2);
    expect(houseOf(359, cusps)).toBe(12);
  });

  it('handles cusps that wrap past 0° Aries', () => {
    // First house starts at 350°, so 5° belongs to house 1.
    const wrapped = Array.from({ length: 12 }, (_, i) => (350 + i * 30) % 360);
    expect(houseOf(355, wrapped)).toBe(1);
    expect(houseOf(5, wrapped)).toBe(1);
    expect(houseOf(25, wrapped)).toBe(2);
  });
});
