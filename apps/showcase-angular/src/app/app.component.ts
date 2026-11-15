import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MadelixaColorPickerComponent } from '@madelixa/color-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MadelixaColorPickerComponent],
  template: `
    <main style="max-width: 900px; margin: 40px auto; padding: 24px;">
      <header style="margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px;">
          Madelixa Color Picker — Angular 19 Showcase
        </h1>
        <p style="color: #71717a; margin: 0;">
          Next-generation OKLCH, Display P3 & WCAG Auto-Fix color picker for Angular Standalone components.
        </p>
      </header>

      <section style="display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap;">
        <div style="background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="font-size: 18px; margin: 0 0 16px;">Inline OKLCH Color Picker</h2>
          <madelixa-color-picker
            [(value)]="selectedColor"
            [inline]="true"
            variant="sketch"
          />
        </div>

        <div style="flex: 1; min-width: 280px; background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="font-size: 18px; margin: 0 0 16px;">Selected Color State</h2>
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <div
              style="width: 56px; height: 56px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);"
              [style.background-color]="selectedColor()"
            ></div>
            <div>
              <div style="font-family: monospace; font-size: 16px; font-weight: 600;">
                {{ selectedColor() }}
              </div>
              <div style="font-size: 12px; color: #71717a;">Reactive Two-Way Model Signal</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class AppComponent {
  selectedColor = signal('#3b82f6');
}
