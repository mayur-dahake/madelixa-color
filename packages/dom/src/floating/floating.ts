import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
  Placement
} from '@floating-ui/dom';

export interface PopoverPositionOptions {
  referenceElement: HTMLElement;
  floatingElement: HTMLElement;
  placement?: Placement;
  offsetPx?: number;
  onPositionUpdate?: (x: number, y: number, placement: Placement) => void;
}

/**
 * Attaches Floating UI auto-positioning to anchor the 320px popover to its trigger
 */
export function setupPopoverPositioning(options: PopoverPositionOptions): () => void {
  const {
    referenceElement,
    floatingElement,
    placement = 'bottom-start',
    offsetPx = 8,
    onPositionUpdate
  } = options;

  const update = async () => {
    const { x, y, placement: actualPlacement } = await computePosition(
      referenceElement,
      floatingElement,
      {
        placement,
        middleware: [
          offset(offsetPx),
          flip({ fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] }),
          shift({ padding: 12 })
        ]
      }
    );

    floatingElement.style.left = `${x}px`;
    floatingElement.style.top = `${y}px`;

    onPositionUpdate?.(x, y, actualPlacement);
  };

  return autoUpdate(referenceElement, floatingElement, update);
}
