'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/lib/store';
import { sampleItems, sampleSettings } from '@/lib/sample-data';
import { saveProject, loadSavedProject, saveCustomTheme, loadCustomTheme } from '@/lib/storage';
import Toolbar from './Toolbar';
import FormPanel from './FormPanel';
import ThemeCustomizer from './ThemeCustomizer';
import TimelineRenderer from '../timeline/TimelineRenderer';

export default function EditorLayout() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const items = useTimelineStore((s) => s.items);
  const settings = useTimelineStore((s) => s.settings);
  const customTheme = useTimelineStore((s) => s.customTheme);
  const loadProject = useTimelineStore((s) => s.loadProject);
  const showThemeCustomizer = useTimelineStore((s) => s.showThemeCustomizer);
  const initialLoadDone = useRef(false);

  // ── Load saved project on mount ──
  useEffect(() => {
    const saved = loadSavedProject();
    if (saved && saved.items.length > 0) {
      loadProject(saved.items, saved.settings);
    } else {
      // Load sample data if nothing saved
      loadProject(sampleItems, sampleSettings);
    }

    // Load custom theme if saved
    const savedTheme = loadCustomTheme();
    if (savedTheme) {
      useTimelineStore.setState({ customTheme: savedTheme });
    }

    initialLoadDone.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save on changes (debounced) ──
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const timer = setTimeout(() => {
      saveProject(items, settings);
    }, 500);
    return () => clearTimeout(timer);
  }, [items, settings]);

  // ── Save custom theme on changes ──
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const timer = setTimeout(() => {
      saveCustomTheme(customTheme);
    }, 500);
    return () => clearTimeout(timer);
  }, [customTheme]);

  return (
    <div className="editor-layout">
      <Toolbar timelineRef={timelineRef} svgRef={svgRef} />
      <div className="editor-content">
        <div className="editor-sidebar">
          <FormPanel />
        </div>
        {showThemeCustomizer && (
          <div className="editor-customizer">
            <ThemeCustomizer />
          </div>
        )}
        <div className="editor-canvas" ref={timelineRef}>
          <div className="canvas-inner">
            <TimelineRenderer svgRef={svgRef} />
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className="autosave-indicator">
        Auto-saved
      </div>
    </div>
  );
}
