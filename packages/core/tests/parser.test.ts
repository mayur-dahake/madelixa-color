import { describe, it, expect } from 'vitest';
import { parseColorString } from '../src';

describe('Smart Paste Parser', () => {
  it('should parse 3-digit and 6-digit hex strings', () => {
    const res1 = parseColorString('#ff0000');
    expect(res1?.detectedFormat).toBe('hex');
    expect(res1?.oklch.l).toBeGreaterThan(0.5);

    const res2 = parseColorString('#fff');
    expect(res2?.detectedFormat).toBe('hex');
    expect(res2?.oklch.l).toBeCloseTo(1.0, 2);
  });

  it('should parse functional rgb and rgba strings', () => {
    const res = parseColorString('rgba(59, 130, 246, 0.8)');
    expect(res?.detectedFormat).toBe('rgb');
    expect(res?.oklch.alpha).toBe(0.8);
  });

  it('should parse functional oklch strings', () => {
    const res = parseColorString('oklch(62.3% 0.214 259.8)');
    expect(res?.detectedFormat).toBe('oklch');
    expect(res?.oklch.l).toBeCloseTo(0.623, 3);
    expect(res?.oklch.c).toBeCloseTo(0.214, 3);
    expect(res?.oklch.h).toBeCloseTo(259.8, 1);
  });

  it('should parse Display P3 color function strings', () => {
    const res = parseColorString('color(display-p3 1 0.5 0)');
    expect(res?.detectedFormat).toBe('p3');
  });

  it('should parse W3C named color keywords', () => {
    const res = parseColorString('coral');
    expect(res?.detectedFormat).toBe('hex');
    expect(res?.oklch).toBeDefined();
  });
});
