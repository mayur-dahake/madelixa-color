import type { OklchColor, ColorSpace } from '../types.ts';
import { hexToRgb, rgbToHsl, hslToRgb } from '../conversions/srgb.ts';
import { rgbToOklch } from '../conversions/oklch.ts';
import { displayP3ToRgb } from '../conversions/p3.ts';

export const W3C_NAMED_COLORS: Record<string, string> = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32',
  transparent: '#00000000'
};

const HEX_REGEX = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_REGEX = /^rgba?\(\s*([\d.%]+)[\s,]+([\d.%]+)[\s,]+([\d.%]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i;
const HSL_REGEX = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.%]+))?\s*\)$/i;
const OKLCH_REGEX = /^oklch\(\s*([\d.%]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)$/i;
const P3_REGEX = /^color\(\s*display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)$/i;

function parsePercentageOrNumber(val: string, max: number): number {
  if (val.endsWith('%')) {
    return (parseFloat(val) / 100) * max;
  }
  return parseFloat(val);
}

export interface ParseResult {
  oklch: OklchColor;
  detectedFormat: ColorSpace;
}

/**
 * Smart Paste Tokenizer: Parses any valid CSS color string into canonical OKLCH and detects the format.
 */
export function parseColorString(input: string): ParseResult | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // 1. HEX Format
  if (clean.startsWith('#') || HEX_REGEX.test(clean)) {
    const rgb = hexToRgb(clean);
    return {
      oklch: rgbToOklch(rgb.r, rgb.g, rgb.b, rgb.alpha),
      detectedFormat: 'hex'
    };
  }

  // 2. Functional OKLCH
  const oklchMatch = clean.match(OKLCH_REGEX);
  if (oklchMatch && oklchMatch[1] && oklchMatch[2] && oklchMatch[3]) {
    const l = parsePercentageOrNumber(oklchMatch[1], 1.0);
    const c = parseFloat(oklchMatch[2]);
    const h = parseFloat(oklchMatch[3]);
    const alpha = oklchMatch[4] ? parsePercentageOrNumber(oklchMatch[4], 1.0) : 1.0;
    return {
      oklch: { l, c, h, alpha },
      detectedFormat: 'oklch'
    };
  }

  // 3. Functional RGB / RGBA
  const rgbMatch = clean.match(RGB_REGEX);
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    const r = parsePercentageOrNumber(rgbMatch[1], 255);
    const g = parsePercentageOrNumber(rgbMatch[2], 255);
    const b = parsePercentageOrNumber(rgbMatch[3], 255);
    const alpha = rgbMatch[4] ? parsePercentageOrNumber(rgbMatch[4], 1.0) : 1.0;
    return {
      oklch: rgbToOklch(r, g, b, alpha),
      detectedFormat: 'rgb'
    };
  }

  // 4. Functional HSL / HSLA
  const hslMatch = clean.match(HSL_REGEX);
  if (hslMatch && hslMatch[1] && hslMatch[2] && hslMatch[3]) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]);
    const l = parseFloat(hslMatch[3]);
    const alpha = hslMatch[4] ? parsePercentageOrNumber(hslMatch[4], 1.0) : 1.0;
    const rgb = hslToRgb(h, s, l, alpha);
    return {
      oklch: rgbToOklch(rgb.r, rgb.g, rgb.b, alpha),
      detectedFormat: 'hsl'
    };
  }

  // 5. Functional Display P3
  const p3Match = clean.match(P3_REGEX);
  if (p3Match && p3Match[1] && p3Match[2] && p3Match[3]) {
    const r = parseFloat(p3Match[1]);
    const g = parseFloat(p3Match[2]);
    const b = parseFloat(p3Match[3]);
    const alpha = p3Match[4] ? parsePercentageOrNumber(p3Match[4], 1.0) : 1.0;
    const rgb = displayP3ToRgb({ r, g, b, alpha });
    return {
      oklch: rgbToOklch(rgb.r, rgb.g, rgb.b, alpha),
      detectedFormat: 'p3'
    };
  }

  // 6. W3C Named Colors
  const namedHex = W3C_NAMED_COLORS[clean];
  if (namedHex) {
    const rgb = hexToRgb(namedHex);
    return {
      oklch: rgbToOklch(rgb.r, rgb.g, rgb.b, rgb.alpha),
      detectedFormat: 'hex'
    };
  }

  return null;
}
