export interface EyeDropperResult {
  sRGBHex: string;
}

export interface EyeDropperInstance {
  open: () => Promise<EyeDropperResult>;
}

declare global {
  interface Window {
    EyeDropper?: {
      new (): EyeDropperInstance;
    };
  }
}

/**
 * Triggers native browser EyeDropper API where available.
 * Returns the sampled hex color string, or null if cancelled / unsupported.
 */
export async function sampleScreenColor(): Promise<string | null> {
  if (typeof window !== 'undefined' && 'EyeDropper' in window && window.EyeDropper) {
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      return result.sRGBHex;
    } catch {
      // User cancelled selection with Escape
      return null;
    }
  }
  return null;
}

export function isNativeEyeDropperSupported(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window && !!window.EyeDropper;
}
