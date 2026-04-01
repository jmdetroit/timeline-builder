'use client';

import React, { useRef, useState } from 'react';
import { useTimelineStore } from '@/lib/store';
import { themes } from '@/lib/themes';
import { ViewMode, ThemeName, TimelineItem, TimelineSettings } from '@/lib/types';
import { exportTimelineSvg, downloadSvg, exportTimelinePng, exportProjectAsJson, downloadJson, importProjectFromJson, exportProjectAsCsv, downloadCsv, generateCsvTemplate, importProjectFromCsv } from '@/lib/export';
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
  FileSpreadsheet,
  LayoutTemplate,
  Trash2,
  Pipette,
  ChevronDown,
  Globe,
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
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [showImport, setShowImport] = useState(false);

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

  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmAction({ message, onConfirm });
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    showConfirm('Export timeline as SVG?', () => {
      try {
        const svgString = exportTimelineSvg(svgRef.current!);
        downloadSvg(svgString, `${slugTitle}.svg`);
      } catch (err) {
        console.error('SVG export failed:', err);
      }
    });
    setShowExport(false);
  };

  const handleExportPng = () => {
    if (!timelineRef.current) return;
    showConfirm('Export timeline as PNG (2x)?', async () => {
      try {
        const themeObj = themes[settings.theme];
        const bg = themeObj?.colors.background || '#FFFFFF';
        await exportTimelinePng(timelineRef.current!, { scale: 2, backgroundColor: bg });
      } catch (err) {
        console.error('PNG export failed:', err);
      }
    });
    setShowExport(false);
  };

  const handleExportJson = () => {
    showConfirm('Export timeline as JSON?', () => {
      const json = exportProjectAsJson(items, settings);
      downloadJson(json, `timeline-${slugTitle}.json`);
    });
    setShowExport(false);
  };

  const handleExportCsv = () => {
    showConfirm('Export timeline as CSV?', () => {
      const csv = exportProjectAsCsv(items, settings);
      downloadCsv(csv, `${slugTitle}.csv`);
    });
    setShowExport(false);
  };

  const handleDownloadCsvTemplate = () => {
    const csv = generateCsvTemplate();
    downloadCsv(csv, 'timeline-template.csv');
    setShowImport(false);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      showConfirm(`Import "${file.name}"? This will replace your current timeline.`, () => {
        const result = importProjectFromCsv(reader.result as string);
        if (result) {
          const newSettings: TimelineSettings = {
            view: (result.meta.view as TimelineSettings['view']) || 'quarterly',
            theme: (result.meta.theme as TimelineSettings['theme']) || 'corporate',
            title: result.meta.title || file.name.replace(/\.csv$/i, ''),
            subtitle: result.meta.subtitle || '',
            startDate: result.meta.startDate || '2025-01-01',
            endDate: result.meta.endDate || '2026-06-30',
            showGrid: true,
            showLabels: true,
            showTodayMarker: true,
            rowLabels: result.rowLabels,
            eventLines: [],
          };
          const itemsWithIds = result.items.map((item, i) => ({
            ...item,
            id: `csv-${Date.now()}-${i}`,
          }));
          loadProject(itemsWithIds as TimelineItem[], newSettings);
        }
      });
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowImport(false);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      showConfirm(`Import "${file.name}"? This will replace your current timeline.`, () => {
        const result = importProjectFromJson(reader.result as string);
        if (result) loadProject(result.items, result.settings);
      });
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowImport(false);
  };

  const handleLoadTemplate = (key: string) => {
    const template = templates[key as keyof typeof templates];
    if (template) {
      showConfirm(`Load template "${template.name}"? This will replace your current timeline.`, () => {
        loadProject(template.items, template.settings);
      });
    }
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
      <div className="toolbar-group relative">
        <button
          className="toolbar-btn"
          onClick={() => setShowImport(!showImport)}
        >
          <Upload size={14} />
          <span>Import</span>
        </button>
        {showImport && (
          <div className="dropdown-menu right">
            <button className="dropdown-item" onClick={() => { fileInputRef.current?.click(); }}>
              <FileJson size={14} />
              Import JSON
            </button>
            <button className="dropdown-item" onClick={() => { csvFileInputRef.current?.click(); }}>
              <FileSpreadsheet size={14} />
              Import CSV
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={handleDownloadCsvTemplate}>
              <Download size={14} />
              Download CSV Template
            </button>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJson}
      />
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportCsv}
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
            <button className="dropdown-item" onClick={handleExportCsv}>
              <FileSpreadsheet size={14} />
              Export as CSV
            </button>
            <button className="dropdown-item" onClick={handleExportJson}>
              <FileJson size={14} />
              Export as JSON
            </button>
          </div>
        )}
      </div>

      {/* Map Builder */}
      <a
        href="/map"
        className="toolbar-btn"
        title="Map Builder"
        style={{ textDecoration: 'none' }}
      >
        <Globe size={14} />
      </a>

      {/* Clear */}
      <button
        className="toolbar-btn danger"
        onClick={() => showConfirm('Clear all items and reset the timeline? This cannot be undone.', clearProject)}
        title="Clear all"
      >
        <Trash2 size={14} />
      </button>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="confirm-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{confirmAction.message}</p>
            <div className="confirm-actions">
              <button
                className="confirm-btn cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn confirm"
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
