import { describe, it, expect } from 'vitest';
import { createColorStore } from '../src';

describe('ColorStore FSM & Subscriptions', () => {
  it('should initialize with default state and provide getFormatted()', () => {
    const store = createColorStore('#3b82f6', '#ffffff');
    const state = store.getState();

    expect(state.currentOklch).toBeDefined();
    expect(state.activeFormat).toBe('hex');
    expect(state.contrast.wcagRatio).toBeGreaterThan(1);
    expect(store.getFormatted('hex')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should notify subscribers on dispatch', () => {
    const store = createColorStore('#ff0000');
    let callCount = 0;
    let latestHex = '';

    const unsubscribe = store.subscribe((s) => {
      callCount++;
      latestHex = store.getFormatted('hex');
    });

    store.dispatch({ type: 'SET_COLOR_STRING', payload: '#00ff00' });
    expect(callCount).toBe(1);
    expect(latestHex).toBe('#00ff00');

    store.dispatch({ type: 'SET_OKLCH', payload: { l: 0.8 } });
    expect(callCount).toBe(2);

    unsubscribe();
    store.dispatch({ type: 'SET_COLOR_STRING', payload: '#0000ff' });
    expect(callCount).toBe(2); // no further calls
  });

  it('should auto-fix contrast on dispatch', () => {
    const store = createColorStore('#fef08a', '#ffffff'); // light yellow on white
    expect(store.getState().contrast.aaNormal).toBe(false);

    store.dispatch({ type: 'AUTO_FIX_CONTRAST', payload: { targetRatio: 4.5 } });
    expect(store.getState().contrast.wcagRatio).toBeGreaterThanOrEqual(4.5);
    expect(store.getState().contrast.aaNormal).toBe(true);
  });
});
