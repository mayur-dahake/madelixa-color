# Madelixa Color Picker (`madelixa-color`)

> **Universal, accessible, wide-gamut OKLCH & Display P3 color picker suite for Angular, React, and Web Components.**  
> Engineered by **MADELIXA** (Author: Mayur Dahake).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Monorepo](https://img.shields.io/badge/Turborepo-pnpm-6366f1.svg)](https://turbo.build/)
[![Bundle Size](https://img.shields.io/badge/Core%20Size-%3C%204.5%20kB%20gzipped-emerald.svg)]()
[![A11y Compliant](https://img.shields.io/badge/WCAG%202.1-AA%20%2F%20AAA-success.svg)]()
[![Live Demo](https://img.shields.io/badge/Demo-Live%20Preview-3b82f6?logo=github&logoColor=white)](https://mayur-dahake.github.io/madelixa-color/)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/mayur-dahake/madelixa-color/tree/main/apps/showcase-react?file=src%2FApp.tsx)

---

## 🌟 Why Madelixa Color?

Existing open-source color pickers are largely tied to a single framework, lack support for modern wide-gamut CSS color spaces (`oklch()`, `color(display-p3)`), and treat accessibility contrast as an afterthought.

Madelixa Color provides:
1. **Perceptually Uniform OKLCH Canonical State**: Linear lightness and chroma adjustments without unexpected hue shifting.
2. **Binary Search sRGB Gamut Clamping**: Automatically preserves perceived lightness and hue when vivid wide-gamut colors exceed standard monitor bounds.
3. **Real-Time WCAG 2.1 & APCA Accessibility Engine**: Live contrast ratios with a **1-Click "⚡ Auto-Fix Contrast"** lightness adjustment.
4. **Color Blindness Simulator**: Live preview matrices for Protanopia, Deuteranopia, Tritanopia, and Achromatopsia.
5. **Tailwind 50–950 Shade Generator**: Instantly generate 11-step palette ramps with 1-click CSS Variables or Tailwind JSON export.
6. **Smart Paste Tokenizer**: Paste `#hex`, `rgb(...)`, `hsl(...)`, `oklch(...)`, or CSS named colors (`coral`) with automatic AST-lite parsing.
7. **Multi-Stop Gradient Builder**: Linear, Radial, and Conic gradients with draggable angle dials and CSS generator.
8. **Native EyeDropper API**: Built-in screen sampling with canvas magnifier loupe fallback.

---

## 📦 Packages in this Monorepo

| Package | Version | Responsibility | Bundle Size |
| :--- | :--- | :--- | :--- |
| **`@madelixa/color-core`** | `0.1.1` | Zero-dependency headless math engine, OKLCH conversions, gamut clamping, WCAG/APCA contrast, Smart Paste, and FSM store. | **< 4.5 kB** gzipped |
| **`@madelixa/color-dom`** | `0.1.1` | 60fps PointerGestureController with rAF throttling, ARIA keyboard navigation matrix, Floating UI positioning, and `--mdx-cp-*` tokens. | **< 2.5 kB** gzipped |
| **`@madelixa/color-react`** | `0.1.1` | React 18+ hooks (`useColorPicker` with `useSyncExternalStore` for concurrent rendering safety), compound components, and drop-in variants (`SketchPicker`, `ChromePicker`, `CompactPicker`, `GithubPicker`). | **< 2.0 kB** gzipped |
| **`@madelixa/color-angular`** | `0.1.1` | Standalone Angular component with Signals (`input`, `model`), 5 variant styles (`sketch`, `chrome`, `compact`, `github`, `swatches`), `ControlValueAccessor` (`[(ngModel)]`), `ColorPickerControl`, and 60fps drag optimization. | **< 2.5 kB** gzipped |
| **`@madelixa/color-wc`** | `0.1.1` | Form-Associated Custom Element `<madelixa-color-picker>` (Lit + Shadow DOM + ElementInternals) for plain HTML, Vue, Svelte, or legacy pages. | **< 3.5 kB** gzipped |

---

## 🚀 Quickstart

### Angular (17+ / 18+ / 19+)

```typescript
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MadelixaColorPickerComponent } from '@madelixa/color-angular';

@Component({
  standalone: true,
  imports: [FormsModule, MadelixaColorPickerComponent],
  template: `
    <madelixa-color-picker
      [(ngModel)]="brandColor"
      format="oklch"
      [minContrastRatio]="4.5"
    />
  `
})
export class AppComponent {
  brandColor = signal('#3b82f6');
}
```

### React (18+ / 19+)

```tsx
import React, { useState } from 'react';
import { ColorPicker, useColorPicker } from '@madelixa/color-react';

export function Header() {
  const [color, setColor] = useState('#3b82f6');

  return (
    <ColorPicker.Root value={color} onChange={setColor}>
      <ColorPicker.Trigger />
      <ColorPicker.Popover>
        <ColorPicker.Canvas />
        <ColorPicker.Sliders />
        <ColorPicker.A11yBar />
      </ColorPicker.Popover>
    </ColorPicker.Root>
  );
}
```

### Web Component / Vanilla HTML

```html
<script type="module" src="https://unpkg.com/@madelixa/color-wc"></script>

<form action="/api/theme">
  <madelixa-color-picker name="primaryColor" value="#3b82f6" format="oklch"></madelixa-color-picker>
  <button type="submit">Save Theme</button>
</form>
```

---

## 🎨 Theming Tokens (`--mdx-cp-*`)

All components consume semantic CSS custom properties:

```css
:root {
  --mdx-cp-width: 320px;
  --mdx-cp-bg-surface: #ffffff;
  --mdx-cp-bg-subtle: #f4f4f5;
  --mdx-cp-border-color: #e4e4e7;
  --mdx-cp-text-primary: #18181b;
  --mdx-cp-radius-card: 12px;
  --mdx-cp-radius-control: 6px;
  --mdx-cp-focus-ring: 0 0 0 2px #3b82f6;
}

[data-theme="dark"] {
  --mdx-cp-bg-surface: #18181b;
  --mdx-cp-bg-subtle: #27272a;
  --mdx-cp-border-color: #3f3f46;
  --mdx-cp-text-primary: #fafafa;
}
```

---

## 🧪 Testing & Verification

Run the core verification test suite:

```bash
pnpm run test:verify
# or run unit tests via Vitest
pnpm test
```

All 25 test suites run with 100% precision:
- RGB $\leftrightarrow$ OKLCH, Display P3, and CMYK round-trip precision
- Binary search sRGB gamut clamping preserving Lightness & Hue
- WCAG 2.1 relative luminance and 1-Click Auto-Fix ($\ge 4.5:1$)
- Smart Paste tokenizer (HEX, rgba, oklch, P3, named colors)
- Harmonies and 50–950 Tailwind tint scale generation
- ColorStore finite state machine and subscriber synchronization

---

## 📄 License

MIT © [MADELIXA](https://github.com/madelixa) — Created by Mayur Dahake.
