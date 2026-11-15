import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ColorStore, createColorStore, ColorSpace, oklchToRgb } from '@madelixa/color-core';
import { PointerGestureController, handleKeyboard2D } from '@madelixa/color-dom';

/**
 * `<madelixa-color-picker>`
 * Production-ready Web Component / Custom Element with Shadow DOM.
 * Works natively in pure HTML, Vue, Svelte, Angular, React, and legacy ERP frameworks.
 *
 * Features:
 * - High-DPI Canvas scaling for crisp Retina rendering
 * - Perceptually uniform OKLCH Lightness-Chroma plane
 * - Rainbow Hue & Checkerboard Alpha sliders
 * - Real-time WCAG 2.1 & APCA contrast calculation with 1-click Auto-Fix
 * - Format switching (HEX, OKLCH, RGB, HSL)
 * - W3C Form-Associated Custom Element (participates in `<form>` submission)
 * - ARIA keyboard accessible with outside-click dismissal
 */
@customElement('madelixa-color-picker')
export class MadelixaColorPickerElement extends LitElement {
  static formAssociated = true;
  private internals: ElementInternals;
  private store: ColorStore;
  private unsubscribe?: () => void;
  private gestureController?: PointerGestureController;
  private boundOutsideClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  @property({ type: String }) value = '#3b82f6';
  @property({ type: String }) format: ColorSpace = 'hex';
  @property({ type: String, attribute: 'contrast-bg' }) contrastBg = '#ffffff';
  @property({ type: Boolean }) disabled = false;

  @state() private isOpen = false;
  @state() private activeFormat: ColorSpace = 'hex';
  @state() private inputValue = '';

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      --mdx-cp-bg: #18181b;
      --mdx-cp-card: #27272a;
      --mdx-cp-border: rgba(255, 255, 255, 0.1);
      --mdx-cp-text: #f4f4f5;
      --mdx-cp-text-muted: #a1a1aa;
      --mdx-cp-primary: #3b82f6;
      --mdx-cp-primary-hover: #2563eb;
      --mdx-cp-success: #10b981;
      --mdx-cp-warning: #f59e0b;
      --mdx-cp-danger: #ef4444;
      --mdx-cp-radius: 12px;
      --mdx-cp-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }

    * {
      box-sizing: border-box;
    }

    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px 6px 8px;
      border: 1px solid var(--mdx-cp-border);
      border-radius: var(--mdx-cp-radius);
      background: var(--mdx-cp-card);
      cursor: pointer;
      user-select: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .trigger:hover:not(.disabled) {
      border-color: rgba(255, 255, 255, 0.25);
    }

    .trigger:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--mdx-cp-primary);
    }

    .trigger.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .swatch-btn {
      position: relative;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
      flex-shrink: 0;
      background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    }

    .swatch-fill {
      position: absolute;
      inset: 0;
    }

    .text-val {
      font-size: 13px;
      font-weight: 500;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: var(--mdx-cp-text);
      letter-spacing: -0.01em;
    }

    .popover {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      z-index: 1000;
      width: 320px;
      padding: 14px;
      border-radius: var(--mdx-cp-radius);
      background: var(--mdx-cp-bg);
      border: 1px solid var(--mdx-cp-border);
      box-shadow: var(--mdx-cp-shadow);
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: mdx-popover-in 0.15s ease-out;
    }

    @keyframes mdx-popover-in {
      from {
        opacity: 0;
        transform: translateY(-4px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* 2D Canvas Area */
    .canvas-container {
      position: relative;
      width: 100%;
      height: 160px;
      border-radius: 8px;
      overflow: hidden;
      cursor: crosshair;
      border: 1px solid rgba(255, 255, 255, 0.08);
      touch-action: none;
    }

    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .canvas-thumb {
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.5);
      margin-left: -8px;
      margin-top: -8px;
      pointer-events: none;
      transition: transform 0.05s ease;
    }

    .canvas-container:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--mdx-cp-primary);
    }

    /* Sliders Stack */
    .sliders-stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .slider-track-wrap {
      position: relative;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    .hue-track {
      background: linear-gradient(
        to right,
        #f00 0%,
        #ff0 17%,
        #0f0 33%,
        #0ff 50%,
        #00f 67%,
        #f0f 83%,
        #f00 100%
      );
    }

    .alpha-track-bg {
      background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    }

    .alpha-gradient {
      position: absolute;
      inset: 0;
    }

    .slider-input {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 100%;
      background: transparent;
      outline: none;
      cursor: pointer;
      position: absolute;
      inset: 0;
      margin: 0;
    }

    .slider-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid rgba(0, 0, 0, 0.2);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      cursor: pointer;
    }

    .slider-input::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid rgba(0, 0, 0, 0.2);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      cursor: pointer;
    }

    /* Inputs Row */
    .inputs-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .format-select {
      background: var(--mdx-cp-card);
      border: 1px solid var(--mdx-cp-border);
      border-radius: 6px;
      color: var(--mdx-cp-text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 6px 8px;
      cursor: pointer;
      outline: none;
      text-transform: uppercase;
    }

    .format-select:focus {
      border-color: var(--mdx-cp-primary);
    }

    .color-text-input {
      flex: 1;
      background: var(--mdx-cp-card);
      border: 1px solid var(--mdx-cp-border);
      border-radius: 6px;
      padding: 6px 10px;
      color: var(--mdx-cp-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      outline: none;
    }

    .color-text-input:focus {
      border-color: var(--mdx-cp-primary);
      box-shadow: 0 0 0 1px var(--mdx-cp-primary);
    }

    /* Accessibility Bar */
    .a11y-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--mdx-cp-border);
      font-size: 11px;
    }

    .a11y-scores {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mdx-cp-text-muted);
    }

    .score-badge {
      font-weight: 600;
      color: var(--mdx-cp-text);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .badge-status {
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-pass {
      background: rgba(16, 185, 129, 0.2);
      color: var(--mdx-cp-success);
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .badge-fail {
      background: rgba(239, 68, 68, 0.2);
      color: var(--mdx-cp-danger);
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .auto-fix-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      background: var(--mdx-cp-primary);
      color: #ffffff;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .auto-fix-btn:hover {
      background: var(--mdx-cp-primary-hover);
    }
  `;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.activeFormat = this.format;
    this.store = createColorStore(this.value, this.contrastBg);

    this.boundOutsideClick = (e: MouseEvent) => {
      if (!this.isOpen) return;
      const path = e.composedPath();
      if (!path.includes(this)) {
        this.isOpen = false;
      }
    };

    this.boundKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.isOpen = false;
      }
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('pointerdown', this.boundOutsideClick);
    window.addEventListener('keydown', this.boundKeyDown);

    this.unsubscribe = this.store.subscribe((state) => {
      const formatted = this.store.getFormatted(this.activeFormat);
      this.inputValue = formatted;
      this.internals.setFormValue(formatted);
      this.dispatchEvent(new CustomEvent('change', { detail: { value: formatted, state }, bubbles: true, composed: true }));
      this.requestUpdate();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('pointerdown', this.boundOutsideClick);
    window.removeEventListener('keydown', this.boundKeyDown);
    this.unsubscribe?.();
    this.gestureController?.destroy();
  }

  firstUpdated(): void {
    this.inputValue = this.store.getFormatted(this.activeFormat);
    this.internals.setFormValue(this.inputValue);
  }

  protected updated(changedProps: PropertyValues<this>): void {
    if (changedProps.has('value')) {
      this.store.dispatch({ type: 'SET_COLOR_STRING', payload: this.value });
    }
    if (changedProps.has('format')) {
      this.activeFormat = this.format;
      this.inputValue = this.store.getFormatted(this.activeFormat);
    }
    if (changedProps.has('contrastBg')) {
      this.store.dispatch({ type: 'SET_BACKGROUND', payload: this.contrastBg });
    }

    if (this.isOpen) {
      this.renderCanvas();
      this.setupGesture();
    }
  }

  private togglePopover(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.inputValue = this.store.getFormatted(this.activeFormat);
    }
  }

  private setupGesture(): void {
    const wrap = this.renderRoot.querySelector<HTMLDivElement>('.canvas-container');
    if (!wrap) return;

    if (!this.gestureController) {
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
  }

  private renderCanvas(): void {
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width || 292);
    const h = Math.round(rect.height || 160);

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

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

    const offscreen = new OffscreenCanvas(w, h);
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.putImageData(imgData, 0, 0);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.drawImage(offscreen, 0, 0, w, h);
      ctx.restore();
    }
  }

  private handleHue(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.store.dispatch({ type: 'SET_OKLCH', payload: { h: val } });
    this.renderCanvas();
  }

  private handleAlpha(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.store.dispatch({ type: 'SET_ALPHA', payload: val });
  }

  private handleFormatChange(e: Event): void {
    this.activeFormat = (e.target as HTMLSelectElement).value as ColorSpace;
    this.inputValue = this.store.getFormatted(this.activeFormat);
  }

  private handleInputChange(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.inputValue = val;
    this.store.dispatch({ type: 'SET_COLOR_STRING', payload: val });
    this.renderCanvas();
  }

  private handleCanvasKeyDown(e: KeyboardEvent): void {
    const state = this.store.getState();
    const currentCoords = {
      x: state.currentOklch.c / 0.32,
      y: 1.0 - state.currentOklch.l
    };
    const nextCoords = handleKeyboard2D(e, currentCoords);
    if (nextCoords) {
      e.preventDefault();
      this.store.dispatch({
        type: 'SET_OKLCH',
        payload: {
          c: nextCoords.x * 0.32,
          l: 1.0 - nextCoords.y
        }
      });
      this.renderCanvas();
    }
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
    const passesAA = state.contrast.passesAA;
    const solidColor = `rgb(${state.currentRgb.r}, ${state.currentRgb.g}, ${state.currentRgb.b})`;

    return html`
      <div
        class="trigger ${this.disabled ? 'disabled' : ''}"
        role="button"
        tabindex="${this.disabled ? -1 : 0}"
        aria-haspopup="dialog"
        aria-expanded="${this.isOpen}"
        @click="${this.togglePopover}"
      >
        <div class="swatch-btn">
          <div class="swatch-fill" style="background-color: ${hex};"></div>
        </div>
        <span class="text-val">${this.store.getFormatted(this.activeFormat)}</span>
      </div>

      ${this.isOpen
        ? html`
            <div class="popover" role="dialog" aria-label="Madelixa Color Picker">
              <!-- 2D Canvas Lightness / Chroma -->
              <div
                class="canvas-container"
                tabindex="0"
                role="slider"
                aria-roledescription="2D Lightness and Chroma area"
                aria-label="Lightness and Chroma"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${Math.round(state.currentOklch.l * 100)}"
                aria-valuetext="Lightness ${Math.round(state.currentOklch.l * 100)}%, Chroma ${(state.currentOklch.c).toFixed(3)}"
                @keydown="${this.handleCanvasKeyDown}"
              >
                <canvas></canvas>
                <div
                  class="canvas-thumb"
                  style="left: ${thumbX}%; top: ${thumbY}%; background-color: ${solidColor};"
                ></div>
              </div>

              <!-- Sliders: Hue and Alpha -->
              <div class="sliders-stack">
                <div class="slider-track-wrap hue-track">
                  <input
                    type="range"
                    class="slider-input"
                    min="0"
                    max="360"
                    step="0.5"
                    aria-label="Hue"
                    .value="${String(state.currentOklch.h)}"
                    @input="${this.handleHue}"
                  />
                </div>

                <div class="slider-track-wrap alpha-track-bg">
                  <div
                    class="alpha-gradient"
                    style="background: linear-gradient(to right, transparent, ${solidColor});"
                  ></div>
                  <input
                    type="range"
                    class="slider-input"
                    min="0"
                    max="1"
                    step="0.01"
                    aria-label="Alpha"
                    .value="${String(state.currentOklch.alpha ?? 1)}"
                    @input="${this.handleAlpha}"
                  />
                </div>
              </div>

              <!-- Inputs row -->
              <div class="inputs-row">
                <select class="format-select" .value="${this.activeFormat}" @change="${this.handleFormatChange}">
                  <option value="hex">HEX</option>
                  <option value="oklch">OKLCH</option>
                  <option value="rgb">RGB</option>
                  <option value="hsl">HSL</option>
                  <option value="p3">P3</option>
                </select>
                <input
                  type="text"
                  class="color-text-input"
                  aria-label="Color Value"
                  .value="${this.inputValue}"
                  @change="${this.handleInputChange}"
                />
              </div>

              <!-- Live Accessibility & Auto-Fix -->
              <div class="a11y-bar">
                <div class="a11y-scores">
                  <span class="score-badge">
                    WCAG ${state.contrast.wcagRatio}:1
                    <span class="badge-status ${passesAA ? 'badge-pass' : 'badge-fail'}">
                      ${passesAA ? 'AA Pass' : 'Fail'}
                    </span>
                  </span>
                  <span>APCA ${Math.round(state.contrast.apcaLc)}</span>
                </div>

                ${!passesAA
                  ? html`
                      <button type="button" class="auto-fix-btn" @click="${this.handleAutoFix}">
                        ⚡ Fix AA
                      </button>
                    `
                  : html`<span style="color: var(--mdx-cp-success); font-weight: 600;">✓ Compliant</span>`}
              </div>
            </div>
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'madelixa-color-picker': MadelixaColorPickerElement;
  }
}
