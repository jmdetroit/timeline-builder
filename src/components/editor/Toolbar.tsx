'use client';

import React, { useRef, useState } from 'react';
import { useTimelineStore } from '@/lib/store';
import { themes } from '@/lib/themes';
import { ViewMode, ThemeName } from '@/lib/types';
import { exportTimelineSvg, downloadSvg, exportTimelinePng, exportProjectAsJson, downloadJson, importProjectFromJson } from '@/lib/export';
import { templates } from '@/lib/sample-data';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Palette,
  Download,
  Upload,
  FileJson,
  Image,
  FileCode,
  LayoutTemplate,
  Trash2,
  Pipette,
  ChevronDown,
} from 'lucide-react';

interface ToolbarProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export default function Toolbar({ timelineRef, svgRef }: ToolbarProps) {
  const settings = useTimelineStore((s) => s.settings);
  const items = useTimelineStore((s) => s.items);
  const setView = useTimelineStore((s) => s.setView);
  const setTheme = useTimelineStore((s) => s.setTheme);
  const loadProject = useTimelineStore((s) => s.loadProject);
  const clearProject = useTimelineStore((s) => s.clearProject);
  const showThemeCustomizer = useTimelineStore((s) => s.showThemeCustomizer);
  const setShowThemeCustomizer = useTimelineStore((s) => s.setShowThemeCustomizer);

  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const viewOptions: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'monthly', label: 'Monthly', icon: <CalendarDays size={14} /> },
    { value: 'quarterly', label: 'Quarterly', icon: <CalendarRange size={14} /> },
    { value: 'yearly', label: 'Yearly', icon: <Calendar size={14} /> },
  ];

  const classicThemes = Object.values(themes).filter((t) => t.category === 'classic');
  const stylisticThemes = Object.values(themes).filter((t) => t.category === 'stylistic');

  // Get current theme info for the dropdown button
  const currentTheme = themes[settings.theme];
  const currentLabel = settings.theme === 'custom' ? 'Custom' : currentTheme?.label || settings.theme;
  const currentColor = settings.theme === 'custom'
    ? '#888'
    : currentTheme?.colors.primary || '#888';

  const slugTitle = settings.title.toLowerCase().replace(/\s+/g, '-');

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    try {
      const svgString = exportTimelineSvg(svgRef.current);
      downloadSvg(svgString, `${slugTitle}.svg`);
    } catch (err) {
      console.error('SVG export failed:', err);
    }
    setShowExport(false);
  };

  const handleExportPng = async () => {
    if (!timelineRef.current) return;
    try {
      const themeObj = themes[settings.theme];
      const bg = themeObj?.colors.background || '#FFFFFF';
      await exportTimelinePng(timelineRef.current, { scale: 2, backgroundColor: bg });
    } catch (err) {
      console.error('PNG export failed:', err);
    }
    setShowExport(false);
  };

  const handleExportJson = () => {
    const json = exportProjectAsJson(items, settings);
    downloadJson(json, `timeline-${settings.title.toLowerCase().replace(/\s+/g, '-')}.json`);
    setShowExport(false);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProjectFromJson(reader.result as string);
      if (result) loadProject(result.items, result.settings);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadTemplate = (key: string) => {
    const template = templates[key as keyof typeof templates];
    if (template) loadProject(template.items, template.settings);
    setShowTemplates(false);
  };

  return (
    <div className="toolbar">
      {/* View switcher */}
      <div className="toolbar-group">
        <span className="toolbar-label">View</span>
        <div className="toolbar-buttons">
          {viewOptions.map((opt) => (
            <button
              key={opt.value}
              className={`toolbar-btn ${settings.view === opt.value ? 'active' : ''}`}
              onClick={() => setView(opt.value)}
              title={opt.label}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme dropdown */}
      <div className="toolbar-group relative">
        <span className="toolbar-label">Theme</span>
        <button
          className="toolbar-btn theme-dropdown-trigger"
          onClick={() => setShowThemeDropdown(!showThemeDropdown)}
        >
          <span className="theme-dot" style={{ backgroundColor: currentColor }} />
          <span>{currentLabel}</span>
          <ChevronDown size={12} />
        </button>

        {showThemeDropdown && (
          <div className="dropdown-menu theme-menu" onClick={() => setShowThemeDropdown(false)}>
            <div className="dropdown-section-label">Classic</div>
            {classicThemes.map((t) => (
              <button
                key={t.name}
                className={`dropdown-item ${settings.theme === t.name ? 'active' : ''}`}
                onClick={() => setTheme(t.name as ThemeName)}
              >
                <span className="theme-dot" style={{ backgroundColor: t.colors.primary }} />
                <span>{t.label}</span>
                <span className="dropdown-item-desc">{t.description}</span>
              </button>
            ))}
            <div className="dropdown-divider" />
            <div className="dropdown-section-label">Stylistic</div>
            {stylisticThemes.map((t) => (
              <button
                key={t.name}
                className={`dropdown-item ${settings.theme === t.name ? 'active' : ''}`}
                onClick={() => setTheme(t.name as ThemeName)}
              >
                <span className="theme-dot" style={{ backgroundColor: t.colors.primary }} />
                <span>{t.label}</span>
                <span className="dropdown-item-desc">{t.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customize button */}
      <button
        className={`toolbar-btn ${showThemeCustomizer ? 'active' : ''}`}
        onClick={() => setShowThemeCustomizer(!showThemeCustomizer)}
        title="Customize theme colors"
      >
        <Pipette size={14} />
        <span>Customize</span>
      </button>

      {/* Templates */}
      <div className="toolbar-group relative">
        <button
          className="toolbar-btn"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          <LayoutTemplate size={14} />
          <span>Templates</span>
        </button>
        {showTemplates && (
          <div className="dropdown-menu">
            {Object.entries(templates).map(([key, tmpl]) => (
              <button
                key={key}
                className="dropdown-item"
                onClick={() => handleLoadTemplate(key)}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-spacer" />

      {/* Import */}
      <button
        className="toolbar-btn"
        onClick={() => fileInputRef.current?.click()}
        title="Import JSON"
      >
        <Upload size={14} />
        <span>Import</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJson}
      />

      {/* Export */}
      <div className="toolbar-group relative">
        <button
          className="toolbar-btn primary"
          onClick={() => setShowExport(!showExport)}
        >
          <Download size={14} />
          <span>Export</span>
        </button>
        {showExport && (
          <div className="dropdown-menu right">
            <button className="dropdown-item" onClick={handleExportSvg}>
              <FileCode size={14} />
              Export as SVG
            </button>
            <button className="dropdown-item" onClick={handleExportPng}>
              <Image size={14} />
              Export as PNG (2x)
            </button>
            <button className="dropdown-item" onClick={handleExportJson}>
              <FileJson size={14} />
              Export as JSON
            </button>
          </div>
        )}
      </div>

      {/* Clear */}
      <button
        className="toolbar-btn danger"
        onClick={clearProject}
        title="Clear all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
