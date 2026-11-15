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
  signal
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
  OklchColor,
  oklchToRgb,
  rgbToHex,
  getRelativeLuminance,
  formatColor
} from '@madelixa/color-core';
import { PointerGestureController, setupPopoverPositioning } from '@madelixa/color-dom';

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
    <div class="mdx-color-picker" #containerRef>
      <!-- Trigger Input -->
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
            [style.opacity]="store.getState().currentOklch.alpha"
            style="display: block; width: 100%; height: 100%;"
          ></span>
        </span>
        <span class="mdx-cp-trigger-text">{{ displayColor() }}</span>
        <span class="mdx-cp-btn" style="width: 22px; height: 22px; padding: 0;">💉</span>
      </button>

      <!-- 320px Popover -->
      @if (isOpen()) {
        <div
          #popoverRef
          class="mdx-cp-popover"
          role="dialog"
          aria-label="Color Picker"
          tabindex="-1"
          (keydown.escape)="closePopover()"
        >
          <!-- 1. Mode Switcher -->
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

          <!-- Solid Mode: 2D Canvas & Sliders -->
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

            <!-- Sliders -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <!-- Hue Slider -->
              <div class="mdx-cp-slider-row">
                <span class="mdx-cp-slider-label">H</span>
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
              </div>

              <!-- Alpha Slider -->
              <div class="mdx-cp-slider-row">
                <span class="mdx-cp-slider-label">A</span>
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
                  Saved:
                </span>
                <div class="mdx-cp-swatch-list">
                  @for (swatch of swatches(); track swatch) {
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
  readonly minContrastRatio = input<number | null>(null);

  protected store: ColorStore = createColorStore('#3b82f6');
  protected isOpen = signal<boolean>(false);
  protected activeTab = signal<'solid' | 'harmonies' | 'scales'>('solid');

  @ViewChild('containerRef') containerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('triggerRef') triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('popoverRef') popoverRef?: ElementRef<HTMLDivElement>;
  @ViewChild('canvasAreaRef') canvasAreaRef?: ElementRef<HTMLDivElement>;
  @ViewChild('canvasRef') canvasRef?: ElementRef<HTMLCanvasElement>;

  private gestureController?: PointerGestureController;
  private popoverCleanup?: () => void;
  private outsideClickListener?: (e: PointerEvent) => void;

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  // Computed signals for high-performance reactive UI binding
  readonly hexColor = computed(() => this.store.getFormatted('hex'));
  readonly displayColor = computed(() => this.store.getFormatted(this.format()));
  readonly contrastRatio = computed(() => this.store.getState().contrast.wcagRatio);
  readonly isAccessible = computed(() => this.store.getState().contrast.aaNormal);
  readonly swatches = computed(() => this.store.getState().swatches);

  readonly thumbX = computed(() => {
    const c = this.store.getState().currentOklch.c;
    return Math.min(Math.max((c / 0.32) * 100, 0), 100);
  });

  readonly thumbY = computed(() => {
    const l = this.store.getState().currentOklch.l;
    return Math.min(Math.max((1.0 - l) * 100, 0), 100);
  });

  readonly thumbBorderColor = computed(() => {
    const rgb = oklchToRgb(this.store.getState().currentOklch);
    const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
    return lum > 0.5 ? '#000000' : '#ffffff';
  });

  readonly alphaPercent = computed(() => {
    return Math.round(this.store.getState().currentOklch.alpha * 100);
  });

  readonly alphaGradientCss = computed(() => {
    return `linear-gradient(to right, transparent, ${this.hexColor()})`;
  });

  ngAfterViewInit(): void {
    this.setupOutsideClick();
  }

  ngOnDestroy(): void {
    this.gestureController?.destroy();
    this.popoverCleanup?.();
    if (this.outsideClickListener) {
      window.removeEventListener('pointerdown', this.outsideClickListener);
    }
  }

  writeValue(val: string): void {
    if (val) {
      this.store.dispatch({ type: 'SET_COLOR_STRING', payload: val });
      if (this.isOpen()) {
        this.renderCanvas();
      }
    }
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // handled via host bindings
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const minRatio = this.minContrastRatio();
    if (minRatio !== null && control.value) {
      const actualRatio = this.store.getState().contrast.wcagRatio;
      if (actualRatio < minRatio) {
        return { insufficientContrast: { required: minRatio, actual: actualRatio } };
      }
    }
    return null;
  }

  togglePopover(): void {
    if (this.isOpen()) {
      this.closePopover();
    } else {
      this.openPopover();
    }
  }

  openPopover(): void {
    this.isOpen.set(true);
    setTimeout(() => {
      this.setupPositioning();
      this.renderCanvas();
      this.setupGestureController();
    });
  }

  closePopover(): void {
    this.isOpen.set(false);
    this.gestureController?.destroy();
    this.popoverCleanup?.();
    this.onTouched();
  }

  onHueInput(event: Event): void {
    const hue = parseFloat((event.target as HTMLInputElement).value);
    this.store.dispatch({ type: 'SET_OKLCH', payload: { h: hue } });
    this.notifyUpdate();
    this.renderCanvas();
  }

  onAlphaInput(event: Event): void {
    const alpha = parseFloat((event.target as HTMLInputElement).value) / 100;
    this.store.dispatch({ type: 'SET_OKLCH', payload: { alpha } });
    this.notifyUpdate();
  }

  onFormatChange(event: Event): void {
    const fmt = (event.target as HTMLSelectElement).value as ColorSpace;
    this.store.dispatch({ type: 'SET_FORMAT', payload: fmt });
  }

  onTextInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.setColor(text);
  }

  setColor(colorStr: string): void {
    this.store.dispatch({ type: 'SET_COLOR_STRING', payload: colorStr });
    this.notifyUpdate();
    this.renderCanvas();
  }

  onAutoFix(): void {
    this.store.dispatch({ type: 'AUTO_FIX_CONTRAST', payload: { targetRatio: 4.5 } });
    this.notifyUpdate();
    this.renderCanvas();
  }

  private notifyUpdate(): void {
    const formatted = this.store.getFormatted(this.format());
    this.value.set(formatted);
    this.onChange(formatted);
  }

  private setupPositioning(): void {
    if (!this.triggerRef?.nativeElement || !this.popoverRef?.nativeElement) return;
    this.popoverCleanup = setupPopoverPositioning({
      referenceElement: this.triggerRef.nativeElement,
      floatingElement: this.popoverRef.nativeElement,
      placement: 'bottom-start'
    });
  }

  private setupOutsideClick(): void {
    this.outsideClickListener = (e: PointerEvent) => {
      if (!this.isOpen()) return;
      const target = e.target as Node;
      if (
        this.popoverRef?.nativeElement &&
        !this.popoverRef.nativeElement.contains(target) &&
        this.triggerRef?.nativeElement &&
        !this.triggerRef.nativeElement.contains(target)
      ) {
        this.ngZone.run(() => this.closePopover());
      }
    };
    window.addEventListener('pointerdown', this.outsideClickListener);
  }

  private setupGestureController(): void {
    if (!this.canvasAreaRef?.nativeElement) return;

    // 60fps drag handled outside Angular zone to avoid tick storm
    this.ngZone.runOutsideAngular(() => {
      this.gestureController = new PointerGestureController(
        this.canvasAreaRef!.nativeElement,
        (coords) => {
          this.store.dispatch({
            type: 'SET_OKLCH',
            payload: {
              c: coords.x * 0.32,
              l: 1.0 - coords.y
            }
          });
          this.ngZone.run(() => {
            this.notifyUpdate();
          });
        }
      );
    });
  }

  private renderCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 296;
    const height = rect.height || 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;
    const totalW = canvas.width;
    const totalH = canvas.height;
    const hue = this.store.getState().currentOklch.h;

    let idx = 0;
    for (let y = 0; y < totalH; y++) {
      const l = 1.0 - y / totalH;
      for (let x = 0; x < totalW; x++) {
        const c = (x / totalW) * 0.32;
        const rgb = oklchToRgb({ l, c, h: hue, alpha: 1 });
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
        idx += 4;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
}
