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
  computed
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
  calculateWcagRatio,
  autoFixContrast
} from '@madelixa/color-core';
import { PointerGestureController, setupPopoverPositioning } from '@madelixa/color-dom';

@Component({
  selector: 'madelixa-color-picker',
  standalone: true,
  template: `
    <div class="mdx-picker-host" #container style="position: relative; display: inline-block;">
      <!-- Closed Trigger State -->
      <div
        class="mdx-cp-trigger"
        #trigger
        (click)="togglePopover()"
        style="display: flex; align-items: center; gap: 8px; padding: 6px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; cursor: pointer;"
      >
        <div
          class="mdx-cp-swatch"
          style="width: 24px; height: 24px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1); overflow: hidden;"
        >
          <div [style.background-color]="hexColor()" style="width: 100%; height: 100%;"></div>
        </div>
        <span style="font-size: 12px; font-family: monospace; font-weight: 500; color: #18181b;">
          {{ formattedColor() }}
        </span>
      </div>

      <!-- Open Popover (320px) -->
      @if (isOpen) {
        <div
          class="mdx-cp-popover"
          #popover
          style="position: absolute; z-index: 50; width: 320px; padding: 12px; border-radius: 12px; border: 1px solid #e4e4e7; background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);"
        >
          <!-- 2D Canvas Area -->
          <div
            #canvasWrapper
            style="position: relative; width: 100%; height: 150px; border-radius: 8px; overflow: hidden; cursor: crosshair; border: 1px solid rgba(0,0,0,0.1);"
          >
            <canvas #canvas width="296" height="150" style="width: 100%; height: 100%; display: block;"></canvas>
            <div
              [style.left.%]="thumbX()"
              [style.top.%]="thumbY()"
              [style.background-color]="hexColor()"
              style="position: absolute; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25); margin-left: -8px; margin-top: -8px; pointer-events: none;"
            ></div>
          </div>

          <!-- Sliders -->
          <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
            <input
              type="range"
              min="0"
              max="360"
              [value]="store.getState().currentOklch.h"
              (input)="onHueInput($event)"
              style="width: 100%; height: 12px; cursor: pointer;"
            />
          </div>

          <!-- A11y Footer -->
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e4e4e7; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <span>WCAG: <strong>{{ contrastRatio() }}:1</strong></span>
            <button
              type="button"
              (click)="onAutoFix()"
              style="padding: 2px 8px; border-radius: 4px; background: #3b82f6; color: #ffffff; border: none; cursor: pointer;"
            >
              ⚡ Auto-Fix
            </button>
          </div>
        </div>
      }
    </div>
  `,
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MadelixaColorPickerComponent implements ControlValueAccessor, Validator, AfterViewInit, OnDestroy {
  private ngZone = inject(NgZone);

  // Signal Inputs and Models
  readonly format = input<ColorSpace>('hex');
  readonly value = model<string>('#3b82f6');
  readonly minContrastRatio = input<number | null>(null);

  protected store: ColorStore = createColorStore('#3b82f6');
  protected isOpen = false;

  @ViewChild('canvasWrapper') canvasWrapper?: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trigger') trigger?: ElementRef<HTMLDivElement>;
  @ViewChild('popover') popover?: ElementRef<HTMLDivElement>;

  private gestureController?: PointerGestureController;
  private popoverCleanup?: () => void;

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly hexColor = computed(() => {
    return this.store.getFormatted('hex');
  });

  readonly formattedColor = computed(() => {
    return this.store.getFormatted(this.format());
  });

  readonly contrastRatio = computed(() => {
    return this.store.getState().contrast.wcagRatio;
  });

  readonly thumbX = computed(() => {
    const c = this.store.getState().currentOklch.c;
    return Math.min(Math.max((c / 0.32) * 100, 0), 100);
  });

  readonly thumbY = computed(() => {
    const l = this.store.getState().currentOklch.l;
    return Math.min(Math.max((1.0 - l) * 100, 0), 100);
  });

  ngAfterViewInit(): void {
    this.drawCanvas();
  }

  ngOnDestroy(): void {
    this.gestureController?.destroy();
    this.popoverCleanup?.();
  }

  writeValue(val: string): void {
    if (val) {
      this.store.dispatch({ type: 'SET_COLOR_STRING', payload: val });
      this.drawCanvas();
    }
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const targetMin = this.minContrastRatio();
    if (targetMin !== null && control.value) {
      const ratio = this.store.getState().contrast.wcagRatio;
      if (ratio < targetMin) {
        return { insufficientContrast: { required: targetMin, actual: ratio } };
      }
    }
    return null;
  }

  togglePopover(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.drawCanvas();
        this.setupDragEvents();
      });
    } else {
      this.gestureController?.destroy();
      this.popoverCleanup?.();
      this.onTouched();
    }
  }

  onHueInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.store.dispatch({ type: 'SET_OKLCH', payload: { h: val } });
    this.commitChange();
    this.drawCanvas();
  }

  onAutoFix(): void {
    this.store.dispatch({ type: 'AUTO_FIX_CONTRAST', payload: { targetRatio: 4.5 } });
    this.commitChange();
    this.drawCanvas();
  }

  private commitChange(): void {
    const formatted = this.store.getFormatted(this.format());
    this.value.set(formatted);
    this.onChange(formatted);
  }

  private setupDragEvents(): void {
    if (!this.canvasWrapper?.nativeElement) return;

    // Run 60fps drag gesture outside Angular zone to avoid triggering change detection ticks
    this.ngZone.runOutsideAngular(() => {
      this.gestureController = new PointerGestureController(
        this.canvasWrapper!.nativeElement,
        (coords) => {
          this.store.dispatch({
            type: 'SET_OKLCH',
            payload: {
              c: coords.x * 0.32,
              l: 1.0 - coords.y
            }
          });
          this.ngZone.run(() => {
            this.commitChange();
          });
        }
      );
    });
  }

  private drawCanvas(): void {
    const cvs = this.canvas?.nativeElement;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const w = cvs.width;
    const h = cvs.height;
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
    ctx.putImageData(imgData, 0, 0);
  }
}
