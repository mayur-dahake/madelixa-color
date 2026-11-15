# Madelixa Color Picker (`madelixa-color`) — Design System & Tokens Specification

**Organization:** MADELIXA  
**Author:** Mayur Dahake  
**Architecture:** 320px Compact Popover with Progressive Disclosure  
**Token Namespace:** `--mdx-cp-*`

---

## 1. Visual Anatomy & Layout Matrix

The Madelixa Color Picker follows a compact, precision-crafted **320px fixed-width popover** architecture inspired by Figma, Linear, and Raycast. It uses progressive disclosure to keep advanced features accessible without overwhelming the primary color selection workflow.

```
┌─────────────────────────────────────────────────────────────┐
│                      320px POPOVER ROOT                     │
├─────────────────────────────────────────────────────────────┤
│ Zone 1: MODE SWITCHER                                       │
│ [ Solid ]   [ Gradient ]   [ Harmonies ]   [ Scales ]       │
├─────────────────────────────────────────────────────────────┤
│ Zone 2: 2D SELECTION CANVAS (160px height)                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │              OKLCH Chroma / Lightness Matrix            │ │
│ │                                               (○ 16px)  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Zone 3: SLIDERS & UTILITY TOOLBAR                           │
│ [ 💉 ]   [●══════════════════════════════════════════════]  │ Hue Slider
│ [ 👁️ ]   [░░░════════════════════════════════════════════]  │ Alpha Slider
├─────────────────────────────────────────────────────────────┤
│ Zone 4: MULTI-FORMAT INPUTS                                 │
│ [ OKLCH ▾ ]  [ 62.3% ]  [ 0.214 ]  [ 259.8 ]  [ 100% ]      │
│ [ ⚠ Out of sRGB Gamut — Click to Clamp ]                    │ (Conditional)
├─────────────────────────────────────────────────────────────┤
│ Zone 5: A11Y & SWATCH FOOTER                                │
│ Contrast vs #FFFFFF: 4.56:1  [ AA ✓ ]  [ AAA ✕ ]  [ ⚡ Fix ] │
│ Saved:  ■  ■  ■  ■  ■  ■  ■  [ + ]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Design Tokens (`--mdx-cp-*`)

All components consume semantic CSS custom properties. Consumers can re-theme the picker globally or scoped to a container without using CSS `!important`.

### 2.1 Surface & Border Tokens

| Token Name | Light Mode Value | Dark Mode Value | Description |
| :--- | :--- | :--- | :--- |
| `--mdx-cp-width` | `320px` | `320px` | Total width of popover container |
| `--mdx-cp-bg-surface` | `#ffffff` | `#18181b` | Main popover card background |
| `--mdx-cp-bg-subtle` | `#f4f4f5` | `#27272a` | Tab backgrounds, inputs, inactive tracks |
| `--mdx-cp-bg-hover` | `#e4e4e7` | `#3f3f46` | Hover state for buttons and tabs |
| `--mdx-cp-border-color` | `#e4e4e7` | `#27272a` | Card border and zone dividers |
| `--mdx-cp-border-subtle` | `#f4f4f5` | `#1f1f23` | Inner element borders |
| `--mdx-cp-shadow` | `0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06)` | `0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4)` | Popover elevation shadow |

### 2.2 Typography & Text Tokens

| Token Name | Light Mode Value | Dark Mode Value | Description |
| :--- | :--- | :--- | :--- |
| `--mdx-cp-font-family` | `system-ui, -apple-system, sans-serif` | `system-ui, -apple-system, sans-serif` | Default font stack |
| `--mdx-cp-font-mono` | `ui-monospace, SFMono-Regular, monospace` | `ui-monospace, SFMono-Regular, monospace` | Numeric inputs & HEX values |
| `--mdx-cp-text-primary` | `#18181b` | `#fafafa` | Primary text and headings |
| `--mdx-cp-text-secondary` | `#71717a` | `#a1a1aa` | Labels, badges, format hints |
| `--mdx-cp-text-muted` | `#a1a1aa` | `#71717a` | Disabled states, placeholders |

### 2.3 Geometry & Radius Tokens

| Token Name | Value | Description |
| :--- | :--- | :--- |
| `--mdx-cp-radius-card` | `12px` | Outer border radius of popover card |
| `--mdx-cp-radius-control` | `6px` | Inputs, tabs, swatches, and small buttons |
| `--mdx-cp-radius-track` | `8px` | Hue and Alpha slider track pills |
| `--mdx-cp-radius-thumb` | `50%` | Circular thumb handles on canvas and sliders |
| `--mdx-cp-thumb-size` | `16px` | Handle diameter for touch & pointer targets |
| `--mdx-cp-track-height` | `12px` | Height of slider tracks |
| `--mdx-cp-spacing-xs` | `4px` | Micro gaps between controls |
| `--mdx-cp-spacing-sm` | `8px` | Standard padding between zones |
| `--mdx-cp-spacing-md` | `12px` | Outer card padding |

### 2.4 Focus & Interactive State Tokens

| Token Name | Value | Description |
| :--- | :--- | :--- |
| `--mdx-cp-focus-ring` | `0 0 0 2px #3b82f6` | Keyboard focus ring indicator |
| `--mdx-cp-accent` | `#3b82f6` | Active tab highlight, primary action |
| `--mdx-cp-success` | `#10b981` | WCAG Pass badges, verified states |
| `--mdx-cp-warning` | `#f59e0b` | Out-of-gamut indicator, AA-only states |
| `--mdx-cp-error` | `#ef4444` | WCAG Fail badge |

---

## 3. Zone-by-Zone UX & Component Specifications

### 3.1 Closed Trigger Input
- **Dimensions:** Width `100%`, Height `36px` to `40px`.
- **Anatomy:**
  - `[ Live Swatch ]` (24x24px rounded square with checkerboard transparency underlay).
  - `[ Text Input ]` (Editable smart-paste input displaying active color format).
  - `[ Alpha Badge ]` (e.g., `100%`).
  - `[ EyeDropper Action ]` (Quick screen sample button).
- **Interactions:**
  - Clicking swatch or input opens the 320px popover.
  - Pasting any valid CSS color string into input immediately syncs state without needing to open the popover.

### 3.2 Zone 1: Mode Switcher (Progressive Disclosure)
- **Tabs:** `Solid` (Default), `Gradient`, `Harmonies`, `Scales`.
- **Style:** Segmented control button group (`--mdx-cp-bg-subtle` background, `--mdx-cp-radius-control` pill).
- **Active State:** Solid white background in light mode, dark surface in dark mode, with subtle drop-shadow.

### 3.3 Zone 2: 2D Selection Canvas
- **Dimensions:** Width `296px` (320px minus 24px padding), Height `160px`.
- **Rendering:** High-DPI `<canvas>` rendering OKLCH Lightness ($Y$-axis, top = 1.0, bottom = 0.0) versus Chroma ($X$-axis, left = 0.0, right = max chroma).
- **16px Dynamic Thumb Indicator:**
  - Circle diameter: `16px`.
  - Dynamic Border Contrast: Uses relative luminance calculation of the underlying color pixel.
    - If luminance $> 0.5$, thumb border renders as **black (`#000000`)**.
    - If luminance $\le 0.5$, thumb border renders as **white (`#ffffff`)**.
  - Drop shadow: `0 2px 4px rgba(0, 0, 0, 0.3)`.

### 3.4 Zone 3: Sliders & Utility Toolbar
- **Hue Slider:** Linear gradient from $0^\circ$ to $360^\circ$ across all rainbow hues (`hsl(0, 100%, 50%)` to `hsl(360, 100%, 50%)`).
- **Alpha Slider:** Checkered transparent background overlaid with a CSS gradient from `transparent` to current solid color.
- **Utility Toolbar:**
  - `[ 💉 EyeDropper ]`: Triggers `window.EyeDropper` (or opens 9x9 loupe fallback).
  - `[ 👁️ Vision Filter ]`: Dropdown to simulate Protanopia, Deuteranopia, Tritanopia, or Achromatopsia via SVG `<filter>` matrix.
  - `[ 📋 Copy HEX ]`: One-click clipboard copy with checkmark confirmation tooltip.

### 3.5 Zone 4: Multi-Format Inputs
- **Dropdown:** Selects active format: `HEX`, `RGB`, `HSL`, `OKLCH`, `Display P3`.
- **Inputs:** Numeric segmented boxes with auto-tabbing and range validation (e.g. RGB: 0-255, OKLCH: 0-100%, 0-0.37, 0-360).
- **Out-of-Gamut Warning:**
  - Visible when picked color exceeds sRGB gamut bounds in Display P3 or wide-gamut OKLCH.
  - Displays `[ ⚠ Out of sRGB — Click to Clamp ]`. Clicking automatically runs the binary search chroma reduction.

### 3.6 Zone 5: A11y & Swatch Footer
- **Live Contrast Bar:**
  - Displays contrast ratio against configurable background (default `#ffffff` or `#000000`).
  - Pass/Fail pills: `[ AA Pass ]` (ratio $\ge 4.5:1$), `[ AAA Pass ]` (ratio $\ge 7.0:1$).
  - `[ ⚡ Auto-Fix Contrast ]` Button: Single click nudges the Lightness parameter dynamically along the OKLCH curve until WCAG AA is met.
- **Palette Swatches:**
  - 8 swatch circles (20x20px).
  - Includes `[ + ]` button to save current color to `localStorage`.
  - Right-click / long-press to remove swatch.

---

## 4. Accessibility & ARIA Guidelines

1. **Keyboard Matrix:**
   - `Tab` / `Shift+Tab`: Cycle through active zone controls.
   - `ArrowLeft` / `ArrowRight`: Step slider or canvas by $1\%$.
   - `ArrowUp` / `ArrowDown`: Step canvas lightness by $1\%$.
   - `Shift + ArrowKeys`: Step by $10\%$ (large jump).
   - `Home` / `End`: Jump to bounds minimum ($0\%$) or maximum ($100\%$).
   - `Escape`: Close popover and return focus to the trigger input.
2. **ARIA Attributes:**
   - Sliders use `role="slider"`, `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext`.
   - Canvas thumb uses `role="slider"` with `aria-roledescription="2D color area"`.
   - Popover uses `role="dialog"`, `aria-modal="false"`, `aria-label="Color Picker"`.
