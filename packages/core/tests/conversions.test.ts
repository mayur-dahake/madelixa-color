import { describe, it, expect } from 'vitest';
import {
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToOklab,
  oklabToRgb,
  rgbToOklch,
  oklchToRgb,
  rgbToDisplayP3,
  displayP3ToRgb,
  rgbToCmyk,
  cmykToRgb,
  formatColor
} from '../src';

describe('sRGB & Hex Conversions', () => {
  it('should convert RGB to HEX correctly', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(59, 130, 246)).toBe('#3b82f6');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(255, 0, 0, 0.5)).toBe('#ff000080');
  });

  it('should convert HEX to RGB correctly', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0, alpha: 1 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255, alpha: 1 });
    expect(hexToRgb('3b82f6')).toEqual({ r: 59, g: 130, b: 246, alpha: 1 });
    expect(hexToRgb('#ff000080')).toEqual({ r: 255, g: 0, b: 0, alpha: 0.502 });
  });

  it('should round-trip RGB <-> HSL', () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl).toEqual({ h: 0, s: 100, l: 50, alpha: 1 });
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb).toEqual({ r: 255, g: 0, b: 0, alpha: 1 });
  });
});

describe('OKLab & OKLCH Conversions', () => {
  it('should accurately convert RGB to OKLab and back', () => {
    const oklab = rgbToOklab(255, 255, 255);
    expect(oklab.l).toBeCloseTo(1.0, 3);
    expect(oklab.a).toBeCloseTo(0.0, 3);
    expect(oklab.b).toBeCloseTo(0.0, 3);

    const rgb = oklabToRgb(oklab.l, oklab.a, oklab.b);
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(255);
  });

  it('should accurately convert RGB to OKLCH and back', () => {
    const oklch = rgbToOklch(59, 130, 246);
    expect(oklch.l).toBeGreaterThan(0.5);
    expect(oklch.l).toBeLessThan(0.7);
    expect(oklch.c).toBeGreaterThan(0.15);

    const rgb = oklchToRgb(oklch);
    expect(rgb.r).toBeCloseTo(59, 0);
    expect(rgb.g).toBeCloseTo(130, 0);
    expect(rgb.b).toBeCloseTo(246, 0);
  });
});

describe('Display P3 & CMYK Conversions', () => {
  it('should convert sRGB to Display P3 and back', () => {
    const p3 = rgbToDisplayP3(59, 130, 246);
    expect(p3.r).toBeGreaterThan(0);
    expect(p3.r).toBeLessThanOrEqual(1);

    const rgb = displayP3ToRgb(p3);
    expect(rgb.r).toBeCloseTo(59, 0);
    expect(rgb.g).toBeCloseTo(130, 0);
    expect(rgb.b).toBeCloseTo(246, 0);
  });

  it('should convert sRGB to CMYK and back', () => {
    const cmyk = rgbToCmyk(255, 0, 0);
    expect(cmyk.c).toBe(0);
    expect(cmyk.m).toBe(100);
    expect(cmyk.y).toBe(100);
    expect(cmyk.k).toBe(0);

    const rgb = cmykToRgb(cmyk);
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });
});

describe('Color Formatter', () => {
  it('should format OKLCH into all standard CSS color strings', () => {
    const oklch = { l: 0.623, c: 0.214, h: 259.8, alpha: 1.0 };
    expect(formatColor(oklch, 'hex')).toMatch(/^#[0-9a-f]{6}$/i);
    expect(formatColor(oklch, 'rgb')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(formatColor(oklch, 'hsl')).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    expect(formatColor(oklch, 'oklch')).toContain('oklch(');
    expect(formatColor(oklch, 'p3')).toContain('color(display-p3');
  });
});
