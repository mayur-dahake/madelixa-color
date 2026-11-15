import React, { useState } from 'react';
import { ColorPicker, useColorPicker } from '@madelixa/color-react';
import '@madelixa/color-dom/styles.css';

export function App() {
  const [color, setColor] = useState('#3b82f6');
  const { hex, contrastRatio, isAccessible, autoFix } = useColorPicker({
    value: color,
    onChange: (val) => setColor(val)
  });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1>Madelixa Color Picker — React 18+ Showcase</h1>
      <p style={{ color: '#71717a' }}>
        Testing compound components, concurrent useSyncExternalStore hooks, and WCAG Auto-Fix.
      </p>

      <div style={{ marginTop: 24, padding: 24, border: '1px solid #e4e4e7', borderRadius: 16 }}>
        <h3>Compound Component</h3>
        <ColorPicker.Root value={color} onChange={(val) => setColor(val)}>
          <ColorPicker.Trigger />
          <ColorPicker.Popover>
            <ColorPicker.Canvas />
            <ColorPicker.Sliders />
            <ColorPicker.A11yBar />
          </ColorPicker.Popover>
        </ColorPicker.Root>

        <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: hex, border: '1px solid rgba(0,0,0,0.1)' }} />
          <div>
            <div>Active HEX: <code>{hex}</code></div>
            <div>WCAG vs #FFF: <strong>{contrastRatio}:1</strong> {isAccessible ? '✅ AA Pass' : '❌ AA Fail'}</div>
          </div>
          <button
            onClick={() => autoFix(4.5)}
            style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            ⚡ Auto-Fix Contrast
          </button>
        </div>
      </div>
    </div>
  );
}
