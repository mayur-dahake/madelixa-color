# @madelixa/color-dom

> Interaction engine, pointer gestures, ARIA keyboard navigation, Floating UI positioning, and CSS custom property design tokens for Madelixa Color Picker.

Part of the **Madelixa Color Picker** monorepo suite by [MADELIXA](https://github.com/mayur-dahake/madelixa-color) (Author: Mayur Dahake).

## Features

- **60fps PointerGestureController**: Touch, mouse, and pen input handling optimized with `requestAnimationFrame` and `pointerCapture`.
- **High-DPI Retina Canvas**: Automated device pixel ratio scaling (`window.devicePixelRatio`) prevents blurriness on Retina displays.
- **ARIA Keyboard Navigation Matrix**: Full arrow-key incrementation ($\pm 1\%$, Shift for $\pm 10\%$, Home/End clamping, and Escape dismissal).
- **Floating UI Auto-Positioning**: Dynamic anchored popover positioning with automatic flipping, shifting, and boundary detection.
- **BEM Design Tokens (`--mdx-cp-*`)**: Semantic CSS tokens matching high-density creative suites (Figma, Linear, Raycast).

## Installation

```bash
npm install @madelixa/color-dom
# or
pnpm add @madelixa/color-dom
```

## CSS Tokens & Styles

Import the universal stylesheet in your app:

```css
@import '@madelixa/color-dom/styles.css';
```

Or customize design tokens:

```css
:root {
  --mdx-cp-width: 320px;
  --mdx-cp-bg-surface: #ffffff;
  --mdx-cp-bg-subtle: #f4f4f5;
  --mdx-cp-border-color: #e4e4e7;
  --mdx-cp-radius-card: 12px;
  --mdx-cp-focus-ring: 0 0 0 2px #3b82f6;
}
```

## License

MIT © [MADELIXA](https://github.com/mayur-dahake/madelixa-color)
