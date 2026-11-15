import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  forwardRef,
  inject,
  NgZone,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  computed,
  signal,
  effect
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import {
  ColorStore,
  createColorStore,
  ColorSpace,
  oklchToRgb,
  rgbToHex,
  getRelativeLuminance
} from '@madelixa/color-core';
import { PointerGestureController, setupPopoverPositioning } from '@madelixa/color-dom';
import { ColorPickerControl } from './color-picker.control';

export type ColorPickerVariant = 'chrome' | 'sketch' | 'compact' | 'github' | 'swatches';

const DEFAULT_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#18181b'
];

const SWATCH_COLUMNS = [
  ['#fee2e2', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#991b1b'], // Reds
  ['#ffedd5', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#9a3412'], // Oranges
  ['#fef3c7', '#fde047', '#facc15', '#eab308', '#ca8a04', '#854d0e'], // Yellows
  ['#dcfce7', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#166534'], // Greens
  ['#e0f2fe', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#075985'], // Sky
  ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e40af'], // Blue
  ['#f3e8ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#6b21a8'], // Purple
  ['#f4f4f5', '#e4e4e7', '#a1a1aa', '#71717a', '#3f3f46', '#18181b']  // Neutrals
];

@Component({
  selector: 'madelixa-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MadelixaColorPickerComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MadelixaColorPickerComponent),
      multi: true
    }
  ],
  template: `
    <div
      class="mdx-color-picker"
      [class.mdx-color-picker--inline]="inline()"
      #containerRef
    >
      <!-- Popover Trigger Button (Only in dropdown mode) -->
      @if (!inline()) {
        <button
          type="button"
          #triggerRef
          class="mdx-cp-trigger"
          (click)="togglePopover()"
          [attr.aria-expanded]="isOpen()"
          aria-haspopup="dialog"
        >
          <span class="mdx-cp-trigger-swatch mdx-cp-track-checkered">
            <span
              [style.background-color]="hexColor()"
              [style.opacity]="showAlpha() ? store.getState().currentOklch.alpha : 1"
              style="display: block; width: 100%; height: 100%;"
            ></span>
          </span>
          <span class="mdx-cp-trigger-text">{{ displayColor() }}</span>
          <span class="mdx-cp-btn" style="width: 22px; height: 22px; padding: 0;">🎨</span>
        </button>
      }

      <!-- Main Picker Popover / Card -->
      @if (inline() || isOpen()) {
        <div
          #popoverRef
          class="mdx-cp-popover"
          [class.mdx-cp-popover--inline]="inline()"
          [class.mdx-cp-popover--chrome]="variant() === 'chrome'"
          [class.mdx-cp-popover--sketch]="variant() === 'sketch'"
          [class.mdx-cp-popover--compact]="variant() === 'compact'"
          [class.mdx-cp-popover--github]="variant() === 'github'"
          [class.mdx-cp-popover--swatches]="variant() === 'swatches'"
          role="dialog"
          aria-label="Madelixa Color Picker"
          tabindex="-1"
          (keydown.escape)="closePopover()"
        >
          <!-- GITHUB VARIANT -->
          @if (variant() === 'github') {
            @if (!inline()) {
              <div class="mdx-cp-github-arrow"></div>
            }
            <div class="mdx-cp-github-grid">
              @for (colorItem of activePresets(); track colorItem) {
                <button
                  type="button"
                  class="mdx-cp-github-swatch"
                  [style.background-color]="colorItem"
                  [title]="colorItem"
                  (click)="setColor(colorItem)"
                ></button>
              }
            </div>
          }

          <!-- COMPACT VARIANT -->
          @else if (variant() === 'compact') {
            <div class="mdx-cp-compact-grid">
              @for (colorItem of activePresets(); track colorItem) {
                <button
                  type="button"
                  class="mdx-cp-compact-swatch"
                  [style.background-color]="colorItem"
                  [title]="colorItem"
                  (click)="setColor(colorItem)"
                ></button>
              }
            </div>
            <!-- Mini Hue Bar -->
            <div class="mdx-cp-track mdx-cp-track-hue" style="height: 10px; margin-top: 8px;">
              <input
                type="range"
                min="0"
                max="360"
                step="0.5"
                [value]="store.getState().currentOklch.h"
                (input)="onHueInput($event)"
                class="mdx-cp-range-input"
                aria-label="Hue Slider"
              />
            </div>
            <!-- Hex Preview -->
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px;">
              <span class="mdx-cp-swatch-btn" [style.background-color]="hexColor()"></span>
              <input
                type="text"
                class="mdx-cp-field"
                [value]="hexColor()"
                (change)="onTextInput($event)"
              />
            </div>
          }

          <!-- SWATCHES VARIANT -->
          @else if (variant() === 'swatches') {
            <div class="mdx-cp-swatches-columns">
              @for (column of swatchColumns; track column[0]) {
                <div class="mdx-cp-swatches-col">
                  @for (shade of column; track shade) {
                    <button
                      type="button"
                      class="mdx-cp-swatch-item"
                      [style.background-color]="shade"
                      [title]="shade"
                      (click)="setColor(shade)"
                    ></button>
                  }
                </div>
              }
            </div>
          }

          <!-- SKETCH VARIANT -->
          @else if (variant() === 'sketch') {
            <!-- 2D Canvas Area -->
            <div #canvasAreaRef class="mdx-cp-canvas-area" tabindex="0">
              <canvas #canvasRef></canvas>
              <div
                class="mdx-cp-thumb"
                [style.left.%]="thumbX()"
                [style.top.%]="thumbY()"
                [style.background-color]="hexColor()"
                [style.border-color]="thumbBorderColor()"
                style="border-width: 2px; border-style: solid;"
              ></div>
            </div>

            <!-- Sliders -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="mdx-cp-track mdx-cp-track-hue">
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="0.5"
                  [value]="store.getState().currentOklch.h"
                  (input)="onHueInput($event)"
                  class="mdx-cp-range-input"
                  aria-label="Hue Slider"
                />
              </div>

              @if (showAlpha()) {
                <div class="mdx-cp-track mdx-cp-track-checkered">
                  <div class="mdx-cp-alpha-overlay" [style.background]="alphaGradientCss()"></div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    [value]="alphaPercent()"
                    (input)="onAlphaInput($event)"
                    class="mdx-cp-range-input"
                    aria-label="Alpha Slider"
                  />
                </div>
              }
            </div>

            <!-- Numerical Channel Inputs (HEX, R, G, B, A) -->
            <div class="mdx-cp-sketch-fields">
              <div class="mdx-cp-sketch-col">
                <input
                  type="text"
                  class="mdx-cp-field"
                  [value]="hexColor()"
                  (change)="onTextInput($event)"
                />
                <label>HEX</label>
              </div>
              <div class="mdx-cp-sketch-col">
                <input
                  type="number"
                  class="mdx-cp-field"
                  [value]="store.getState().currentRgb.r"
                  (change)="onRgbInput('r', $event)"
                />
                <label>R</label>
              </div>
              <div class="mdx-cp-sketch-col">
                <input
                  type="number"
                  class="mdx-cp-field"
                  [value]="store.getState().currentRgb.g"
                  (change)="onRgbInput('g', $event)"
                />
                <label>G</label>
              </div>
              <div class="mdx-cp-sketch-col">
                <input
                  type="number"
                  class="mdx-cp-field"
                  [value]="store.getState().currentRgb.b"
                  (change)="onRgbInput('b', $event)"
                />
                <label>B</label>
              </div>
            </div>

            <!-- Swatches Matrix -->
            <div class="mdx-cp-swatch-list">
              @for (swatch of activePresets(); track swatch) {
                <button
                  type="button"
                  class="mdx-cp-swatch-btn"
                  [style.background-color]="swatch"
                  [title]="swatch"
                  (click)="setColor(swatch)"
                ></button>
              }
            </div>
          }

          <!-- CHROME VARIANT (Default Studio Layout) -->
          @else {
            <!-- Tab Mode Switcher -->
            <div class="mdx-cp-tabs">
              <button
                type="button"
                class="mdx-cp-tab"
                [class.is-active]="activeTab() === 'solid'"
                (click)="activeTab.set('solid')"
              >
                Solid
              </button>
              <button
                type="button"
                class="mdx-cp-tab"
                [class.is-active]="activeTab() === 'harmonies'"
                (click)="activeTab.set('harmonies')"
              >
                Harmonies
              </button>
              <button
                type="button"
                class="mdx-cp-tab"
                [class.is-active]="activeTab() === 'scales'"
                (click)="activeTab.set('scales')"
              >
                Scales
              </button>
            </div>

            @if (activeTab() === 'solid') {
              <!-- 2D Canvas Area -->
              <div #canvasAreaRef class="mdx-cp-canvas-area" tabindex="0">
                <canvas #canvasRef></canvas>
                <div
                  class="mdx-cp-thumb"
                  [style.left.%]="thumbX()"
                  [style.top.%]="thumbY()"
                  [style.background-color]="hexColor()"
                  [style.border-color]="thumbBorderColor()"
                  style="border-width: 2px; border-style: solid;"
                ></div>
              </div>

              <!-- Sliders & Preview Row -->
              <div style="display: flex; gap: 10px; align-items: center;">
                <div class="mdx-cp-color-circle">
                  <div
                    class="mdx-cp-track-checkered"
                    style="width: 100%; height: 100%; position: relative;"
                  >
                    <div
                      [style.background-color]="hexColor()"
                      [style.opacity]="showAlpha() ? store.getState().currentOklch.alpha : 1"
                      style="width: 100%; height: 100%;"
                    ></div>
                  </div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                  <!-- Hue Slider -->
                  <div class="mdx-cp-track mdx-cp-track-hue">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="0.5"
                      [value]="store.getState().currentOklch.h"
                      (input)="onHueInput($event)"
                      class="mdx-cp-range-input"
                      aria-label="Hue Slider"
                    />
                  </div>

                  <!-- Alpha Slider -->
                  @if (showAlpha()) {
                    <div class="mdx-cp-track mdx-cp-track-checkered">
                      <div
                        class="mdx-cp-alpha-overlay"
                        [style.background]="alphaGradientCss()"
                      ></div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        [value]="alphaPercent()"
                        (input)="onAlphaInput($event)"
                        class="mdx-cp-range-input"
                        aria-label="Alpha Slider"
                      />
                    </div>
                  }
                </div>
              </div>

              <!-- Multi-Format Inputs -->
              <div class="mdx-cp-inputs-row">
                <select
                  class="mdx-cp-select"
                  [value]="format()"
                  (change)="onFormatChange($event)"
                  aria-label="Color Space Format"
                >
                  <option value="hex">HEX</option>
                  <option value="rgb">RGB</option>
                  <option value="hsl">HSL</option>
                  <option value="oklch">OKLCH</option>
                  <option value="p3">P3</option>
                </select>
                <div class="mdx-cp-input-group">
                  <input
                    type="text"
                    class="mdx-cp-field"
                    [value]="displayColor()"
                    (change)="onTextInput($event)"
                    aria-label="Color Value"
                  />
                </div>
              </div>

              <!-- Accessibility & Swatches Footer -->
              <div class="mdx-cp-footer">
                <div class="mdx-cp-a11y-bar">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: var(--mdx-cp-text-secondary);">vs #FFF:</span>
                    <span style="font-family: var(--mdx-cp-font-mono); font-weight: 700;">
                      {{ contrastRatio() }}:1
                    </span>
                    <span
                      class="mdx-cp-pill"
                      [class.mdx-cp-pill-pass]="isAccessible()"
                      [class.mdx-cp-pill-fail]="!isAccessible()"
                    >
                      {{ isAccessible() ? 'AA ✓' : 'AA ✕' }}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="mdx-cp-btn mdx-cp-btn-primary"
                    (click)="onAutoFix()"
                  >
                    ⚡ Auto-Fix
                  </button>
                </div>

                <!-- Swatches -->
                <div class="mdx-cp-swatches">
                  <span style="font-size: var(--mdx-cp-font-size-xs); color: var(--mdx-cp-text-muted);">
                    Presets:
                  </span>
                  <div class="mdx-cp-swatch-list">
                    @for (swatch of activePresets(); track swatch) {
                      <button
                        type="button"
                        class="mdx-cp-swatch-btn"
                        [style.background-color]="swatch"
                        [title]="'Select ' + swatch"
                        (click)="setColor(swatch)"
                      ></button>
                    }
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'harmonies') {
              <div style="display: flex; flex-direction: column; gap: 10px;">
                @for (entry of harmoniesList(); track entry.name) {
                  <div>
                    <div style="font-size: 11px; font-weight: 600; margin-bottom: 4px; color: var(--mdx-cp-text-secondary);">
                      {{ entry.name }}
                    </div>
                    <div style="display: flex; gap: 6px;">
                      @for (color of entry.colors; track color) {
                        <button
                          type="button"
                          class="mdx-cp-swatch-btn"
                          [style.background-color]="color"
                          [title]="color"
                          (click)="setColor(color)"
                        ></button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @if (activeTab() === 'scales') {
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="font-size: 11px; font-weight: 600; color: var(--mdx-cp-text-secondary);">
                  Tailwind Tint & Shade Scale
                </div>
                <div style="display: flex; border-radius: 6px; overflow: hidden; height: 28px;">
                  @for (step of tailwindSteps(); track step.step) {
                    <button
                      type="button"
                      style="flex: 1; border: none; cursor: pointer;"
                      [style.background-color]="step.hex"
                      [title]="step.step + ': ' + step.hex"
                      (click)="setColor(step.hex)"
                    ></button>
                  }
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `
})
export class MadelixaColorPickerComponent
  implements ControlValueAccessor, Validator, AfterViewInit, OnDestroy {
  private ngZone = inject(NgZone);

  // Angular Signal Inputs & Models
  readonly format = input<ColorSpace>('hex');
  readonly value = model<string>('#3b82f6');
  readonly color = model<string | null>(null); // Alias for drop-in ngx-color-picker compatibility
  readonly variant = input<ColorPickerVariant>('chrome');
  readonly inline = input<boolean>(false);
  readonly showAlpha = input<boolean>(true);
  readonly presets = input<string[]>(DEFAULT_PRESETS);
  readonly control = input<ColorPickerControl | null>(null);
  readonly minContrastRatio = input<number | null>(null);

  // State Signals
  readonly isOpen = signal(false);
  readonly activeTab = signal<'solid' | 'harmonies' | 'scales'>('solid');

  // Internal ColorStore
  readonly store: ColorStore;
  private pointerGesture?: PointerGestureController;
  private cleanupPopover?: () => void;
  private onChange: (val: string) => void = () => { };
  private onTouched: () => void = () => { };

  readonly swatchColumns = SWATCH_COLUMNS;

  @ViewChild('containerRef') containerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('triggerRef') triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('popoverRef') popoverRef?: ElementRef<HTMLDivElement>;
  @ViewChild('canvasAreaRef') canvasAreaRef?: ElementRef<HTMLDivElement>;
  @ViewChild('canvasRef') canvasRef?: ElementRef<HTMLCanvasElement>;

  // Computed signals
  readonly activePresets = computed(() => {
    const ctrl = this.control();
    return ctrl ? ctrl.presets() : this.presets();
  });

  readonly hexColor = computed(() => {
    const rgb = this.store.getState().currentRgb;
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });

  readonly displayColor = computed(() => {
    return this.store.getFormatted(this.format());
  });

  readonly alphaPercent = computed(() => {
    return Math.round((this.store.getState().currentOklch.alpha ?? 1) * 100);
  });

  readonly alphaGradientCss = computed(() => {
    const rgb = this.store.getState().currentRgb;
    return `linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgb(${rgb.r}, ${rgb.g}, ${rgb.b}))`;
  });

  readonly thumbX = computed(() => {
    const c = this.store.getState().currentOklch.c;
    return Math.min(Math.max((c / 0.32) * 100, 0), 100);
  });

  readonly thumbY = computed(() => {
    const l = this.store.getState().currentOklch.l;
    return Math.min(Math.max((1.0 - l) * 100, 0), 100);
  });

  readonly thumbBorderColor = computed(() => {
    const rgb = this.store.getState().currentRgb;
    const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
    return lum > 0.5 ? '#18181b' : '#ffffff';
  });

  readonly contrastRatio = computed(() => {
    return this.store.getState().contrast.wcagRatio;
  });

  readonly isAccessible = computed(() => {
    return this.store.getState().contrast.passesAA;
  });

  readonly tailwindSteps = computed(() => {
    const scale = this.store.getTailwindScale();
    return Object.entries(scale).map(([step, color]) => ({
      step,
      hex: rgbToHex(color.r, color.g, color.b)
    }));
  });

  readonly harmoniesList = computed(() => {
    const h = this.store.getHarmonies();
    const mapRgb = (rgbs: any[]) => rgbs.map(r => rgbToHex(r.r, r.g, r.b));
    return [
      { name: 'Complementary', colors: mapRgb(h.complementary) },
      { name: 'Triadic', colors: mapRgb(h.triadic) },
      { name: 'Analogous', colors: mapRgb(h.analogous) },
      { name: 'Tetradic', colors: mapRgb(h.tetradic) }
    ];
  });

  constructor() {
    this.store = createColorStore(this.value());

    this.store.subscribe((state) => {
      const formatted = this.store.getFormatted(this.format());
      this.value.set(formatted);
      this.color.set(formatted);
      this.onChange(formatted);
    });

    effect(() => {
      const v = this.value();
      if (v) this.store.dispatch({ type: 'SET_COLOR_STRING', payload: v });
    });

    effect(() => {
      const c = this.color();
      if (c) this.store.dispatch({ type: 'SET_COLOR_STRING', payload: c });
    });

    effect(() => {
      const ctrl = this.control();
      if (ctrl) {
        const ctrlVal = ctrl.value();
        if (ctrlVal) this.store.dispatch({ type: 'SET_COLOR_STRING', payload: ctrlVal });
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.inline() || this.isOpen()) {
      this.initCanvasAndGesture();
    }
  }

  ngOnDestroy(): void {
    this.pointerGesture?.destroy();
    this.cleanupPopover?.();
  }

  togglePopover(): void {
    if (this.isOpen()) {
      this.closePopover();
    } else {
      this.isOpen.set(true);
      setTimeout(() => this.initCanvasAndGesture(), 0);
    }
  }

  closePopover(): void {
    this.isOpen.set(false);
    this.cleanupPopover?.();
    this.cleanupPopover = undefined;
    this.onTouched();
  }

  private initCanvasAndGesture(): void {
    this.renderRetinaCanvas();
    if (this.canvasAreaRef && !this.pointerGesture) {
      this.ngZone.runOutsideAngular(() => {
        this.pointerGesture = new PointerGestureController(
          this.canvasAreaRef!.nativeElement,
          (coords) => {
            const c = coords.x * 0.32;
            const l = 1.0 - coords.y;
            this.store.dispatch({ type: 'SET_OKLCH', payload: { c, l } });
            this.renderRetinaCanvas();
          }
        );
      });
    }

    if (!this.inline() && this.triggerRef && this.popoverRef && !this.cleanupPopover) {
      this.cleanupPopover = setupPopoverPositioning(
        this.triggerRef.nativeElement,
        this.popoverRef.nativeElement
      );
    }
  }

  renderRetinaCanvas(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 294;
    const h = 160;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const hue = this.store.getState().currentOklch.h;

    let idx = 0;
    for (let y = 0; y < h; y++) {
      const l = 1.0 - y / h;
      for (let x = 0; x < w; x++) {
        const c = (x / w) * 0.32;
        const rgb = oklchToRgb({ l, c, h: hue, alpha: 1 });
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
        idx += 4;
      }
    }

    const offscreen = new OffscreenCanvas(w, h);
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.putImageData(imgData, 0, 0);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.drawImage(offscreen, 0, 0, w, h);
      ctx.restore();
    }
  }

  onHueInput(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.store.dispatch({ type: 'SET_OKLCH', payload: { h: val } });
    this.renderRetinaCanvas();
  }

  onAlphaInput(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value) / 100;
    this.store.dispatch({ type: 'SET_ALPHA', payload: val });
  }

  onFormatChange(e: Event): void {
    const nextFormat = (e.target as HTMLSelectElement).value as ColorSpace;
    const formatted = this.store.getFormatted(nextFormat);
    this.value.set(formatted);
  }

  onTextInput(e: Event): void {
    const str = (e.target as HTMLInputElement).value;
    this.store.dispatch({ type: 'SET_COLOR_STRING', payload: str });
    this.renderRetinaCanvas();
  }

  onRgbInput(channel: 'r' | 'g' | 'b', e: Event): void {
    const current = { ...this.store.getState().currentRgb };
    const val = parseInt((e.target as HTMLInputElement).value, 10) || 0;
    current[channel] = Math.min(Math.max(val, 0), 255);
    this.setColor(rgbToHex(current.r, current.g, current.b));
  }

  onAutoFix(): void {
    this.store.dispatch({ type: 'AUTO_FIX_CONTRAST', payload: { targetRatio: 4.5 } });
    this.renderRetinaCanvas();
  }

  setColor(color: string): void {
    this.store.dispatch({ type: 'SET_COLOR_STRING', payload: color });
    this.renderRetinaCanvas();
  }

  // ControlValueAccessor
  writeValue(val: string): void {
    if (val) this.store.dispatch({ type: 'SET_COLOR_STRING', payload: val });
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Validator
  validate(control: AbstractControl): ValidationErrors | null {
    const minRatio = this.minContrastRatio();
    if (minRatio !== null) {
      const actualRatio = this.contrastRatio();
      if (actualRatio < minRatio) {
        return {
          contrastViolation: {
            requiredRatio: minRatio,
            actualRatio,
            message: `Color contrast ratio ${actualRatio}:1 is below required ${minRatio}:1`
          }
        };
      }
    }
    return null;
  }
}

// ==============================================================================
// Predefined Alias Components (Drop-in compatibility with ngx-color-picker)
// ==============================================================================

@Component({
  selector: 'chrome-picker, mdx-chrome-picker',
  standalone: true,
  imports: [MadelixaColorPickerComponent],
  template: `
    <madelixa-color-picker
      variant="chrome"
      [inline]="inline()"
      [showAlpha]="showAlpha()"
      [presets]="presets()"
      [control]="control()"
      [(value)]="value"
      [(color)]="color"
    />
  `
})
export class ChromePickerComponent {
  readonly inline = input<boolean>(true);
  readonly showAlpha = input<boolean>(true);
  readonly presets = input<string[]>(DEFAULT_PRESETS);
  readonly control = input<ColorPickerControl | null>(null);
  readonly value = model<string>('#3b82f6');
  readonly color = model<string | null>(null);
}

@Component({
  selector: 'sketch-picker, mdx-sketch-picker',
  standalone: true,
  imports: [MadelixaColorPickerComponent],
  template: `
    <madelixa-color-picker
      variant="sketch"
      [inline]="inline()"
      [showAlpha]="showAlpha()"
      [presets]="presets()"
      [control]="control()"
      [(value)]="value"
      [(color)]="color"
    />
  `
})
export class SketchPickerComponent {
  readonly inline = input<boolean>(true);
  readonly showAlpha = input<boolean>(true);
  readonly presets = input<string[]>(DEFAULT_PRESETS);
  readonly control = input<ColorPickerControl | null>(null);
  readonly value = model<string>('#3b82f6');
  readonly color = model<string | null>(null);
}

@Component({
  selector: 'compact-picker, mdx-compact-picker',
  standalone: true,
  imports: [MadelixaColorPickerComponent],
  template: `
    <madelixa-color-picker
      variant="compact"
      [inline]="inline()"
      [presets]="presets()"
      [control]="control()"
      [(value)]="value"
      [(color)]="color"
    />
  `
})
export class CompactPickerComponent {
  readonly inline = input<boolean>(true);
  readonly presets = input<string[]>(DEFAULT_PRESETS);
  readonly control = input<ColorPickerControl | null>(null);
  readonly value = model<string>('#3b82f6');
  readonly color = model<string | null>(null);
}

@Component({
  selector: 'github-picker, mdx-github-picker',
  standalone: true,
  imports: [MadelixaColorPickerComponent],
  template: `
    <madelixa-color-picker
      variant="github"
      [inline]="inline()"
      [presets]="presets()"
      [control]="control()"
      [(value)]="value"
      [(color)]="color"
    />
  `
})
export class GithubPickerComponent {
  readonly inline = input<boolean>(true);
  readonly presets = input<string[]>(DEFAULT_PRESETS);
  readonly control = input<ColorPickerControl | null>(null);
  readonly value = model<string>('#3b82f6');
  readonly color = model<string | null>(null);
}

@Component({
  selector: 'swatches-picker, mdx-swatches-picker',
  standalone: true,
  imports: [MadelixaColorPickerComponent],
  template: `
    <madelixa-color-picker
      variant="swatches"
      [inline]="inline()"
      [control]="control()"
      [(value)]="value"
      [(color)]="color"
    />
  `
})
export class SwatchesPickerComponent {
  readonly inline = input<boolean>(true);
  readonly control = input<ColorPickerControl | null>(null);
  readonly value = model<string>('#3b82f6');
  readonly color = model<string | null>(null);
}
