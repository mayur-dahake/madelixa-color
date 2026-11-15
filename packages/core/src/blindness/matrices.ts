import type { RgbaColor, ColorVisionMode } from '../types.ts';

export interface VisionMatrix {
  r: [number, number, number];
  g: [number, number, number];
  b: [number, number, number];
}

export const VISION_MATRICES: Record<Exclude<ColorVisionMode, 'normal'>, VisionMatrix> = {
  protanopia: {
    r: [0.567, 0.433, 0],
    g: [0.558, 0.442, 0],
    b: [0, 0.242, 0.758]
  },
  deuteranopia: {
    r: [0.625, 0.375, 0],
    g: [0.7, 0.3, 0],
    b: [0, 0.3, 0.7]
  },
  tritanopia: {
    r: [0.95, 0.05, 0],
    g: [0, 0.433, 0.567],
    b: [0, 0.475, 0.525]
  },
  achromatopsia: {
    r: [0.299, 0.587, 0.114],
    g: [0.299, 0.587, 0.114],
    b: [0.299, 0.587, 0.114]
  }
};

/**
 * Simulates how an RGB color appears under various forms of color vision deficiency.
 */
export function simulateColorVision(rgb: RgbaColor, mode: ColorVisionMode): RgbaColor {
  if (mode === 'normal') {
    return rgb;
  }

  const matrix = VISION_MATRICES[mode];
  const r = rgb.r * matrix.r[0] + rgb.g * matrix.r[1] + rgb.b * matrix.r[2];
  const g = rgb.r * matrix.g[0] + rgb.g * matrix.g[1] + rgb.b * matrix.g[2];
  const b = rgb.r * matrix.b[0] + rgb.g * matrix.b[1] + rgb.b * matrix.b[2];

  return {
    r: Math.round(Math.max(0, Math.min(255, r))),
    g: Math.round(Math.max(0, Math.min(255, g))),
    b: Math.round(Math.max(0, Math.min(255, b))),
    alpha: rgb.alpha
  };
}
