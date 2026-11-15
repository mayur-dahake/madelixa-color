/**
 * Madelixa Color Core Types
 * Internal source of truth for color math, state machine, and accessibility.
 */

export type ColorSpace = 'hex' | 'rgb' | 'hsl' | 'oklch' | 'p3';

export interface OklchColor {
  /** Lightness: [0, 1] */
  l: number;
  /** Chroma: [0, ~0.37] */
  c: number;
  /** Hue angle in degrees: [0, 360) */
  h: number;
  /** Alpha transparency: [0, 1] */
  alpha: number;
}

export interface RgbaColor {
  /** Red: [0, 255] */
  r: number;
  /** Green: [0, 255] */
  g: number;
  /** Blue: [0, 255] */
  b: number;
  /** Alpha transparency: [0, 1] */
  alpha: number;
}

export interface HslaColor {
  /** Hue: [0, 360) */
  h: number;
  /** Saturation: [0, 100] */
  s: number;
  /** Lightness: [0, 100] */
  l: number;
  /** Alpha transparency: [0, 1] */
  alpha: number;
}

export interface DisplayP3Color {
  /** Red: [0, 1] */
  r: number;
  /** Green: [0, 1] */
  g: number;
  /** Blue: [0, 1] */
  b: number;
  /** Alpha transparency: [0, 1] */
  alpha: number;
}

export interface CmykColor {
  /** Cyan: [0, 100] */
  c: number;
  /** Magenta: [0, 100] */
  m: number;
  /** Yellow: [0, 100] */
  y: number;
  /** Key/Black: [0, 100] */
  k: number;
  /** Alpha transparency: [0, 1] */
  alpha: number;
}

export interface GradientStop {
  id: string;
  color: OklchColor;
  /** Normalized position [0, 1] */
  offset: number;
}

export interface GradientState {
  type: 'linear' | 'radial' | 'conic';
  /** Angle in degrees for linear gradient [0, 360) */
  angle: number;
  stops: GradientStop[];
  activeStopId: string;
}

export interface ContrastReport {
  /** WCAG 2.1 ratio (e.g. 4.54) */
  wcagRatio: number;
  /** Ratio >= 4.5:1 */
  aaNormal: boolean;
  /** Ratio >= 3.0:1 */
  aaLarge: boolean;
  /** Ratio >= 7.0:1 */
  aaaNormal: boolean;
  /** APCA Lightness Contrast value (-108 to 106) */
  apcaLc: number;
}

export type ColorVisionMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface ColorPickerState {
  currentOklch: OklchColor;
  activeFormat: ColorSpace;
  isOutofSrgbGamut: boolean;
  gradient: GradientState;
  backgroundOklch: OklchColor;
  contrast: ContrastReport;
  visionMode: ColorVisionMode;
  swatches: string[];
  isDragging: boolean;
}

export type ColorPickerAction =
  | { type: 'SET_OKLCH'; payload: Partial<OklchColor> }
  | { type: 'SET_FORMAT'; payload: ColorSpace }
  | { type: 'SET_COLOR_STRING'; payload: string }
  | { type: 'SET_BACKGROUND'; payload: string }
  | { type: 'AUTO_FIX_CONTRAST'; payload?: { targetRatio?: number } }
  | { type: 'ADD_GRADIENT_STOP'; payload: { offset: number } }
  | { type: 'UPDATE_GRADIENT_STOP'; payload: { id: string; color?: Partial<OklchColor>; offset?: number } }
  | { type: 'REMOVE_GRADIENT_STOP'; payload: { id: string } }
  | { type: 'SET_VISION_MODE'; payload: ColorVisionMode }
  | { type: 'ADD_SWATCH'; payload: string }
  | { type: 'REMOVE_SWATCH'; payload: number }
  | { type: 'SET_DRAGGING'; payload: boolean };
