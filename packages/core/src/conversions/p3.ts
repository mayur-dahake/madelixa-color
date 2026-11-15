import type { DisplayP3Color, RgbaColor } from '../types.ts';
import { srgbToLinear, linearToSrgb } from './srgb.ts';

/**
 * Standard D65 Matrix transforms between Linear sRGB and Linear Display P3
 */
export function rgbToDisplayP3(r: number, g: number, b: number, alpha: number = 1): DisplayP3Color {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // Linear sRGB to Linear Display P3
  const p3R_lin = 0.8224621 * rLin + 0.1775380 * gLin + 0.0000000 * bLin;
  const p3G_lin = 0.0331941 * rLin + 0.9668058 * gLin + 0.0000000 * bLin;
  const p3B_lin = 0.0170827 * rLin + 0.0723974 * gLin + 0.9105199 * bLin;

  // Apply sRGB transfer function (gamma curve)
  const gamma = (c: number) => {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
  };

  return {
    r: Math.max(0, Math.min(1, gamma(p3R_lin))),
    g: Math.max(0, Math.min(1, gamma(p3G_lin))),
    b: Math.max(0, Math.min(1, gamma(p3B_lin))),
    alpha
  };
}

export function displayP3ToRgb(p3: DisplayP3Color): RgbaColor {
  const invGamma = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const p3R_lin = invGamma(p3.r);
  const p3G_lin = invGamma(p3.g);
  const p3B_lin = invGamma(p3.b);

  // Linear Display P3 to Linear sRGB
  const rLin = 1.2249401 * p3R_lin - 0.2249404 * p3G_lin + 0.0000000 * p3B_lin;
  const gLin = -0.0420569 * p3R_lin + 1.0420571 * p3G_lin + 0.0000000 * p3B_lin;
  const bLin = -0.0196376 * p3R_lin - 0.0786361 * p3G_lin + 1.0982735 * p3B_lin;

  return {
    r: linearToSrgb(rLin),
    g: linearToSrgb(gLin),
    b: linearToSrgb(bLin),
    alpha: p3.alpha
  };
}

export function isOutOfSrgbGamut(p3: DisplayP3Color): boolean {
  const invGamma = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const p3R_lin = invGamma(p3.r);
  const p3G_lin = invGamma(p3.g);
  const p3B_lin = invGamma(p3.b);

  const rLin = 1.2249401 * p3R_lin - 0.2249404 * p3G_lin;
  const gLin = -0.0420569 * p3R_lin + 1.0420571 * p3G_lin;
  const bLin = -0.0196376 * p3R_lin - 0.0786361 * p3G_lin + 1.0982735 * p3B_lin;

  return rLin < -0.001 || rLin > 1.001 || gLin < -0.001 || gLin > 1.001 || bLin < -0.001 || bLin > 1.001;
}
