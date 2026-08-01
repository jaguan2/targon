import { describe, expect, it } from 'vitest';
import {
  SIGNS,
  areElementsComplementary,
  degreeInSign,
  formatLongitude,
  getSign,
  getSignByName,
  normalizeDegrees,
  signFromLongitude,
} from './signs';

describe('sign table', () => {
  it('has twelve signs in zodiacal order', () => {
    expect(SIGNS).toHaveLength(12);
    SIGNS.forEach((sign, i) => {
      expect(sign.index).toBe(i);
      expect(sign.startDegree).toBe(i * 30);
    });
  });

  /**
   * The structural invariant the whole aspect model rests on. If either of
   * these cycles were ever edited to be inconsistent, trines would stop being
   * same-element and the compatibility scale would quietly change shape.
   */
  it('cycles element every 4 signs and modality every 3', () => {
    const elements = ['fire', 'earth', 'air', 'water'] as const;
    const modalities = ['cardinal', 'fixed', 'mutable'] as const;

    SIGNS.forEach((sign, i) => {
      expect(sign.element).toBe(elements[i % 4]);
      expect(sign.modality).toBe(modalities[i % 3]);
    });
  });

  it('alternates polarity, matching element parity', () => {
    SIGNS.forEach((sign, i) => {
      expect(sign.polarity).toBe(i % 2 === 0 ? 'active' : 'receptive');
    });
  });

  it('gives each element exactly three signs and each modality four', () => {
    const byElement = new Map<string, number>();
    const byModality = new Map<string, number>();
    for (const sign of SIGNS) {
      byElement.set(sign.element, (byElement.get(sign.element) ?? 0) + 1);
      byModality.set(sign.modality, (byModality.get(sign.modality) ?? 0) + 1);
    }
    expect([...byElement.values()]).toEqual([3, 3, 3, 3]);
    expect([...byModality.values()]).toEqual([4, 4, 4]);
  });

  it('only differs from traditional rulership for the three outer-ruled signs', () => {
    const changed = SIGNS.filter((s) => s.ruler !== s.traditionalRuler).map(
      (s) => s.name,
    );
    expect(changed).toEqual(['scorpio', 'aquarius', 'pisces']);
  });
});

describe('longitude helpers', () => {
  it('normalises degrees into 0–360', () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(-1)).toBe(359);
    expect(normalizeDegrees(725)).toBe(5);
  });

  it('maps longitude to the containing sign', () => {
    expect(signFromLongitude(0).name).toBe('aries');
    expect(signFromLongitude(29.999).name).toBe('aries');
    expect(signFromLongitude(30).name).toBe('taurus');
    expect(signFromLongitude(359.9).name).toBe('pisces');
    // 280.37° is the Sun at J2000 — 10°22' Capricorn.
    expect(signFromLongitude(280.37).name).toBe('capricorn');
  });

  it('wraps sign lookup in both directions', () => {
    expect(getSign(12).name).toBe('aries');
    expect(getSign(-1).name).toBe('pisces');
    expect(getSign(25).name).toBe('taurus');
  });

  it('measures degrees into the sign', () => {
    expect(degreeInSign(0)).toBe(0);
    expect(degreeInSign(45)).toBe(15);
    expect(degreeInSign(280.37)).toBeCloseTo(10.37, 6);
  });

  it('formats longitudes the way charts print them', () => {
    expect(formatLongitude(280.37)).toBe("10°22' Capricorn");
    expect(formatLongitude(0)).toBe("0°00' Aries");
  });

  it('rejects unknown sign names', () => {
    // @ts-expect-error deliberately invalid
    expect(() => getSignByName('ophiuchus')).toThrow();
  });
});

describe('element relationships', () => {
  it('pairs fire with air and earth with water', () => {
    expect(areElementsComplementary('fire', 'air')).toBe(true);
    expect(areElementsComplementary('air', 'fire')).toBe(true);
    expect(areElementsComplementary('earth', 'water')).toBe(true);
    expect(areElementsComplementary('water', 'earth')).toBe(true);
  });

  it('does not treat an element as its own complement', () => {
    expect(areElementsComplementary('fire', 'fire')).toBe(false);
    expect(areElementsComplementary('fire', 'water')).toBe(false);
    expect(areElementsComplementary('air', 'earth')).toBe(false);
  });
});
