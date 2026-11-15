import type { RgbaColor, HslaColor } from '../types.ts';

export function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.min(Math.max(v * 255, 0), 255));
}

export function rgbToHex(r: number, g: number, b: number, alpha: number = 1): string {
  const roundR = Math.round(Math.min(Math.max(r, 0), 255));
  const roundG = Math.round(Math.min(Math.max(g, 0), 255));
  const roundB = Math.round(Math.min(Math.max(b, 0), 255));
  const hex = ((1 << 24) + (roundR << 16) + (roundG << 8) + roundB).toString(16).slice(1);

  if (alpha < 1) {
    const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
    const alphaHex = (a < 16 ? '0' : '') + a.toString(16);
    return `#${hex}${alphaHex}`;
  }
  return `#${hex}`;
}

export function hexToRgb(hex: string): RgbaColor {
  let clean = hex.trim().replace(/^#/, '');

  let alpha = 1;
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  } else if (clean.length === 4) {
    const aChar = clean[3] ?? 'f';
    const aHex = aChar + aChar;
    alpha = parseInt(aHex, 16) / 255;
    clean = clean.slice(0, 3).split('').map(c => c + c).join('');
  } else if (clean.length === 8) {
    const aHex = clean.slice(6, 8);
    alpha = parseInt(aHex, 16) / 255;
    clean = clean.slice(0, 6);
  }

  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0, alpha: 1 };
  }

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    alpha: +alpha.toFixed(3)
  };
}

export function rgbToHsl(r: number, g: number, b: number, alpha: number = 1): HslaColor {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    alpha
  };
}

export function hslToRgb(h: number, s: number, l: number, alpha: number = 1): RgbaColor {
  h = (h % 360) / 360;
  s = s / 100;
  l = l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v, alpha };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    alpha
  };
}
