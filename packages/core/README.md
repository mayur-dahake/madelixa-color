# @madelixa/color-core

> Zero-dependency, ultra-fast OKLCH, Display P3, WCAG 2.1 & APCA accessibility color math engine.

Part of the **Madelixa Color Picker** monorepo suite by [MADELIXA](https://github.com/mayur-dahake/madelixa-color) (Author: Mayur Dahake).

## Features

- **Perceptual OKLCH Math**: Linear lightness ($L$), chroma ($C$), and hue ($H$) transforms with no unnatural hue shifting.
- **Wide Gamut & Display P3**: Native support for sRGB, Display P3, OKLab, and CMYK with lossless conversions.
- **Binary Search Gamut Clamping**: Intelligently scales chroma downward while preserving lightness and hue for out-of-gamut display.
- **Accessibility Engine**: WCAG 2.1 relative luminance and APCA $L^c$ contrast calculations with 1-click Auto-Fix.
- **Palette & Harmonies**: Complementary, Triadic, Analogous, and Tetradic harmonies, plus 11-step Tailwind 50–950 shade ramp generation.
- **Smart Paste Tokenizer**: Auto-detects HEX, RGB, HSL, OKLCH, Display P3, or named CSS color keywords.
- **Finite State Machine Store**: SSR-safe, zero-dependency observable color store.

## Installation

```bash
npm install @madelixa/color-core
# or
pnpm add @madelixa/color-core
# or
yarn add @madelixa/color-core
```

## Quick Start

```typescript
import {
  createColorStore,
  oklchToRgb,
  rgbToHex,
  getContrastReport,
  generateTailwindScale,
  autoFixContrast
} from '@madelixa/color-core';

// 1. Initialize store
const store = createColorStore('#3b82f6', '#ffffff');

// 2. Access state
console.log(store.getFormatted('hex')); // #3b82f6
console.log(store.getFormatted('oklch')); // oklch(0.623 0.188 259.8)

// 3. Contrast & Auto-Fix
const report = getContrastReport(
  store.getState().currentOklch,
  { l: 1, c: 0, h: 0, alpha: 1 } // white background
);
console.log(`WCAG Ratio: ${report.wcagRatio}:1, Passes AA: ${report.passesAA}`);

// If failing AA (4.5:1), auto-adjust lightness
const fixedOklch = autoFixContrast(
  store.getState().currentOklch,
  { l: 1, c: 0, h: 0, alpha: 1 },
  4.5
);

// 4. Generate Tailwind 50-950 ramp
const scale = generateTailwindScale(store.getState().currentOklch);
console.log(scale['500']); // Base anchor
```

## License

MIT © [MADELIXA](https://github.com/mayur-dahake/madelixa-color)
