export interface KeyNavigationOptions {
  onStepX: (delta: number) => void;
  onStepY?: (delta: number) => void;
  onMinX?: () => void;
  onMaxX?: () => void;
  onEscape?: () => void;
}

/**
 * Handles ARIA-compliant keyboard navigation on sliders and 2D canvas.
 */
export function handleSliderKeyNavigation(
  event: KeyboardEvent,
  options: KeyNavigationOptions
): void {
  const stepSmall = 0.01; // 1%
  const stepLarge = 0.10; // 10%
  const multiplier = event.shiftKey ? stepLarge : stepSmall;

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault();
      options.onStepX(multiplier);
      break;

    case 'ArrowLeft':
      event.preventDefault();
      options.onStepX(-multiplier);
      break;

    case 'ArrowUp':
      if (options.onStepY) {
        event.preventDefault();
        options.onStepY(multiplier);
      }
      break;

    case 'ArrowDown':
      if (options.onStepY) {
        event.preventDefault();
        options.onStepY(-multiplier);
      }
      break;

    case 'Home':
      event.preventDefault();
      options.onMinX?.();
      break;

    case 'End':
      event.preventDefault();
      options.onMaxX?.();
      break;

    case 'Escape':
      event.preventDefault();
      options.onEscape?.();
      break;
  }
}
