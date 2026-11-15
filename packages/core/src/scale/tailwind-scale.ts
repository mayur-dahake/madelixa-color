import type { OklchColor } from '../types.ts';
import { formatColor } from '../conversions/index.ts';

export interface ShadeStep {
  key: string;
  l: number;
}

const DEFAULT_SHADE_STEPS: ShadeStep[] = [
  { key: '50', l: 0.97 },
  { key: '100', l: 0.92 },
  { key: '200', l: 0.84 },
  { key: '300', l: 0.74 },
  { key: '400', l: 0.65 },
  { key: '500', l: 0.55 }, // Base anchor
  { key: '600', l: 0.48 },
  { key: '700', l: 0.38 },
  { key: '800', l: 0.28 },
  { key: '900', l: 0.18 },
  { key: '950', l: 0.11 }
];

export function generateTailwindScale(base: OklchColor): Record<string, OklchColor> {
  const result: Record<string, OklchColor> = {};

  DEFAULT_SHADE_STEPS.forEach(step => {
    if (step.key === '500') {
      result[step.key] = { ...base };
    } else {
      // Scale chroma slightly down at extreme light/dark ends to prevent gamut clipping
      const chromaDamping = step.l > 0.85 || step.l < 0.2 ? 0.75 : 1.0;
      result[step.key] = {
        l: step.l,
        c: base.c * chromaDamping,
        h: base.h,
        alpha: base.alpha
      };
    }
  });

  return result;
}

export function toCssVariables(
  scale: Record<string, OklchColor>,
  prefix: string = 'primary'
): string {
  return Object.entries(scale)
    .map(([key, oklch]) => `  --${prefix}-${key}: ${formatColor(oklch, 'hex')};`)
    .join('\n');
}

export function toTailwindConfig(
  scale: Record<string, OklchColor>
): Record<string, string> {
  const config: Record<string, string> = {};
  Object.entries(scale).forEach(([key, oklch]) => {
    config[key] = formatColor(oklch, 'hex');
  });
  return config;
}
