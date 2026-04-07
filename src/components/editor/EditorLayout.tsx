'use client';

import React, { useRef, useEffect, useState } from 'react';
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

  // ── Delete confirmation state ──
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // ── Keyboard shortcuts (Undo/Redo/Delete) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useTimelineStore.getState().undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        useTimelineStore.getState().redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useTimelineStore.getState();
        if (state.selectedItemId) {
          const item = state.items.find((i) => i.id === state.selectedItemId);
          if (item) {
            e.preventDefault();
            setDeleteConfirm({ id: item.id, label: item.label });
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">Delete &ldquo;{deleteConfirm.label}&rdquo;?</p>
            <div className="confirm-actions">
              <button
                className="confirm-btn cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn confirm"
                onClick={() => {
                  useTimelineStore.getState().removeItem(deleteConfirm.id);
                  useTimelineStore.getState().setSelectedItem(null);
                  setDeleteConfirm(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
