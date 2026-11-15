import type { OklchColor } from '../types.ts';

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

export interface ColorHarmonies {
  complementary: OklchColor[];
  splitComplementary: OklchColor[];
  triadic: OklchColor[];
  tetradic: OklchColor[];
  analogous: OklchColor[];
  monochromatic: OklchColor[];
}

export function generateHarmonies(base: OklchColor): ColorHarmonies {
  const { l, c, h, alpha } = base;

  return {
    complementary: [
      base,
      { l, c, h: normalizeHue(h + 180), alpha }
    ],
    splitComplementary: [
      base,
      { l, c, h: normalizeHue(h + 150), alpha },
      { l, c, h: normalizeHue(h + 210), alpha }
    ],
    triadic: [
      base,
      { l, c, h: normalizeHue(h + 120), alpha },
      { l, c, h: normalizeHue(h + 240), alpha }
    ],
    tetradic: [
      base,
      { l, c, h: normalizeHue(h + 60), alpha },
      { l, c, h: normalizeHue(h + 180), alpha },
      { l, c, h: normalizeHue(h + 240), alpha }
    ],
    analogous: [
      { l, c, h: normalizeHue(h - 30), alpha },
      base,
      { l, c, h: normalizeHue(h + 30), alpha }
    ],
    monochromatic: [
      { l: Math.min(1, l + 0.25), c: Math.max(0, c - 0.05), h, alpha },
      { l: Math.min(1, l + 0.12), c, h, alpha },
      base,
      { l: Math.max(0, l - 0.12), c, h, alpha },
      { l: Math.max(0, l - 0.25), c: Math.max(0, c - 0.05), h, alpha }
    ]
  };
}
