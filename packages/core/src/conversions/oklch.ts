import type { OklchColor, RgbaColor } from '../types.ts';
import { rgbToOklab, oklabToRgb, oklabToLinearRgb } from './oklab.ts';

export function oklabToOklch(l: number, a: number, b: number, alpha: number = 1): OklchColor {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) {
    h += 360;
  }
  return { l, c, h, alpha };
}

export function oklchToOklab(l: number, c: number, h: number, alpha: number = 1): { l: number; a: number; b: number; alpha: number } {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  return { l, a, b, alpha };
}

export function rgbToOklch(r: number, g: number, b: number, alpha: number = 1): OklchColor {
  const lab = rgbToOklab(r, g, b, alpha);
  return oklabToOklch(lab.l, lab.a, lab.b, alpha);
}

export function oklchToLinearRgb(oklch: OklchColor): { r: number; g: number; b: number } {
  const lab = oklchToOklab(oklch.l, oklch.c, oklch.h, oklch.alpha);
  return oklabToLinearRgb(lab.l, lab.a, lab.b);
}

export function oklchToRgb(oklch: OklchColor): RgbaColor {
  const lab = oklchToOklab(oklch.l, oklch.c, oklch.h, oklch.alpha);
  return oklabToRgb(lab.l, lab.a, lab.b, oklch.alpha);
}
