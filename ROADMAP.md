# Madelixa Color Picker (`madelixa-color`) — Engineering Roadmap

**Organization:** MADELIXA  
**Author:** Mayur Dahake  
**Project Scope:** `@madelixa/color-core`, `@madelixa/color-dom`, `@madelixa/color-wc`, `@madelixa/color-angular`, `@madelixa/color-react`  
**Target Release:** v1.0.0 (Q1 2027)

---

## 1. High-Level Release Timeline

| Milestone | Target Scope | Timeline | Deliverables | Status |
| :--- | :--- | :--- | :--- | :--- |
| **M0: Spec & Architecture** | Design Document, HLD/LLD, Monorepo Blueprint | Week 1 | Engineering Design Doc, Roadmap, Tokens Spec, Interactive Demo | **Completed** |
| **M1: Monorepo & Tooling** | Turborepo, pnpm workspaces, tsup, Changesets | Week 2 | Monorepo scaffolding, strict TS base, CI lint & typecheck pipelines | **Ready to Execute** |
| **M2: Headless Core Engine** | `@madelixa/color-core` | Weeks 3–4 | OKLCH math, binary-search gamut clamping, WCAG/APCA A11y, Auto-Fix, Smart Paste, Harmonies | Planned |
| **M3: DOM & Interaction** | `@madelixa/color-dom` | Weeks 5–6 | PointerGestureController (60fps rAF), ARIA keyboard matrix, Floating UI, Loupe Eyedropper | Planned |
| **M4: Framework Adapters** | `@madelixa/color-react`, `@madelixa/color-angular`, `@madelixa/color-wc` | Weeks 7–9 | React `useColorPicker`, Angular Standalone Signals + CVA, Lit `<madelixa-color-picker>` | Planned |
| **M5: Showcase & Testbeds** | `apps/showcase-react`, `apps/showcase-angular` | Week 10 | Interactive playground apps, visual regression tests (Playwright) | Planned |
| **M6: Docs, JSR & NPM Launch** | Storybook / Astro Starlight, CI/CD, Registries | Weeks 11–12 | Public npm, JSR, GitHub Packages, unpkg CDN IIFE, automated release bot | Planned |

---

## 2. Detailed Milestone Breakdown

### Milestone 1: Monorepo & Build Infrastructure (Week 2)
- **Goal:** Set up an enterprise-grade Turborepo monorepo with zero-config builds and strict TypeScript configurations.
- **Tasks:**
  - [ ] Initialize `package.json` workspaces for `packages/*` and `apps/*`.
  - [ ] Configure `turbo.json` with pipeline caching for `build`, `test`, `lint`, and `typecheck`.
  - [ ] Configure `tsconfig.base.json` with `ES2022`, `moduleResolution: "Bundler"`, strict null checks, and declaration maps.
  - [ ] Set up `tsup.config.ts` per package generating:
    - ESM (`.mjs`) with `"sideEffects": false`
    - CJS (`.cjs`) for legacy tooling
    - Universal IIFE (`.global.js`) for CDN usage
    - TypeScript declaration `.d.ts` and `.d.ts.map`
  - [ ] Initialize Changesets (`.changeset/config.json`) for automated semantic releases.
  - [ ] Configure GitHub Actions workflow (`.github/workflows/ci.yml`).
- **Definition of Done (DoD):** `pnpm turbo run build` and `pnpm turbo run typecheck` run clean with zero errors across all empty packages.

---

### Milestone 2: Headless Core Engine — `@madelixa/color-core` (Weeks 3–4)
- **Goal:** High-performance, zero-dependency mathematical and state engine (< 4.5 kB gzipped).
- **Tasks:**
  - [ ] **Type System (`src/types.ts`)**: Define `OklchColor`, `RgbaColor`, `HslaColor`, `DisplayP3Color`, `GradientState`, `ContrastReport`, and `ColorPickerAction`.
  - [ ] **Conversion Matrices (`src/conversions/`)**:
    - sRGB $\leftrightarrow$ Linear sRGB $\leftrightarrow$ XYZ ($D_{65}$) $\leftrightarrow$ OKLab $\leftrightarrow$ OKLCH.
    - sRGB $\leftrightarrow$ Display P3 wide-gamut transformation.
    - CMYK approximations for print exports.
  - [ ] **Binary-Search sRGB Gamut Clamping (`src/gamut/clamp.ts`)**:
    - 16-iteration binary search reducing Chroma $C$ until within sRGB $[0, 255]$ with $\epsilon = 0.0001$.
  - [ ] **Real-Time A11y & Contrast Engine (`src/a11y/`)**:
    - WCAG 2.1 relative luminance ($Y = 0.2126 R_{lin} + 0.7152 G_{lin} + 0.0722 B_{lin}$).
    - Contrast ratio ($1:1$ to $21:1$) and APCA $L_c$ calculation.
    - 1-Click `autoFixContrast`: binary search on Lightness $L \in [0, 1]$ preserving hue/chroma to hit $\ge 4.5:1$.
  - [ ] **Color Blindness Simulation (`src/blindness/`)**:
    - Simulation matrices for Protanopia, Deuteranopia, Tritanopia, and Achromatopsia.
  - [ ] **Smart Paste Tokenizer (`src/parser/smart-paste.ts`)**:
    - AST-lite regex tokenizer parsing `#HEX`, `rgba?()`, `oklch()`, `color(display-p3 ...)`, and W3C color keywords.
  - [ ] **Harmonies & Scales (`src/harmony/`, `src/scale/`)**:
    - Complementary ($+180^\circ$), Triadic ($\pm 120^\circ$), Analogous ($\pm 30^\circ$), Split-Complementary, Monochromatic.
    - Tailwind 11-step (50–950) tint/shade scale generator with CSS variable and Tailwind JSON formatters.
  - [ ] **Gradient Studio Engine (`src/gradient/`)**:
    - Multi-stop color stop manager, linear angle (0–360°), radial, conic, and CSS gradient string generation.
  - [ ] **Color Store (`src/store/color-store.ts`)**:
    - Finite State Machine with immutable state dispatch and subscriber notifications.
- **Definition of Done (DoD):** Vitest test suite achieves 100% mathematical precision ($\Delta E < 10^{-5}$) against W3C test vectors; core bundle size $< 4.5\text{ kB}$ gzipped.

---

### Milestone 3: DOM & Interaction Layer — `@madelixa/color-dom` (Weeks 5–6)
- **Goal:** Robust, 60fps gesture handling, ARIA keyboard navigation, and popover positioning.
- **Tasks:**
  - [ ] **Pointer Gesture Controller (`src/gesture/pointer-gesture.ts`)**:
    - `setPointerCapture` on `pointerdown` for robust window-wide dragging.
    - RAF throttling loop for 60fps pointer updates.
    - Coordinate normalization $(x, y) \in [0, 1] \times [0, 1]$.
  - [ ] **Keyboard Navigation Engine (`src/keyboard/keyboard-nav.ts`)**:
    - ARIA `role="slider"` mapping: Arrow keys $\pm 1\%$, Shift+Arrow $\pm 10\%$, Home/End bounds clamping, Escape to close.
  - [ ] **Floating UI Popover (`src/floating/floating.ts`)**:
    - Auto-placement, flipping, shifting, and boundary collision prevention using `@floating-ui/dom`.
  - [ ] **Eyedropper Engine (`src/eyedropper/eyedropper.ts`)**:
    - Native `window.EyeDropper` call on Chromium.
    - 9x9 pixel offscreen canvas loupe magnifier fallback for Safari/Firefox.
  - [ ] **Theming & Tokens (`src/styles/tokens.css`)**:
    - Definition of `--mdx-cp-*` custom properties with light/dark theme presets.
- **Definition of Done (DoD):** Zero jank during fast dragging; 60fps profile in Chrome DevTools; ARIA audits pass with 0 axe-core violations.

---

### Milestone 4: Framework Adapters (Weeks 7–9)
- **Goal:** Thin, native wrappers for React, Angular, and Web Components with $< 2.0\text{ kB}$ gzipped footprint.
- **Tasks:**
  - [ ] **React Adapter (`@madelixa/color-react`)**:
    - `useColorPicker` custom hook powered by `useSyncExternalStore` for React 18+ concurrent rendering safety.
    - Compound components: `<ColorPicker.Root>`, `<ColorPicker.Trigger>`, `<ColorPicker.Popover>`, `<ColorPicker.Canvas>`, `<ColorPicker.Sliders>`, `<ColorPicker.FormatInputs>`, `<ColorPicker.A11yBar>`, `<ColorPicker.Swatches>`.
  - [ ] **Angular Adapter (`@madelixa/color-angular`)**:
    - Standalone component (`MadelixaColorPickerComponent`) with `ChangeDetectionStrategy.OnPush`.
    - Angular Signals: `value = model<string>()`, `format = input<ColorSpace>()`, `minContrastRatio = input<number>()`.
    - `ControlValueAccessor` (`[(ngModel)]`, Reactive Forms) and `Validator` implementation.
    - Performance optimization: pointer events executed in `ngZone.runOutsideAngular()`.
  - [ ] **Web Component Adapter (`@madelixa/color-wc`)**:
    - Lit-based `<madelixa-color-picker>` with Shadow DOM encapsulation.
    - `static formAssociated = true` with `ElementInternals` for native HTML `<form>` submission.
- **Definition of Done (DoD):** Two-way binding verified in React and Angular; form submission verified in native HTML forms.

---

### Milestone 5: Showcase Applications & Visual Testing (Week 10)
- **Goal:** Real-world sandbox environments for live testing and automated regression checks.
- **Tasks:**
  - [ ] `apps/showcase-react`: Interactive Vite sandbox demonstrating dark/light modes, forms, and custom themes.
  - [ ] `apps/showcase-angular`: Angular standalone app with template-driven and reactive forms (`FormControl`, `FormGroup`).
  - [ ] End-to-end tests with Playwright across Chromium, Firefox, and WebKit.
- **Definition of Done (DoD):** Automated Playwright test suite passes cleanly on all 3 browser engines in CI.

---

### Milestone 6: Documentation, JSR & NPM Public Launch (Weeks 11–12)
- **Goal:** Public release across all registries with interactive documentation.
- **Tasks:**
  - [ ] Interactive documentation site (Astro Starlight or Storybook) with embedded interactive sandboxes.
  - [ ] Automated Changesets GitHub Actions workflow with NPM provenance flag (`--provenance`).
  - [ ] JSR publication configuration for `@madelixa/color`.
  - [ ] CDN IIFE builds distributed to unpkg and jsDelivr.
  - [ ] Comprehensive README, CONTRIBUTING guide, and API documentation.
- **Definition of Done (DoD):** Packages live on npmjs.com and jsr.io; CDN links functional; release announcement published.
