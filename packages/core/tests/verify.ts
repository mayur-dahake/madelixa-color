import { rgbToOklab, oklabToRgb } from '../src/conversions/oklab.ts';
import { rgbToOklch, oklchToRgb } from '../src/conversions/oklch.ts';
import { rgbToHex, hexToRgb, rgbToHsl, hslToRgb } from '../src/conversions/srgb.ts';
import { rgbToDisplayP3, displayP3ToRgb, isOutOfSrgbGamut } from '../src/conversions/p3.ts';
import { rgbToCmyk, cmykToRgb } from '../src/conversions/cmyk.ts';
import { clampOklchToSrgb, isOklchOutOfSrgbGamut } from '../src/gamut/clamp.ts';
import { getRelativeLuminance, calculateWcagRatio, autoFixContrast, getContrastReport } from '../src/a11y/contrast.ts';
import { parseColorString } from '../src/parser/smart-paste.ts';
import { generateHarmonies } from '../src/harmony/harmonies.ts';
import { generateTailwindScale, toCssVariables } from '../src/scale/tailwind-scale.ts';
import { createDefaultGradient, serializeGradientToCss } from '../src/gradient/gradient.ts';
import { ColorStore } from '../src/store/color-store.ts';

console.log('====================================================');
console.log('🧪 MADELIXA COLOR CORE — VERIFICATION TEST SUITE');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, details?: any) {
  if (condition) {
    console.log(`✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${description}`, details || '');
    failed++;
  }
}

// 1. RGB <-> OKLCH accuracy test
const testBlue = { r: 59, g: 130, b: 246 };
const oklch = rgbToOklch(testBlue.r, testBlue.g, testBlue.b);
const roundTrip = oklchToRgb(oklch);
assert('RGB (59, 130, 246) -> OKLCH -> RGB round-trip delta <= 1',
  Math.abs(roundTrip.r - testBlue.r) <= 1 &&
  Math.abs(roundTrip.g - testBlue.g) <= 1 &&
  Math.abs(roundTrip.b - testBlue.b) <= 1,
  { original: testBlue, oklch, roundTrip }
);

// 2. HEX <-> RGB
const hex = rgbToHex(59, 130, 246);
assert('rgbToHex(59, 130, 246) returns #3b82f6', hex === '#3b82f6');
const backRgb = hexToRgb('#3b82f6');
assert('hexToRgb(#3b82f6) returns exact RGB', backRgb.r === 59 && backRgb.g === 130 && backRgb.b === 246);

// 3. Display P3 Wide Gamut
const p3 = rgbToDisplayP3(59, 130, 246);
const p3Back = displayP3ToRgb(p3);
assert('Display P3 round-trip conversion',
  Math.abs(p3Back.r - 59) <= 1 && Math.abs(p3Back.g - 130) <= 1 && Math.abs(p3Back.b - 246) <= 1,
  { p3, p3Back }
);

// 4. CMYK
const cmyk = rgbToCmyk(255, 0, 0);
assert('rgbToCmyk(255, 0, 0) gives 0, 100, 100, 0', cmyk.c === 0 && cmyk.m === 100 && cmyk.y === 100 && cmyk.k === 0);
const cmykRgb = cmykToRgb(cmyk);
assert('cmykToRgb returns pure red (255, 0, 0)', cmykRgb.r === 255 && cmykRgb.g === 0 && cmykRgb.b === 0);

// 5. Binary-Search Gamut Clamping
const outOfGamut = { l: 0.7, c: 0.35, h: 140, alpha: 1.0 };
assert('Detects out of sRGB gamut', isOklchOutOfSrgbGamut(outOfGamut) === true);
const clamped = clampOklchToSrgb(outOfGamut);
assert('Clamped color reduces chroma while preserving L and H',
  clamped.c < outOfGamut.c && clamped.l === outOfGamut.l && clamped.h === outOfGamut.h
);
const clampedRgb = oklchToRgb(clamped);
assert('Clamped RGB channels strictly bounded inside [0, 255]',
  clampedRgb.r >= 0 && clampedRgb.r <= 255 &&
  clampedRgb.g >= 0 && clampedRgb.g <= 255 &&
  clampedRgb.b >= 0 && clampedRgb.b <= 255
);

// 6. WCAG 2.1 Contrast Engine & Auto-Fix
const whiteBg = { l: 1.0, c: 0, h: 0, alpha: 1 };
const blackFg = { l: 0.0, c: 0, h: 0, alpha: 1 };
const ratioBW = calculateWcagRatio(blackFg, whiteBg);
assert('WCAG ratio between Black and White is 21:1', ratioBW === 21);

const lightYellow = { l: 0.95, c: 0.15, h: 90, alpha: 1 };
const initialReport = getContrastReport(lightYellow, whiteBg);
assert('Light yellow on white initially fails AA', initialReport.aaNormal === false);
const fixed = autoFixContrast(lightYellow, whiteBg, 4.5);
const fixedReport = getContrastReport(fixed, whiteBg);
assert('1-Click Auto-Fix achieves WCAG AA ratio >= 4.5:1', fixedReport.wcagRatio >= 4.5 && fixedReport.aaNormal === true);
assert('Auto-Fix strictly preserves original Hue angle', fixed.h === lightYellow.h);

// 7. Smart Paste Tokenizer
const p1 = parseColorString('#ff5733');
assert('Parses HEX string (#ff5733)', p1?.detectedFormat === 'hex');
const p2 = parseColorString('rgba(59, 130, 246, 0.5)');
assert('Parses RGBA string', p2?.detectedFormat === 'rgb' && p2?.oklch.alpha === 0.5);
const p3_res = parseColorString('oklch(62.3% 0.214 259.8)');
assert('Parses CSS OKLCH string', p3_res?.detectedFormat === 'oklch' && Math.abs(p3_res.oklch.l - 0.623) < 0.01);
const p4 = parseColorString('coral');
assert('Parses W3C named color keyword (coral)', p4?.detectedFormat === 'hex');

// 8. Harmonies Generator
const harmonies = generateHarmonies(oklch);
assert('Generates Complementary harmony (+180 deg)', Math.abs(harmonies.complementary[1]!.h - ((oklch.h + 180) % 360)) < 0.1);
assert('Generates Triadic harmony (3 colors)', harmonies.triadic.length === 3);
assert('Generates Analogous harmony (3 colors)', harmonies.analogous.length === 3);

// 9. Tailwind 50-950 Scale Generator
const scale = generateTailwindScale(oklch);
assert('Generates all 11 Tailwind shade steps (50 to 950)', Object.keys(scale).length === 11);
const cssVars = toCssVariables(scale, 'brand');
assert('Formats scale as valid CSS custom properties', cssVars.includes('--brand-50:') && cssVars.includes('--brand-950:'));

// 10. Gradient Studio Engine
const grad = createDefaultGradient(oklch, { l: 0.8, c: 0.15, h: 100, alpha: 1 });
const gradCss = serializeGradientToCss(grad);
assert('Serializes gradient to CSS linear-gradient string', gradCss.startsWith('linear-gradient('));

// 11. ColorStore FSM
const store = new ColorStore('#3b82f6');
let updateFired = false;
const unsub = store.subscribe(() => { updateFired = true; });
store.dispatch({ type: 'SET_COLOR_STRING', payload: '#ef4444' });
assert('ColorStore dispatches action and triggers subscriber', updateFired === true);
assert('ColorStore getFormatted() matches new color', store.getFormatted('hex').toLowerCase() === '#ef4444');
unsub();

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
