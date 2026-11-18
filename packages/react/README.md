# @madelixa/color-react

> Production-grade React 18+ hooks and compound color picker components with wide-gamut OKLCH and real-time WCAG accessibility.

Part of the **Madelixa Color Picker** monorepo suite by [MADELIXA](https://github.com/mayur-dahake/madelixa-color) (Author: Mayur Dahake).

## Features

- **React 18/19 Concurrent Safe**: Powered by `useSyncExternalStore` for zero tearing during rapid drag gestures.
- **Radix UI-Style Compound Primitives**: Full ref-forwarding on `ColorPicker.Root`, `ColorPicker.Trigger`, `ColorPicker.Popover`, `ColorPicker.Canvas`, `ColorPicker.Sliders`, `ColorPicker.Inputs`, `ColorPicker.A11yBar`, and `ColorPicker.Swatches`.
- **Predefined Variant Pickers**: Drop-in pickers including `ChromePicker`, `SketchPicker`, `CompactPicker`, and `GithubPicker`.
- **Inline or Popover Mode**: Anchor anywhere or render statically inline.
- **1-Click Auto-Fix**: Automatically adjust lightness to meet WCAG AA/AAA compliance thresholds.

## Installation

```bash
npm install @madelixa/color-react @madelixa/color-dom @madelixa/color-core
# or
pnpm add @madelixa/color-react @madelixa/color-dom @madelixa/color-core
```

## Quick Start

### 1. Predefined Variant Pickers

```tsx
import React, { useState } from 'react';
import { SketchPicker, ChromePicker, CompactPicker, GithubPicker } from '@madelixa/color-react';
import '@madelixa/color-dom/styles.css';

export function MyComponent() {
  const [color, setColor] = useState('#3b82f6');

  return (
    <SketchPicker
      value={color}
      onChange={setColor}
      showAlpha={true}
    />
  );
}
```

### 2. Compound Component Architecture

```tsx
import React, { useState } from 'react';
import { ColorPicker } from '@madelixa/color-react';
import '@madelixa/color-dom/styles.css';

export function CustomPicker() {
  const [color, setColor] = useState('#3b82f6');

  return (
    <ColorPicker.Root value={color} onChange={setColor}>
      <ColorPicker.Trigger />
      <ColorPicker.Popover>
        <ColorPicker.Canvas />
        <ColorPicker.Sliders showAlpha={true} />
        <ColorPicker.Inputs />
        <ColorPicker.A11yBar />
        <ColorPicker.Swatches />
      </ColorPicker.Popover>
    </ColorPicker.Root>
  );
}
```

### 3. Headless React Hook (`useColorPicker`)

```tsx
import { useColorPicker } from '@madelixa/color-react';

export function HeadlessExample() {
  const { hex, oklch, contrastRatio, isAccessible, autoFix, setColor } = useColorPicker({
    value: '#ef4444',
    contrastBg: '#ffffff'
  });

  return (
    <div>
      <p>Color: {hex} ({oklch})</p>
      <p>Contrast: {contrastRatio}:1 - {isAccessible ? '✅ AA Pass' : '❌ AA Fail'}</p>
      <button onClick={() => autoFix(4.5)}>Auto-Fix Contrast</button>
    </div>
  );
}
```

## License

MIT © [MADELIXA](https://github.com/mayur-dahake/madelixa-color)
