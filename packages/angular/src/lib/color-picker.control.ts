import { signal, WritableSignal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ColorStore, createColorStore, ColorSpace, OklchColor } from '@madelixa/color-core';

export interface ColorPickerControlOptions {
  alpha?: boolean;
  presets?: string[];
  contrastBg?: string;
}

/**
 * `ColorPickerControl`
 * Programmatic controller matching the popular API of ngx-color-picker,
 * upgraded with modern Angular Signals, RxJS Observables, and Madelixa OKLCH color engine.
 */
export class ColorPickerControl {
  private store: ColorStore;
  private readonly initialColor: string;
  private _value$ = new Subject<string>();
  readonly valueChanges: Observable<string> = this._value$.asObservable();

  // Angular 17+ Signals
  readonly value: WritableSignal<string>;
  readonly isAlphaEnabled: WritableSignal<boolean>;
  readonly isPresetsEnabled: WritableSignal<boolean>;
  readonly presets: WritableSignal<string[]>;

  constructor(
    initialColor: string = '#3b82f6',
    options?: ColorPickerControlOptions
  ) {
    this.initialColor = initialColor;
    this.store = createColorStore(initialColor, options?.contrastBg || '#ffffff');
    this.value = signal(initialColor);
    this.isAlphaEnabled = signal(options?.alpha ?? true);
    this.isPresetsEnabled = signal(true);
    this.presets = signal(
      options?.presets ?? [
        '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
        '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000'
      ]
    );

    this.store.subscribe(() => {
      const formatted = this.store.getFormatted('hex');
      this.value.set(formatted);
      this._value$.next(formatted);
    });
  }

  public setValue(color: string): void {
    this.store.dispatch({ type: 'SET_COLOR_STRING', payload: color });
  }

  public getValue(format: ColorSpace = 'hex'): string {
    return this.store.getFormatted(format);
  }

  public getOklch(): OklchColor {
    return this.store.getState().currentOklch;
  }

  public showAlphaChannel(): void {
    this.isAlphaEnabled.set(true);
  }

  public hideAlphaChannel(): void {
    this.isAlphaEnabled.set(false);
  }

  public isAlphaChannelEnabled(): boolean {
    return this.isAlphaEnabled();
  }

  public setColorPresets(presets: string[]): void {
    this.presets.set(presets);
  }

  public showPresets(): void {
    this.isPresetsEnabled.set(true);
  }

  public hidePresets(): void {
    this.isPresetsEnabled.set(false);
  }

  public reset(): void {
    this.setValue(this.initialColor);
  }

  public getStore(): ColorStore {
    return this.store;
  }
}
