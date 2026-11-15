import type { OklchColor, ContrastReport } from '../types.ts';
import { oklchToRgb } from '../conversions/oklch.ts';
import { srgbToLinear } from '../conversions/srgb.ts';
import { clampOklchToSrgb } from '../gamut/clamp.ts';

/**
 * Calculates WCAG 2.1 Relative Luminance of an sRGB color.
 * L = 0.2126 * Rlin + 0.7152 * Glin + 0.0722 * Blin
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

export function getOklchLuminance(oklch: OklchColor): number {
  const rgb = oklchToRgb(oklch);
  return getRelativeLuminance(rgb.r, rgb.g, rgb.b);
}

/**
 * Calculates WCAG 2.1 contrast ratio between two colors (range: 1:1 to 21:1).
 */
export function calculateWcagRatio(fg: OklchColor, bg: OklchColor): number {
  const lum1 = getOklchLuminance(fg);
  const lum2 = getOklchLuminance(bg);

  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return +((l1 + 0.05) / (l2 + 0.05)).toFixed(2);
}

/**
 * APCA (Accessible Perceptual Contrast Algorithm) Lightness Contrast calculation.
 */
export function calculateApcaScore(fg: OklchColor, bg: OklchColor): number {
  const lumFg = getOklchLuminance(fg);
  const lumBg = getOklchLuminance(bg);

  // Exponent constants for APCA 0.98G
  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;

  let SAPC = 0;
  if (lumBg > lumFg) {
    // Dark text on light background
    SAPC = (Math.pow(lumBg, normBG) - Math.pow(lumFg, normTXT)) * 1.14;
  } else {
    // Light text on dark background
    SAPC = (Math.pow(lumBg, revBG) - Math.pow(lumFg, revTXT)) * 1.14;
  }

  const output = Math.abs(SAPC) < 0.1 ? 0 : SAPC * 100;
  return +output.toFixed(1);
}

/**
 * Generates a complete contrast compliance report for foreground vs background.
 */
export function getContrastReport(fg: OklchColor, bg: OklchColor): ContrastReport {
  const ratio = calculateWcagRatio(fg, bg);
  const apca = calculateApcaScore(fg, bg);

  return {
    wcagRatio: ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
    apcaLc: apca
  };
}

/**
 * 1-Click Contrast Auto-Fix Algorithm.
 * Dynamically adjusts the foreground color's Lightness parameter (L) using binary search
 * to hit the target WCAG contrast ratio (e.g. 4.5:1) relative to a given background,
 * strictly keeping Hue (H) and Chroma (C) intact.
 */
export function autoFixContrast(
  fg: OklchColor,
  bg: OklchColor,
  targetRatio: number = 4.5
): OklchColor {
  const bgLuminance = getOklchLuminance(bg);
  const currentRatio = calculateWcagRatio(fg, bg);

  if (currentRatio >= targetRatio) {
    return fg;
  }

  // Determine direction: push towards lighter (1.0) or darker (0.0)
  const shouldLighten = bgLuminance < 0.5;

  let minL = shouldLighten ? fg.l : 0.0;
  let maxL = shouldLighten ? 1.0 : fg.l;
  let bestL = fg.l;

  for (let i = 0; i < 14; i++) {
    const testL = (minL + maxL) / 2;
    const candidate = clampOklchToSrgb({ ...fg, l: testL });
    const ratio = calculateWcagRatio(candidate, bg);

    if (ratio >= targetRatio) {
      bestL = testL;
      // Search for minimal change needed
      if (shouldLighten) {
        maxL = testL;
      } else {
        minL = testL;
      }
    } else {
      if (shouldLighten) {
        minL = testL;
      } else {
        maxL = testL;
      }
    }
  }

  return clampOklchToSrgb({ ...fg, l: bestL });
}
