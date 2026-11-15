import type { OklchColor } from '../types.ts';
import { oklchToLinearRgb } from '../conversions/oklch.ts';

/**
 * Checks if an OKLCH color falls strictly within the sRGB display gamut.
 */
export function isOklchOutOfSrgbGamut(oklch: OklchColor): boolean {
  const lin = oklchToLinearRgb(oklch);
  return (
    lin.r < -0.001 ||
    lin.r > 1.001 ||
    lin.g < -0.001 ||
    lin.g > 1.001 ||
    lin.b < -0.001 ||
    lin.b > 1.001
  );
}

/**
 * Binary search sRGB gamut clamping.
 * When an OKLCH color exceeds the sRGB gamut, reduces Chroma (C)
 * while strictly preserving perceived Lightness (L) and Hue (H).
 */
export function clampOklchToSrgb(oklch: OklchColor): OklchColor {
  if (!isOklchOutOfSrgbGamut(oklch)) {
    return oklch;
  }

  let minChroma = 0;
  let maxChroma = oklch.c;
  let currentChroma = oklch.c;
  const clampedOklch = { ...oklch };

  const EPSILON = 0.0001;
  const MAX_ITERATIONS = 16;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (maxChroma - minChroma < EPSILON) break;

    currentChroma = (minChroma + maxChroma) / 2;
    clampedOklch.c = currentChroma;

    const testLin = oklchToLinearRgb(clampedOklch);
    const isInGamut =
      testLin.r >= -0.001 &&
      testLin.r <= 1.001 &&
      testLin.g >= -0.001 &&
      testLin.g <= 1.001 &&
      testLin.b >= -0.001 &&
      testLin.b <= 1.001;

    if (isInGamut) {
      minChroma = currentChroma;
    } else {
      maxChroma = currentChroma;
    }
  }

  clampedOklch.c = minChroma;
  return clampedOklch;
}
