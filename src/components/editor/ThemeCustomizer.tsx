'use client';

import React from 'react';
import { useTimelineStore } from '@/lib/store';
import { ThemeColors } from '@/lib/types';
import { themes } from '@/lib/themes';
import { X, Copy, Palette, Type } from 'lucide-react';

const fontOptions = [
  { label: 'Inter', value: "'Inter', system-ui, -apple-system, sans-serif" },
  { label: 'Segoe UI', value: "'Segoe UI', system-ui, -apple-system, sans-serif" },
  { label: 'Helvetica Neue', value: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" },
  { label: 'Georgia', value: "'Georgia', 'Times New Roman', serif" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', 'Arial', sans-serif" },
  { label: 'Courier New', value: "'Courier New', 'Consolas', monospace" },
  { label: 'Arial', value: "'Arial', 'Helvetica', sans-serif" },
  { label: 'Verdana', value: "'Verdana', 'Geneva', sans-serif" },
  { label: 'Tahoma', value: "'Tahoma', 'Geneva', sans-serif" },
  { label: 'Palatino', value: "'Palatino Linotype', 'Book Antiqua', 'Palatino', serif" },
  { label: 'Garamond', value: "'Garamond', 'Times New Roman', serif" },
  { label: 'Lucida Console', value: "'Lucida Console', 'Monaco', monospace" },
];

// Color fields to expose in the customizer, grouped
const colorGroups: { label: string; keys: { key: keyof ThemeColors; label: string }[] }[] = [
  {
    label: 'Background',
    keys: [
      { key: 'background', label: 'Background' },
      { key: 'surface', label: 'Surface' },
      { key: 'border', label: 'Border' },
    ],
  },
  {
    label: 'Text',
    keys: [
      { key: 'text', label: 'Primary' },
      { key: 'textSecondary', label: 'Secondary' },
      { key: 'textMuted', label: 'Muted' },
    ],
  },
  {
    label: 'Accents',
    keys: [
      { key: 'primary', label: 'Primary' },
      { key: 'primaryLight', label: 'Primary Light' },
      { key: 'accent', label: 'Accent' },
    ],
  },
  {
    label: 'Grid',
    keys: [
      { key: 'gridLine', label: 'Grid Lines' },
      { key: 'gridText', label: 'Grid Text' },
      { key: 'headerBg', label: 'Header BG' },
      { key: 'headerText', label: 'Header Text' },
    ],
  },
];

export default function ThemeCustomizer() {
  const customTheme = useTimelineStore((s) => s.customTheme);
  const showThemeCustomizer = useTimelineStore((s) => s.showThemeCustomizer);
  const setShowThemeCustomizer = useTimelineStore((s) => s.setShowThemeCustomizer);
  const updateCustomThemeColor = useTimelineStore((s) => s.updateCustomThemeColor);
  const updateCustomThemeCategoryColor = useTimelineStore((s) => s.updateCustomThemeCategoryColor);
  const updateCustomThemeFont = useTimelineStore((s) => s.updateCustomThemeFont);
  const initCustomThemeFrom = useTimelineStore((s) => s.initCustomThemeFrom);
  const settings = useTimelineStore((s) => s.settings);

  if (!showThemeCustomizer) return null;

  return (
    <div className="theme-customizer">
      <div className="customizer-header">
        <Palette size={14} />
        <span>Theme Customizer</span>
        <button
          className="customizer-close"
          onClick={() => setShowThemeCustomizer(false)}
        >
          <X size={14} />
        </button>
      </div>

      {/* Start from preset */}
      <div className="customizer-section">
        <div className="customizer-label">Start from preset</div>
        <div className="preset-grid">
          {Object.values(themes).map((t) => (
            <button
              key={t.name}
              className="preset-btn"
              onClick={() => initCustomThemeFrom(t.name)}
              title={t.description}
            >
              <span
                className="preset-swatch"
                style={{
                  background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.categories[1] || t.colors.accent})`,
                }}
              />
              <span className="preset-name">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font pickers */}
      <div className="customizer-section">
        <div className="customizer-label"><Type size={12} /> Fonts</div>
        <div className="font-picker-grid">
          <div className="font-picker-field">
            <label className="color-field-label">Heading Font</label>
            <select
              className="font-select"
              value={fontOptions.find(f => customTheme.headingFont.includes(f.label.replace(/'/g, '')))?.value || customTheme.headingFont}
              onChange={(e) => updateCustomThemeFont('headingFont', e.target.value)}
              style={{ fontFamily: customTheme.headingFont }}
            >
              {fontOptions.map((f) => (
                <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="font-preview" style={{ fontFamily: customTheme.headingFont, fontWeight: 700 }}>
              {settings.title || 'Timeline Title'}
            </span>
          </div>
          <div className="font-picker-field">
            <label className="color-field-label">Body Font</label>
            <select
              className="font-select"
              value={fontOptions.find(f => customTheme.fontFamily.includes(f.label.replace(/'/g, '')))?.value || customTheme.fontFamily}
              onChange={(e) => updateCustomThemeFont('fontFamily', e.target.value)}
              style={{ fontFamily: customTheme.fontFamily }}
            >
              {fontOptions.map((f) => (
                <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="font-preview" style={{ fontFamily: customTheme.fontFamily }}>
              Strategy, Design, Development
            </span>
          </div>
        </div>
      </div>

      {/* Color pickers by group */}
      {colorGroups.map((group) => (
        <div key={group.label} className="customizer-section">
          <div className="customizer-label">{group.label}</div>
          <div className="color-grid">
            {group.keys.map(({ key, label }) => {
              const value = customTheme.colors[key];
              // Only show color picker for valid hex colors
              if (typeof value !== 'string') return null;
              return (
                <div key={key} className="color-field">
                  <label className="color-field-label">{label}</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      className="color-picker"
                      value={toHex(value)}
                      onChange={(e) => updateCustomThemeColor(key, e.target.value)}
                    />
                    <input
                      type="text"
                      className="color-hex"
                      value={value}
                      onChange={(e) => updateCustomThemeColor(key, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Category colors (bar colors) */}
      <div className="customizer-section">
        <div className="customizer-label">Bar Colors</div>
        <div className="category-colors">
          {customTheme.colors.categories.map((color, i) => (
            <div key={i} className="category-color-item">
              <input
                type="color"
                className="color-picker"
                value={toHex(color)}
                onChange={(e) => updateCustomThemeCategoryColor(i, e.target.value)}
              />
              <span className="category-index">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Convert any CSS color string to a hex value for the color input */
function toHex(color: string): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return color;
  // Fallback for rgba/named colors
  try {
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return '#000000';
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#000000';
    ctx.fillStyle = color;
    const result = ctx.fillStyle;
    return result.startsWith('#') ? result : '#000000';
  } catch {
    return '#000000';
  }
}
