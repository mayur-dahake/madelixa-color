export interface NormalizedCoords {
  x: number; // [0, 1]
  y: number; // [0, 1]
}

export type GestureUpdateCallback = (coords: NormalizedCoords, event: PointerEvent) => void;
export type GestureEndCallback = (coords: NormalizedCoords, event: PointerEvent) => void;

/**
 * 60fps Pointer Gesture Controller
 * Uses PointerCapture and requestAnimationFrame throttling to handle
 * smooth dragging on 2D color canvas and 1D slider tracks.
 */
export class PointerGestureController {
  private isDragging = false;
  private rafId: number | null = null;
  private latestEvent: PointerEvent | null = null;

  constructor(
    private element: HTMLElement,
    private onUpdate: GestureUpdateCallback,
    private onEnd?: GestureEndCallback
  ) {
    this.element.addEventListener('pointerdown', this.handlePointerDown);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    // Only respond to primary mouse button or touch/stylus
    if (event.button !== 0) return;

    event.preventDefault();
    this.element.setPointerCapture(event.pointerId);
    this.isDragging = true;
    this.latestEvent = event;

    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);

    this.processEvent(event);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.isDragging) return;
    this.latestEvent = event;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.handleRafTick);
    }
  };

  private handleRafTick = (): void => {
    this.rafId = null;
    if (this.isDragging && this.latestEvent) {
      this.processEvent(this.latestEvent);
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.element.hasPointerCapture(event.pointerId)) {
      this.element.releasePointerCapture(event.pointerId);
    }

    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);

    const coords = this.calculateNormalizedCoords(event);
    this.onEnd?.(coords, event);
  };

  private processEvent(event: PointerEvent): void {
    const coords = this.calculateNormalizedCoords(event);
    this.onUpdate(coords, event);
  }

  private calculateNormalizedCoords(event: PointerEvent): NormalizedCoords {
    const rect = this.element.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    const rawX = (event.clientX - rect.left) / width;
    const rawY = (event.clientY - rect.top) / height;

    return {
      x: Math.max(0, Math.min(1, rawX)),
      y: Math.max(0, Math.min(1, rawY))
    };
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }
}
