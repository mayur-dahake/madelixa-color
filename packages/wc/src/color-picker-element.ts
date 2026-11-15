import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ColorStore, createColorStore, ColorSpace, oklchToRgb, rgbToHex } from '@madelixa/color-core';
import { PointerGestureController } from '@madelixa/color-dom';

@customElement('madelixa-color-picker')
export class MadelixaColorPickerElement extends LitElement {
  static formAssociated = true;
  private internals: ElementInternals;
  private store: ColorStore;
  private unsubscribe?: () => void;
  private gestureController?: PointerGestureController;

  @property({ type: String }) value = '#3b82f6';
  @property({ type: String }) format: ColorSpace = 'hex';
  @property({ type: String, attribute: 'contrast-bg' }) contrastBg = '#ffffff';

  @state() private isOpen = false;

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      background: #ffffff;
      cursor: pointer;
    }
    .swatch {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    .text-val {
      font-size: 12px;
      font-family: monospace;
      color: #18181b;
    }
    .popover {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 8px;
      z-index: 100;
      width: 320px;
      padding: 12px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
    }
    .canvas-wrap {
      position: relative;
      width: 100%;
      height: 150px;
      border-radius: 8px;
      overflow: hidden;
      cursor: crosshair;
      border: 1px solid rgba(0,0,0,0.1);
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .thumb {
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      margin-left: -8px;
      margin-top: -8px;
      pointer-events: none;
    }
    .sliders {
      margin-top: 10px;
    }
    input[type=range] {
      width: 100%;
      height: 12px;
      cursor: pointer;
    }
    .footer {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #e4e4e7;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    button.auto-fix {
      padding: 2px 8px;
      border-radius: 4px;
      background: #3b82f6;
      color: #ffffff;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }
  `;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.store = createColorStore(this.value, this.contrastBg);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = this.store.subscribe((state) => {
      const formatted = this.store.getFormatted(this.format);
      this.internals.setFormValue(formatted);
      this.dispatchEvent(new CustomEvent('change', { detail: { value: formatted, state }, bubbles: true }));
      this.requestUpdate();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.gestureController?.destroy();
  }

  firstUpdated(): void {
    this.internals.setFormValue(this.store.getFormatted(this.format));
  }

  protected updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('value')) {
      this.store.dispatch({ type: 'SET_COLOR_STRING', payload: this.value });
    }
    if (this.isOpen) {
      this.renderCanvas();
      this.setupGesture();
    }
  }

  private togglePopover(): void {
    this.isOpen = !this.isOpen;
  }

  private setupGesture(): void {
    const wrap = this.renderRoot.querySelector<HTMLDivElement>('.canvas-wrap');
    if (!wrap || this.gestureController) return;

    this.gestureController = new PointerGestureController(wrap, (coords) => {
      this.store.dispatch({
        type: 'SET_OKLCH',
        payload: {
          c: coords.x * 0.32,
          l: 1.0 - coords.y
        }
      });
      this.renderCanvas();
    });
  }

  private renderCanvas(): void {
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const hue = this.store.getState().currentOklch.h;

    let idx = 0;
    for (let y = 0; y < h; y++) {
      const l = 1.0 - y / h;
      for (let x = 0; x < w; x++) {
        const c = (x / w) * 0.32;
        const rgb = oklchToRgb({ l, c, h: hue, alpha: 1 });
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
        idx += 4;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  private handleHue(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.store.dispatch({ type: 'SET_OKLCH', payload: { h: val } });
    this.renderCanvas();
  }

  private handleAutoFix(): void {
    this.store.dispatch({ type: 'AUTO_FIX_CONTRAST', payload: { targetRatio: 4.5 } });
    this.renderCanvas();
  }

  render() {
    const state = this.store.getState();
    const hex = this.store.getFormatted('hex');
    const thumbX = Math.min(Math.max((state.currentOklch.c / 0.32) * 100, 0), 100);
    const thumbY = Math.min(Math.max((1.0 - state.currentOklch.l) * 100, 0), 100);

    return html`
      <div class="trigger" @click="${this.togglePopover}">
        <div class="swatch" style="background-color: ${hex};"></div>
        <span class="text-val">${this.store.getFormatted(this.format)}</span>
      </div>

      ${this.isOpen ? html`
        <div class="popover" role="dialog" aria-label="Color Picker">
          <div class="canvas-wrap">
            <canvas width="296" height="150"></canvas>
            <div
              class="thumb"
              style="left: ${thumbX}%; top: ${thumbY}%; background-color: ${hex};"
            ></div>
          </div>

          <div class="sliders">
            <input
              type="range"
              min="0"
              max="360"
              .value="${state.currentOklch.h}"
              @input="${this.handleHue}"
            />
          </div>

          <div class="footer">
            <span>WCAG: <strong>${state.contrast.wcagRatio}:1</strong></span>
            <button type="button" class="auto-fix" @click="${this.handleAutoFix}">
              ⚡ Auto-Fix
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }
}
