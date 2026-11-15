import { describe, it, expect } from 'vitest';
import {
  getRelativeLuminance,
  calculateWcagRatio,
  getContrastReport,
  autoFixContrast
} from '../src';

describe('WCAG 2.1 Contrast Engine & Auto-Fix', () => {
  it('should compute exact relative luminance for black and white', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBe(0);
    expect(getRelativeLuminance(255, 255, 255)).toBeCloseTo(1.0, 4);
  });

  it('should calculate 21:1 contrast ratio between pure white and pure black', () => {
    const white = { l: 1.0, c: 0, h: 0, alpha: 1 };
    const black = { l: 0.0, c: 0, h: 0, alpha: 1 };
    const ratio = calculateWcagRatio(black, white);
    expect(ratio).toBe(21);
  });

  it('should auto-fix low contrast colors to meet target ratio 4.5:1', () => {
    const whiteBg = { l: 1.0, c: 0, h: 0, alpha: 1 };
    // Very light yellow (poor contrast on white)
    const lowContrastFg = { l: 0.95, c: 0.15, h: 90, alpha: 1 };

    const initialReport = getContrastReport(lowContrastFg, whiteBg);
    expect(initialReport.aaNormal).toBe(false);

    const fixed = autoFixContrast(lowContrastFg, whiteBg, 4.5);
    const fixedReport = getContrastReport(fixed, whiteBg);

    expect(fixedReport.wcagRatio).toBeGreaterThanOrEqual(4.5);
    expect(fixedReport.aaNormal).toBe(true);
    // Preserves hue
    expect(fixed.h).toBe(lowContrastFg.h);
  });
});
