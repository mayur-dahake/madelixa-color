export * from './srgb.ts';
export * from './oklab.ts';
export * from './oklch.ts';
export * from './p3.ts';
export * from './cmyk.ts';

import type { OklchColor, ColorSpace } from '../types.ts';
import { oklchToRgb } from './oklch.ts';
import { rgbToHex, rgbToHsl } from './srgb.ts';
import { rgbToDisplayP3 } from './p3.ts';

export function formatColor(oklch: OklchColor, format: ColorSpace): string {
  const rgb = oklchToRgb(oklch);

  switch (format) {
    case 'hex':
      return rgbToHex(rgb.r, rgb.g, rgb.b, oklch.alpha);

    case 'rgb': {
      if (oklch.alpha < 1) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${oklch.alpha})`;
      }
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    case 'hsl': {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b, oklch.alpha);
      if (oklch.alpha < 1) {
        return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${oklch.alpha})`;
      }
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    case 'oklch': {
      const l = +(oklch.l * 100).toFixed(1);
      const c = +oklch.c.toFixed(3);
      const h = +oklch.h.toFixed(1);
      if (oklch.alpha < 1) {
        return `oklch(${l}% ${c} ${h} / ${oklch.alpha})`;
      }
      return `oklch(${l}% ${c} ${h})`;
    }

    case 'p3': {
      const p3 = rgbToDisplayP3(rgb.r, rgb.g, rgb.b, oklch.alpha);
      const r = +p3.r.toFixed(3);
      const g = +p3.g.toFixed(3);
      const b = +p3.b.toFixed(3);
      if (oklch.alpha < 1) {
        return `color(display-p3 ${r} ${g} ${b} / ${oklch.alpha})`;
      }
      return `color(display-p3 ${r} ${g} ${b})`;
    }

    default:
      return rgbToHex(rgb.r, rgb.g, rgb.b, oklch.alpha);
  }
}
