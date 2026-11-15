import { useSyncExternalStore, useCallback, useMemo, useEffect } from 'react';
import {
  ColorStore,
  createColorStore,
  ColorSpace,
  OklchColor,
  ColorPickerState
} from '@madelixa/color-core';
import { sampleScreenColor } from '@madelixa/color-dom';

export interface UseColorPickerOptions {
  defaultValue?: string;
  value?: string;
  defaultBg?: string;
  format?: ColorSpace;
  onChange?: (color: string, state: ColorPickerState) => void;
}

export function useColorPicker(options: UseColorPickerOptions = {}) {
  const { defaultValue = '#3b82f6', value, defaultBg = '#ffffff', format = 'hex', onChange } = options;

  // Memoize store instance for the lifetime of the component
  const store: ColorStore = useMemo(() => {
    return createColorStore(value || defaultValue, defaultBg);
  }, []);

  // Sync external controlled value if passed
  useEffect(() => {
    if (value !== undefined) {
      store.dispatch({ type: 'SET_COLOR_STRING', payload: value });
    }
  }, [value, store]);

  // Sync format if prop changes
  useEffect(() => {
    if (format) {
      store.dispatch({ type: 'SET_FORMAT', payload: format });
    }
  }, [format, store]);

  // Connect store with useSyncExternalStore for React 18/19 concurrent safety
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState
  );

  const setColor = useCallback(
    (newColor: string) => {
      store.dispatch({ type: 'SET_COLOR_STRING', payload: newColor });
      onChange?.(store.getFormatted(), store.getState());
    },
    [store, onChange]
  );

  const setOklch = useCallback(
    (payload: Partial<OklchColor>) => {
      store.dispatch({ type: 'SET_OKLCH', payload });
      onChange?.(store.getFormatted(), store.getState());
    },
    [store, onChange]
  );

  const setFormat = useCallback(
    (fmt: ColorSpace) => {
      store.dispatch({ type: 'SET_FORMAT', payload: fmt });
    },
    [store]
  );

  const autoFix = useCallback(
    (targetRatio: number = 4.5) => {
      store.dispatch({ type: 'AUTO_FIX_CONTRAST', payload: { targetRatio } });
      onChange?.(store.getFormatted(), store.getState());
    },
    [store, onChange]
  );

  const openEyeDropper = useCallback(async () => {
    const sampledHex = await sampleScreenColor();
    if (sampledHex) {
      setColor(sampledHex);
    }
  }, [setColor]);

  return {
    state,
    store,
    color: state.currentOklch,
    formatted: store.getFormatted(),
    hex: store.getFormatted('hex'),
    rgb: store.getFormatted('rgb'),
    hsl: store.getFormatted('hsl'),
    oklch: store.getFormatted('oklch'),
    p3: store.getFormatted('p3'),
    contrastRatio: state.contrast.wcagRatio,
    isAccessible: state.contrast.aaNormal,
    setColor,
    setOklch,
    setFormat,
    autoFix,
    openEyeDropper
  };
}
