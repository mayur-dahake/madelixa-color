import React, { useState } from 'react';
import {
  SketchPicker,
  ChromePicker,
  CompactPicker,
  GithubPicker,
  ColorPicker,
  useColorPicker
} from '@madelixa/color-react';
import '@madelixa/color-dom/styles.css';

export function App() {
  const [color, setColor] = useState('#3b82f6');
  const [activeTab, setActiveTab] = useState<'sketch' | 'chrome' | 'compact' | 'github' | 'compound'>('sketch');

  const { hex, oklch, contrastRatio, isAccessible, autoFix } = useColorPicker({
    value: color,
    onChange: setColor
  });

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: 960,
      margin: '40px auto',
      padding: '0 24px',
      color: '#18181b'
    }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: color,
            border: '2px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }} />
          <h1 style={{ fontSize: 26, margin: 0, fontWeight: 700 }}>
            Madelixa Color Picker — React 18+ Showcase
          </h1>
        </div>
        <p style={{ color: '#71717a', margin: 0, fontSize: 14 }}>
          Universal wide-gamut OKLCH & Display P3 color picker suite with real-time WCAG 2.1 accessibility.
        </p>
      </header>

      {/* Variant Selector Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['sketch', 'chrome', 'compact', 'github', 'compound'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: activeTab === tab ? '1px solid #2563eb' : '1px solid #e4e4e7',
              backgroundColor: activeTab === tab ? '#2563eb' : '#ffffff',
              color: activeTab === tab ? '#ffffff' : '#3f3f46',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab} {tab === 'compound' ? 'Component' : 'Picker'}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32,
        alignItems: 'start'
      }}>
        {/* Active Picker Container */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: 24,
          borderRadius: 16,
          border: '1px solid #e4e4e7',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: 14, margin: '0 0 16px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live {activeTab} Demo
          </h2>

          {activeTab === 'sketch' && <SketchPicker value={color} onChange={setColor} showAlpha={true} />}
          {activeTab === 'chrome' && <ChromePicker value={color} onChange={setColor} showAlpha={true} />}
          {activeTab === 'compact' && <CompactPicker value={color} onChange={setColor} />}
          {activeTab === 'github' && <GithubPicker value={color} onChange={setColor} />}

          {activeTab === 'compound' && (
            <ColorPicker.Root value={color} onChange={setColor}>
              <ColorPicker.Trigger />
              <ColorPicker.Popover>
                <ColorPicker.Canvas />
                <ColorPicker.Sliders showAlpha={true} />
                <ColorPicker.Inputs />
                <ColorPicker.A11yBar />
                <ColorPicker.Swatches />
              </ColorPicker.Popover>
            </ColorPicker.Root>
          )}
        </div>

        {/* Real-time State & Accessibility Card */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: 24,
          borderRadius: 16,
          border: '1px solid #e4e4e7',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          <div>
            <h2 style={{ fontSize: 14, margin: '0 0 12px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Color State
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontFamily: 'monospace' }}>
              <div>HEX: <strong>{hex}</strong></div>
              <div>OKLCH: <strong>{oklch}</strong></div>
            </div>
          </div>

          <div style={{
            padding: 16,
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: 12, margin: '0 0 6px', color: '#64748b', textTransform: 'uppercase' }}>
              WCAG 2.1 Contrast (vs White)
            </h3>
            <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0' }}>
              {contrastRatio}:1
            </div>
            <div style={{
              display: 'inline-block',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: isAccessible ? '#dcfce7' : '#fee2e2',
              color: isAccessible ? '#166534' : '#991b1b',
              marginBottom: 12
            }}>
              {isAccessible ? '✓ Passes AA (4.5:1)' : '✕ Fails AA (Too light)'}
            </div>

            {!isAccessible && (
              <button
                type="button"
                onClick={() => autoFix(4.5)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ⚡ 1-Click Auto-Fix Contrast
              </button>
            )}
          </div>

          {/* Interactive UI Preview */}
          <div>
            <h3 style={{ fontSize: 12, margin: '0 0 10px', color: '#71717a', textTransform: 'uppercase' }}>
              Dynamic UI Preview
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                style={{
                  backgroundColor: color,
                  color: '#ffffff',
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Primary Button
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: 'transparent',
                  color: color,
                  border: `2px solid ${color}`,
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Outline Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
