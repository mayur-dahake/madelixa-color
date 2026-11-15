import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle
} from 'react';
import { useColorPicker, UseColorPickerOptions } from '../hooks/useColorPicker.ts';
import {
  PointerGestureController,
  setupPopoverPositioning,
  handleSliderKeyNavigation
} from '@madelixa/color-dom';
import {
  oklchToRgb,
  rgbToHex,
  getRelativeLuminance,
  formatColor,
  ColorSpace
} from '@madelixa/color-core';

export interface ColorPickerContextValue extends ReturnType<typeof useColorPicker> {
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  activeTab: 'solid' | 'gradient' | 'harmonies' | 'scales';
  setActiveTab: (tab: 'solid' | 'gradient' | 'harmonies' | 'scales') => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

export function useColorPickerContext(): ColorPickerContextValue {
  const ctx = useContext(ColorPickerContext);
  if (!ctx) {
    throw new Error('ColorPicker compound sub-components must be wrapped within <ColorPicker.Root>');
  }
  return ctx;
}

/* ==============================================================================
   1. ROOT
   ============================================================================== */
export interface ColorPickerRootProps extends UseColorPickerOptions {
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export const ColorPickerRoot = forwardRef<HTMLDivElement, ColorPickerRootProps>(
  ({ children, className = '', defaultOpen = false, ...options }, ref) => {
    const picker = useColorPicker(options);
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [activeTab, setActiveTab] = useState<'solid' | 'gradient' | 'harmonies' | 'scales'>('solid');

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    // Floating UI auto-positioning
    useEffect(() => {
      if (isOpen && triggerRef.current && popoverRef.current) {
        return setupPopoverPositioning({
          referenceElement: triggerRef.current,
          floatingElement: popoverRef.current,
          placement: 'bottom-start'
        });
      }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;

      const handlePointerDownOutside = (e: PointerEvent) => {
        const target = e.target as Node;
        if (
          popoverRef.current &&
          !popoverRef.current.contains(target) &&
          triggerRef.current &&
          !triggerRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      window.addEventListener('pointerdown', handlePointerDownOutside);
      return () => window.removeEventListener('pointerdown', handlePointerDownOutside);
    }, [isOpen]);

    const contextValue: ColorPickerContextValue = {
      ...picker,
      isOpen,
      setIsOpen,
      triggerRef,
      popoverRef,
      activeTab,
      setActiveTab
    };

    return (
      <ColorPickerContext.Provider value={contextValue}>
        <div ref={ref} className={`mdx-color-picker ${className}`}>
          {children}
        </div>
      </ColorPickerContext.Provider>
    );
  }
);
ColorPickerRoot.displayName = 'ColorPicker.Root';

/* ==============================================================================
   2. TRIGGER
   ============================================================================== */
export interface ColorPickerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showValue?: boolean;
  showEyeDropper?: boolean;
}

export const ColorPickerTrigger = forwardRef<HTMLButtonElement, ColorPickerTriggerProps>(
  ({ className = '', showValue = true, showEyeDropper = true, ...props }, ref) => {
    const { triggerRef, hex, setIsOpen, isOpen, openEyeDropper, state } = useColorPickerContext();

    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

    return (
      <button
        ref={triggerRef}
        type="button"
        className={`mdx-cp-trigger ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        {...props}
      >
        <span className="mdx-cp-trigger-swatch mdx-cp-track-checkered">
          <span
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              backgroundColor: hex,
              opacity: state.currentOklch.alpha
            }}
          />
        </span>
        {showValue && <span className="mdx-cp-trigger-text">{hex}</span>}
        {showEyeDropper && (
          <span
            className="mdx-cp-btn"
            style={{ width: 22, height: 22, padding: 0 }}
            title="Sample color from screen"
            onClick={(e) => {
              e.stopPropagation();
              openEyeDropper();
            }}
          >
            💉
          </span>
        )}
      </button>
    );
  }
);
ColorPickerTrigger.displayName = 'ColorPicker.Trigger';

/* ==============================================================================
   3. POPOVER
   ============================================================================== */
export interface ColorPickerPopoverProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ColorPickerPopover = forwardRef<HTMLDivElement, ColorPickerPopoverProps>(
  ({ children, className = '', ...props }, ref) => {
    const { isOpen, popoverRef, setIsOpen } = useColorPickerContext();

    useImperativeHandle(ref, () => popoverRef.current as HTMLDivElement);

    if (!isOpen) return null;

    return (
      <div
        ref={popoverRef}
        className={`mdx-cp-popover ${className}`}
        role="dialog"
        aria-label="Color Picker"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setIsOpen(false);
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ColorPickerPopover.displayName = 'ColorPicker.Popover';

/* ==============================================================================
   4. 2D CANVAS SELECTION AREA (Retina High-DPI scaled)
   ============================================================================== */
export interface ColorPickerCanvasProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ColorPickerCanvas = forwardRef<HTMLDivElement, ColorPickerCanvasProps>(
  ({ className = '', ...props }, ref) => {
    const { color, setOklch } = useColorPickerContext();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    // High-DPI Canvas Rendering
    useEffect(() => {
      const canvas = canvasRef.current;
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
      const hue = color.h;

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
    }, [color.h]);

    // 60fps Pointer Gesture Controller
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const controller = new PointerGestureController(container, (coords) => {
        setOklch({
          c: coords.x * 0.32,
          l: 1.0 - coords.y
        });
      });

      return () => controller.destroy();
    }, [setOklch]);

    const rgb = oklchToRgb(color);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
    const thumbBorder = lum > 0.5 ? '#000000' : '#ffffff';

    const thumbX = Math.min(Math.max((color.c / 0.32) * 100, 0), 100);
    const thumbY = Math.min(Math.max((1.0 - color.l) * 100, 0), 100);

    return (
      <div
        ref={containerRef}
        className={`mdx-cp-canvas-area ${className}`}
        tabIndex={0}
        role="slider"
        aria-label="Color Canvas Area"
        aria-roledescription="2D Lightness and Chroma area"
        aria-valuetext={`Lightness ${Math.round(color.l * 100)}%, Chroma ${color.c.toFixed(2)}`}
        onKeyDown={(e) => {
          handleSliderKeyNavigation(e.nativeEvent, {
            onStepX: (delta) => setOklch({ c: Math.max(0, Math.min(0.32, color.c + delta * 0.32)) }),
            onStepY: (delta) => setOklch({ l: Math.max(0, Math.min(1.0, color.l + delta)) }),
            onMinX: () => setOklch({ c: 0 }),
            onMaxX: () => setOklch({ c: 0.32 })
          });
        }}
        {...props}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        <div
          className="mdx-cp-thumb"
          style={{
            left: `${thumbX}%`,
            top: `${thumbY}%`,
            backgroundColor: hex,
            borderColor: thumbBorder,
            borderWidth: 2,
            borderStyle: 'solid'
          }}
        />
      </div>
    );
  }
);
ColorPickerCanvas.displayName = 'ColorPicker.Canvas';

/* ==============================================================================
   5. SLIDERS (Hue & Alpha)
   ============================================================================== */
export function ColorPickerHueSlider() {
  const { color, setOklch } = useColorPickerContext();

  return (
    <div className="mdx-cp-slider-row">
      <span className="mdx-cp-slider-label">H</span>
      <div className="mdx-cp-track mdx-cp-track-hue">
        <input
          type="range"
          min="0"
          max="360"
          step="0.5"
          value={color.h}
          className="mdx-cp-range-input"
          aria-label="Hue"
          aria-valuenow={Math.round(color.h)}
          aria-valuemin={0}
          aria-valuemax={360}
          onChange={(e) => setOklch({ h: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  );
}

export function ColorPickerAlphaSlider() {
  const { color, setOklch, hex } = useColorPickerContext();

  return (
    <div className="mdx-cp-slider-row">
      <span className="mdx-cp-slider-label">A</span>
      <div className="mdx-cp-track mdx-cp-track-checkered">
        <div
          className="mdx-cp-alpha-overlay"
          style={{ background: `linear-gradient(to right, transparent, ${hex})` }}
        />
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(color.alpha * 100)}
          className="mdx-cp-range-input"
          aria-label="Alpha"
          aria-valuenow={Math.round(color.alpha * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onChange={(e) => setOklch({ alpha: parseFloat(e.target.value) / 100 })}
        />
      </div>
    </div>
  );
}

export function ColorPickerSliders() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <ColorPickerHueSlider />
      <ColorPickerAlphaSlider />
    </div>
  );
}

/* ==============================================================================
   6. MULTI-FORMAT INPUTS ROW
   ============================================================================== */
export function ColorPickerInputs() {
  const { state, setFormat, setColor } = useColorPickerContext();
  const [localVal, setLocalVal] = useState('');

  useEffect(() => {
    setLocalVal(formatColor(state.currentOklch, state.activeFormat));
  }, [state.currentOklch, state.activeFormat]);

  return (
    <div className="mdx-cp-inputs-row">
      <select
        value={state.activeFormat}
        onChange={(e) => setFormat(e.target.value as ColorSpace)}
        className="mdx-cp-select"
        aria-label="Color Space Format"
      >
        <option value="hex">HEX</option>
        <option value="rgb">RGB</option>
        <option value="hsl">HSL</option>
        <option value="oklch">OKLCH</option>
        <option value="p3">P3</option>
      </select>
      <div className="mdx-cp-input-group">
        <input
          type="text"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={() => setColor(localVal)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setColor(localVal);
            }
          }}
          className="mdx-cp-field"
          aria-label="Color Value"
        />
      </div>
    </div>
  );
}

/* ==============================================================================
   7. ACCESSIBILITY & SWATCHES FOOTER
   ============================================================================== */
export function ColorPickerA11yBar({ targetRatio = 4.5 }: { targetRatio?: number }) {
  const { contrastRatio, isAccessible, autoFix } = useColorPickerContext();

  return (
    <div className="mdx-cp-a11y-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--mdx-cp-text-secondary)' }}>vs #FFF:</span>
        <span style={{ fontFamily: 'var(--mdx-cp-font-mono)', fontWeight: 700 }}>{contrastRatio}:1</span>
        <span className={`mdx-cp-pill ${isAccessible ? 'mdx-cp-pill-pass' : 'mdx-cp-pill-fail'}`}>
          {isAccessible ? 'AA ✓' : 'AA ✕'}
        </span>
      </div>
      <button
        type="button"
        className="mdx-cp-btn mdx-cp-btn-primary"
        onClick={() => autoFix(targetRatio)}
      >
        ⚡ Auto-Fix
      </button>
    </div>
  );
}

export function ColorPickerSwatches() {
  const { state, setColor } = useColorPickerContext();

  return (
    <div className="mdx-cp-swatches">
      <span style={{ fontSize: 'var(--mdx-cp-font-size-xs)', color: 'var(--mdx-cp-text-muted)' }}>
        Saved:
      </span>
      <div className="mdx-cp-swatch-list">
        {state.swatches.map((hex, i) => (
          <button
            key={i}
            type="button"
            className="mdx-cp-swatch-btn"
            style={{ backgroundColor: hex }}
            title={`Select ${hex}`}
            onClick={() => setColor(hex)}
          />
        ))}
      </div>
    </div>
  );
}

export function ColorPickerFooter() {
  return (
    <div className="mdx-cp-footer">
      <ColorPickerA11yBar />
      <ColorPickerSwatches />
    </div>
  );
}

/* ==============================================================================
   EXPORT COMPOUND COMPONENT
   ============================================================================== */
export const ColorPicker = {
  Root: ColorPickerRoot,
  Trigger: ColorPickerTrigger,
  Popover: ColorPickerPopover,
  Canvas: ColorPickerCanvas,
  HueSlider: ColorPickerHueSlider,
  AlphaSlider: ColorPickerAlphaSlider,
  Sliders: ColorPickerSliders,
  Inputs: ColorPickerInputs,
  A11yBar: ColorPickerA11yBar,
  Swatches: ColorPickerSwatches,
  Footer: ColorPickerFooter
};
