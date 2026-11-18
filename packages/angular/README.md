# @madelixa/color-angular

> Standalone Angular component with Signals, ControlValueAccessor (`[(ngModel)]`), 5 variant styles, and 60fps drag optimization.

Part of the **Madelixa Color Picker** monorepo suite by [MADELIXA](https://github.com/mayur-dahake/madelixa-color) (Author: Mayur Dahake).

## Features

- **Angular 17+ / 18+ / 19+ Ready**: Native standalone component using Angular Signals (`signal()`, `computed()`, `model()`).
- **5 Variant Designs**: `chrome`, `sketch`, `compact`, `github`, and `swatches` (inspired by `@iplab/ngx-color-picker`).
- **Inline or Dropdown Popover**: Seamlessly toggle between anchored popover or embedded layout via `[inline]="true"`.
- **Form Integration**: Full `ControlValueAccessor` (`[(ngModel)]`, Reactive Forms) and `Validator` (`[minContrastRatio]="4.5"`).
- **Programmatic Controller**: `ColorPickerControl` for external state driving and RxJS stream observation.
- **60fps Drag Optimization**: Pointer gesture engine executes outside `NgZone` (`runOutsideAngular`) to eliminate change detection overhead during drags.

## Installation

```bash
npm install @madelixa/color-angular @madelixa/color-dom @madelixa/color-core
# or
pnpm add @madelixa/color-angular @madelixa/color-dom @madelixa/color-core
```

## Quick Start

### 1. Standalone Component Usage

```typescript
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MadelixaColorPickerComponent } from '@madelixa/color-angular';

@Component({
  standalone: true,
  imports: [FormsModule, MadelixaColorPickerComponent],
  template: `
    <!-- Dropdown Popover Mode -->
    <madelixa-color-picker
      [(value)]="selectedColor"
      variant="sketch"
      [showAlpha]="true"
      [minContrastRatio]="4.5"
    />

    <!-- Inline Mode -->
    <madelixa-color-picker
      [(value)]="selectedColor"
      [inline]="true"
      variant="chrome"
    />
  `
})
export class MyColorComponent {
  selectedColor = signal('#3b82f6');
}
```

### 2. Programmatic Controller (`ColorPickerControl`)

```typescript
import { Component } from '@angular/core';
import { ColorPickerControl, MadelixaColorPickerComponent } from '@madelixa/color-angular';

@Component({
  standalone: true,
  imports: [MadelixaColorPickerComponent],
  template: `
    <madelixa-color-picker [control]="ctrl" />
  `
})
export class ControlledExample {
  readonly ctrl = new ColorPickerControl('#10b981', {
    alpha: true,
    presets: ['#ef4444', '#10b981', '#3b82f6']
  });

  constructor() {
    this.ctrl.valueChanges.subscribe(val => {
      console.log('Color updated via RxJS:', val);
    });
  }
}
```

## Stylesheet

Include the core stylesheet in `angular.json` or `styles.css`:

```css
@import '@madelixa/color-dom/styles.css';
```

## License

MIT © [MADELIXA](https://github.com/mayur-dahake/madelixa-color)
