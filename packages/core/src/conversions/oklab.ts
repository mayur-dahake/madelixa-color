import { srgbToLinear, linearToSrgb } from './srgb.ts';
import type { RgbaColor } from '../types.ts';

export interface OklabColor {
  l: number;
  a: number;
  b: number;
  alpha: number;
}

export function rgbToOklab(r: number, g: number, b: number, alpha: number = 1): OklabColor {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // Linear sRGB to XYZ (D65)
  const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin;
  const z = 0.0193339 * rLin + 0.1191920 * gLin + 0.9503041 * bLin;

  // XYZ to LMS (M1)
  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;

  // Cube-root non-linearity
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS to OKLab (M2)
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757993 * s_;

  return { l: L, a: A, b: B, alpha };
}

export function oklabToLinearRgb(l: number, a: number, b: number): { r: number; g: number; b: number } {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  const x = 1.2270138511 * L - 0.5577999807 * M + 0.2812561490 * S;
  const y = -0.0405801784 * L + 1.1122568696 * M - 0.0716766787 * S;
  const z = -0.0763812845 * L - 0.4214819784 * M + 1.5861632204 * S;

  const rLin = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gLin = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const bLin = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  return { r: rLin, g: gLin, b: bLin };
}

export function oklabToRgb(l: number, a: number, b: number, alpha: number = 1): RgbaColor {
  const lin = oklabToLinearRgb(l, a, b);

  return {
    r: linearToSrgb(lin.r),
    g: linearToSrgb(lin.g),
    b: linearToSrgb(lin.b),
    alpha
  };
}
