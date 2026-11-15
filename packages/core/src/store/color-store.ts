import type {
  ColorPickerState,
  ColorPickerAction,
  OklchColor,
  ColorSpace
} from '../types.ts';
import { parseColorString } from '../parser/smart-paste.ts';
import { getContrastReport, autoFixContrast } from '../a11y/contrast.ts';
import { isOklchOutOfSrgbGamut, clampOklchToSrgb } from '../gamut/clamp.ts';
import {
  createDefaultGradient,
  addGradientStop,
  updateGradientStop,
  removeGradientStop
} from '../gradient/gradient.ts';
import { formatColor } from '../conversions/index.ts';

export type Listener = (state: ColorPickerState) => void;

export class ColorStore {
  private state: ColorPickerState;
  private listeners: Set<Listener> = new Set();

  constructor(initialColor: string = '#3b82f6', initialBg: string = '#ffffff') {
    const parsedInitial = parseColorString(initialColor)?.oklch ?? {
      l: 0.623,
      c: 0.214,
      h: 259.8,
      alpha: 1.0
    };
    const parsedBg = parseColorString(initialBg)?.oklch ?? {
      l: 1.0,
      c: 0.0,
      h: 0.0,
      alpha: 1.0
    };

    const gradientEndColor: OklchColor = {
      l: 0.65,
      c: 0.23,
      h: (parsedInitial.h + 60) % 360,
      alpha: 1.0
    };

    this.state = {
      currentOklch: parsedInitial,
      activeFormat: 'hex',
      isOutofSrgbGamut: isOklchOutOfSrgbGamut(parsedInitial),
      gradient: createDefaultGradient(parsedInitial, gradientEndColor),
      backgroundOklch: parsedBg,
      contrast: getContrastReport(parsedInitial, parsedBg),
      visionMode: 'normal',
      swatches: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
      isDragging: false
    };
  }

  public getState = (): ColorPickerState => {
    return this.state;
  };

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public dispatch = (action: ColorPickerAction): void => {
    this.state = this.reducer(this.state, action);
    this.notify();
  };

  public getFormatted = (format?: ColorSpace): string => {
    return formatColor(this.state.currentOklch, format ?? this.state.activeFormat);
  };

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private reducer(state: ColorPickerState, action: ColorPickerAction): ColorPickerState {
    switch (action.type) {
      case 'SET_OKLCH': {
        const nextOklch: OklchColor = {
          ...state.currentOklch,
          ...action.payload
        };
        return {
          ...state,
          currentOklch: nextOklch,
          isOutofSrgbGamut: isOklchOutOfSrgbGamut(nextOklch),
          contrast: getContrastReport(nextOklch, state.backgroundOklch)
        };
      }

      case 'SET_FORMAT': {
        return {
          ...state,
          activeFormat: action.payload
        };
      }

      case 'SET_COLOR_STRING': {
        const parsed = parseColorString(action.payload);
        if (!parsed) return state;

        return {
          ...state,
          currentOklch: parsed.oklch,
          activeFormat: parsed.detectedFormat,
          isOutofSrgbGamut: isOklchOutOfSrgbGamut(parsed.oklch),
          contrast: getContrastReport(parsed.oklch, state.backgroundOklch)
        };
      }

      case 'SET_BACKGROUND': {
        const parsedBg = parseColorString(action.payload);
        if (!parsedBg) return state;

        return {
          ...state,
          backgroundOklch: parsedBg.oklch,
          contrast: getContrastReport(state.currentOklch, parsedBg.oklch)
        };
      }

      case 'AUTO_FIX_CONTRAST': {
        const target = action.payload?.targetRatio ?? 4.5;
        const fixed = autoFixContrast(state.currentOklch, state.backgroundOklch, target);
        return {
          ...state,
          currentOklch: fixed,
          isOutofSrgbGamut: isOklchOutOfSrgbGamut(fixed),
          contrast: getContrastReport(fixed, state.backgroundOklch)
        };
      }

      case 'ADD_GRADIENT_STOP': {
        return {
          ...state,
          gradient: addGradientStop(state.gradient, action.payload.offset)
        };
      }

      case 'UPDATE_GRADIENT_STOP': {
        return {
          ...state,
          gradient: updateGradientStop(state.gradient, action.payload.id, {
            color: action.payload.color,
            offset: action.payload.offset
          })
        };
      }

      case 'REMOVE_GRADIENT_STOP': {
        return {
          ...state,
          gradient: removeGradientStop(state.gradient, action.payload.id)
        };
      }

      case 'SET_VISION_MODE': {
        return {
          ...state,
          visionMode: action.payload
        };
      }

      case 'ADD_SWATCH': {
        if (state.swatches.includes(action.payload)) return state;
        return {
          ...state,
          swatches: [...state.swatches, action.payload]
        };
      }

      case 'REMOVE_SWATCH': {
        return {
          ...state,
          swatches: state.swatches.filter((_, idx) => idx !== action.payload)
        };
      }

      case 'SET_DRAGGING': {
        return {
          ...state,
          isDragging: action.payload
        };
      }

      default:
        return state;
    }
  }
}

export function createColorStore(
  initialColor: string = '#3b82f6',
  initialBg: string = '#ffffff'
): ColorStore {
  return new ColorStore(initialColor, initialBg);
}
