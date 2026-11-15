import type { GradientState, GradientStop, OklchColor } from '../types.ts';
import { formatColor } from '../conversions/index.ts';

export function createDefaultGradient(startColor: OklchColor, endColor: OklchColor): GradientState {
  const stops: GradientStop[] = [
    { id: 'stop-0', color: startColor, offset: 0 },
    { id: 'stop-1', color: endColor, offset: 1 }
  ];

  return {
    type: 'linear',
    angle: 90,
    stops,
    activeStopId: 'stop-0'
  };
}

export function addGradientStop(state: GradientState, offset: number): GradientState {
  // Clamp offset to [0, 1]
  const clampedOffset = Math.max(0, Math.min(1, offset));

  // Find surrounding stops to interpolate color
  const sorted = [...state.stops].sort((a, b) => a.offset - b.offset);
  let newColor: OklchColor = sorted[0]?.color ?? { l: 0.5, c: 0.1, h: 0, alpha: 1 };

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a && b && clampedOffset >= a.offset && clampedOffset <= b.offset) {
      const range = b.offset - a.offset;
      const t = range === 0 ? 0 : (clampedOffset - a.offset) / range;
      newColor = {
        l: +(a.color.l + (b.color.l - a.color.l) * t).toFixed(3),
        c: +(a.color.c + (b.color.c - a.color.c) * t).toFixed(3),
        h: +(a.color.h + (b.color.h - a.color.h) * t).toFixed(1),
        alpha: +(a.color.alpha + (b.color.alpha - a.color.alpha) * t).toFixed(2)
      };
      break;
    }
  }

  const newId = `stop-${Date.now()}`;
  const newStop: GradientStop = { id: newId, color: newColor, offset: clampedOffset };
  const stops = [...state.stops, newStop].sort((a, b) => a.offset - b.offset);

  return {
    ...state,
    stops,
    activeStopId: newId
  };
}

export function updateGradientStop(
  state: GradientState,
  id: string,
  update: { color?: Partial<OklchColor>; offset?: number }
): GradientState {
  const stops = state.stops.map(stop => {
    if (stop.id !== id) return stop;
    return {
      ...stop,
      color: update.color ? { ...stop.color, ...update.color } : stop.color,
      offset: update.offset !== undefined ? Math.max(0, Math.min(1, update.offset)) : stop.offset
    };
  }).sort((a, b) => a.offset - b.offset);

  return { ...state, stops };
}

export function removeGradientStop(state: GradientState, id: string): GradientState {
  if (state.stops.length <= 2) {
    // Keep at least two stops
    return state;
  }

  const stops = state.stops.filter(s => s.id !== id);
  const activeStopId = state.activeStopId === id ? (stops[0]?.id ?? '') : state.activeStopId;

  return { ...state, stops, activeStopId };
}

export function serializeGradientToCss(state: GradientState): string {
  const sortedStops = [...state.stops].sort((a, b) => a.offset - b.offset);
  const stopsCss = sortedStops
    .map(stop => `${formatColor(stop.color, 'hex')} ${Math.round(stop.offset * 100)}%`)
    .join(', ');

  switch (state.type) {
    case 'linear':
      return `linear-gradient(${state.angle}deg, ${stopsCss})`;
    case 'radial':
      return `radial-gradient(circle, ${stopsCss})`;
    case 'conic':
      return `conic-gradient(from ${state.angle}deg, ${stopsCss})`;
    default:
      return `linear-gradient(${state.angle}deg, ${stopsCss})`;
  }
}
