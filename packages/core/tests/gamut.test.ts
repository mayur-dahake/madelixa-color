import { describe, it, expect } from 'vitest';
import { clampOklchToSrgb, isOklchOutOfSrgbGamut, oklchToRgb } from '../src';

describe('sRGB Gamut Clamping (Binary Search Chroma Reduction)', () => {
  it('should not alter colors already inside sRGB gamut', () => {
    const insideOklch = { l: 0.623, c: 0.15, h: 250, alpha: 1.0 };
    expect(isOklchOutOfSrgbGamut(insideOklch)).toBe(false);

    const clamped = clampOklchToSrgb(insideOklch);
    expect(clamped.c).toBe(insideOklch.c);
    expect(clamped.l).toBe(insideOklch.l);
    expect(clamped.h).toBe(insideOklch.h);
  });

  it('should reduce chroma for out-of-gamut colors while preserving L and H', () => {
    // Extreme chroma outside sRGB
    const outOklch = { l: 0.7, c: 0.35, h: 140, alpha: 1.0 };
    expect(isOklchOutOfSrgbGamut(outOklch)).toBe(true);

    const clamped = clampOklchToSrgb(outOklch);
    expect(clamped.l).toBe(outOklch.l);
    expect(clamped.h).toBe(outOklch.h);
    expect(clamped.c).toBeLessThan(outOklch.c);

    // After clamping, verify RGB is in gamut
    const rgb = oklchToRgb(clamped);
    expect(rgb.r).toBeGreaterThanOrEqual(0);
    expect(rgb.r).toBeLessThanOrEqual(255);
    expect(rgb.g).toBeGreaterThanOrEqual(0);
    expect(rgb.g).toBeLessThanOrEqual(255);
    expect(rgb.b).toBeGreaterThanOrEqual(0);
    expect(rgb.b).toBeLessThanOrEqual(255);
  });
});
