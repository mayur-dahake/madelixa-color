import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { useColorPicker, UseColorPickerOptions } from '../hooks/useColorPicker';
import { PointerGestureController, setupPopoverPositioning } from '@madelixa/color-dom';
import { oklchToRgb, rgbToHex, getRelativeLuminance } from '@madelixa/color-core';

type ColorPickerContextValue = ReturnType<typeof useColorPicker> & {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
};

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

export function useColorPickerContext() {
  const ctx = useContext(ColorPickerContext);
  if (!ctx) {
    throw new Error('ColorPicker compound components must be used within <ColorPicker.Root>');
  }
  return ctx;
}

export interface ColorPickerRootProps extends UseColorPickerOptions {
  children: React.ReactNode;
  className?: string;
}

export function ColorPickerRoot({ children, className, ...options }: ColorPickerRootProps) {
  const picker = useColorPicker(options);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current && popoverRef.current) {
      const cleanup = setupPopoverPositioning({
        referenceElement: triggerRef.current,
        floatingElement: popoverRef.current
      });
      return cleanup;
    }
  }, [isOpen]);

  const value = {
    ...picker,
    isOpen,
    setIsOpen,
    triggerRef,
    popoverRef
  };

  return (
    <ColorPickerContext.Provider value={value}>
      <div className={`mdx-color-picker-root ${className || ''}`} style={{ position: 'relative' }}>
        {children}
      </div>
    </ColorPickerContext.Provider>
  );
}

export function ColorPickerTrigger({ className }: { className?: string }) {
  const { triggerRef, hex, setIsOpen, isOpen, openEyeDropper, state } = useColorPickerContext();

  return (
    <div
      ref={triggerRef}
      className={`mdx-cp-trigger flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white shadow-sm cursor-pointer ${className || ''}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="w-6 h-6 rounded-lg mdx-cp-checkered-bg relative overflow-hidden flex-shrink-0 border border-black/10">
        <div className="w-full h-full" style={{ backgroundColor: hex, opacity: state.currentOklch.alpha }} />
      </div>
      <span className="text-xs font-mono font-medium text-slate-800 flex-1">{hex}</span>
      <button
        type="button"
        className="p-1 rounded hover:bg-slate-100 text-xs text-slate-600 transition"
        onClick={(e) => {
          e.stopPropagation();
          openEyeDropper();
        }}
      >
        💉
      </button>
    </div>
  );
}

export function ColorPickerPopover({ children, className }: { children: React.ReactNode; className?: string }) {
  const { isOpen, popoverRef } = useColorPickerContext();

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={`mdx-cp-popover absolute z-50 w-[320px] rounded-xl p-3 border border-slate-200 bg-white shadow-xl space-y-2.5 ${className || ''}`}
      role="dialog"
      aria-label="Color Picker"
    >
      {children}
    </div>
  );
}

export function ColorPickerCanvas({ className }: { className?: string }) {
  const { color, setOklch } = useColorPickerContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Render OKLCH Lightness vs Chroma canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    let idx = 0;
    for (let y = 0; y < h; y++) {
      const l = 1.0 - y / h;
      for (let x = 0; x < w; x++) {
        const c = (x / w) * 0.32;
        const rgb = oklchToRgb({ l, c, h: color.h, alpha: 1 });
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
        idx += 4;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [color.h]);

  // Attach 60fps PointerGestureController
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
  const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  const thumbBorder = lum > 0.5 ? '#000000' : '#ffffff';

  const thumbX = Math.min(Math.max((color.c / 0.32) * 100, 0), 100);
  const thumbY = Math.min(Math.max((1.0 - color.l) * 100, 0), 100);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[150px] rounded-lg overflow-hidden cursor-crosshair select-none border border-black/10 ${className || ''}`}
    >
      <canvas ref={canvasRef} width={296} height={150} className="w-full h-full block" />
      <div
        className="absolute w-4 h-4 rounded-full -ml-2 -mt-2 pointer-events-none shadow-md"
        style={{
          left: `${thumbX}%`,
          top: `${thumbY}%`,
          backgroundColor: rgbToHex(rgb.r, rgb.g, rgb.b),
          borderColor: thumbBorder,
          borderWidth: 2,
          borderStyle: 'solid'
        }}
        role="slider"
        aria-roledescription="2D color area"
      />
    </div>
  );
}

export function ColorPickerSliders() {
  const { color, setOklch, hex } = useColorPickerContext();

  return (
    <div className="space-y-2">
      {/* Hue */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 w-3">H</span>
        <div className="relative flex-1 h-3 rounded-full mdx-cp-hue-track overflow-hidden">
          <input
            type="range"
            min="0"
            max="360"
            value={color.h}
            onChange={(e) => setOklch({ h: parseFloat(e.target.value) })}
            className="w-full h-full absolute top-0 left-0 cursor-pointer"
          />
        </div>
      </div>
      {/* Alpha */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 w-3">A</span>
        <div className="relative flex-1 h-3 rounded-full mdx-cp-checkered-bg overflow-hidden border border-black/5">
          <div
            className="w-full h-full absolute top-0 left-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, transparent, ${hex})` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(color.alpha * 100)}
            onChange={(e) => setOklch({ alpha: parseFloat(e.target.value) / 100 })}
            className="w-full h-full absolute top-0 left-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export function ColorPickerA11yBar() {
  const { contrastRatio, isAccessible, autoFix } = useColorPickerContext();

  return (
    <div className="flex items-center justify-between text-[11px] pt-1">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500">vs #FFF:</span>
        <span className="font-mono font-bold text-slate-800">{contrastRatio}:1</span>
        <span
          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
            isAccessible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {isAccessible ? 'AA ✓' : 'AA ✕'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => autoFix(4.5)}
        className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm"
      >
        ⚡ Auto-Fix
      </button>
    </div>
  );
}

export const ColorPicker = {
  Root: ColorPickerRoot,
  Trigger: ColorPickerTrigger,
  Popover: ColorPickerPopover,
  Canvas: ColorPickerCanvas,
  Sliders: ColorPickerSliders,
  A11yBar: ColorPickerA11yBar
};
