'use client';

import { create } from 'zustand';
import { TimelineItem, TimelineSettings, ViewMode, ThemeName, ThemeConfig, ThemeColors, EventLine } from './types';
import { generateId } from './utils';
import { defaultCustomTheme, themes } from './themes';

// ── Undo / Redo history ──
interface HistorySnapshot {
  items: TimelineItem[];
  settings: TimelineSettings;
}

const MAX_HISTORY = 50;
let _undoStack: HistorySnapshot[] = [];
let _redoStack: HistorySnapshot[] = [];
let _skipSnapshot = false;

function pushSnapshot(state: { items: TimelineItem[]; settings: TimelineSettings }) {
  if (_skipSnapshot) return;
  _undoStack.push({
    items: JSON.parse(JSON.stringify(state.items)),
    settings: JSON.parse(JSON.stringify(state.settings)),
  });
  if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
  _redoStack = []; // new action clears redo
}

interface TimelineState {
  // Data
  items: TimelineItem[];
  settings: TimelineSettings;
  selectedItemId: string | null;
  editingItemId: string | null;

  // Custom theme
  customTheme: ThemeConfig;
  showThemeCustomizer: boolean;

  // Actions - Items
  addItem: (item: Omit<TimelineItem, 'id'>) => void;
  duplicateItem: (id: string) => string | null;
  updateItem: (id: string, updates: Partial<TimelineItem>) => void;
  removeItem: (id: string) => void;
  setSelectedItem: (id: string | null) => void;
  setEditingItem: (id: string | null) => void;

  // Actions - Settings
  updateSettings: (updates: Partial<TimelineSettings>) => void;
  setView: (view: ViewMode) => void;
  setTheme: (theme: ThemeName) => void;

  // Actions - Custom Theme
  setShowThemeCustomizer: (show: boolean) => void;
  updateCustomThemeColor: (key: keyof ThemeColors, value: string) => void;
  updateCustomThemeCategoryColor: (index: number, value: string) => void;
  updateCustomThemeFont: (key: 'fontFamily' | 'headingFont', value: string) => void;
  initCustomThemeFrom: (themeName: string) => void;

  // Actions - Event Lines
  addEventLine: (line: Omit<EventLine, 'id'>) => void;
  updateEventLine: (id: string, updates: Partial<EventLine>) => void;
  removeEventLine: (id: string) => void;

  // Actions - Rows
  addRow: (label: string) => void;
  removeRow: (index: number) => void;
  renameRow: (index: number, label: string) => void;
  moveRow: (index: number, direction: 'up' | 'down') => void;

  // Actions - Project
  loadProject: (items: TimelineItem[], settings: TimelineSettings) => void;
  clearProject: () => void;

  // Actions - Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Batch drag: call before dragging to snapshot once, skip during drag */
  beginDrag: () => void;
  endDrag: () => void;
}

const defaultSettings: TimelineSettings = {
  view: 'quarterly',
  theme: 'corporate',
  title: 'Project Roadmap',
  subtitle: '2025 - 2026',
  startDate: '2025-01-01',
  endDate: '2026-06-30',
  showGrid: true,
  showLabels: true,
  showTodayMarker: true,
  showProgress: false,
  rowLabels: ['Strategy', 'Design', 'Development', 'Launch'],
  eventLines: [],
};

export const useTimelineStore = create<TimelineState>((set) => ({
  items: [],
  settings: defaultSettings,
  selectedItemId: null,
  editingItemId: null,
  customTheme: defaultCustomTheme,
  showThemeCustomizer: false,

  addItem: (item) =>
    set((state) => {
      pushSnapshot(state);
      return { items: [...state.items, { ...item, id: generateId() }] };
    }),

  duplicateItem: (id) => {
    const state = useTimelineStore.getState();
    const source = state.items.find((i) => i.id === id);
    if (!source) return null;
    pushSnapshot(state);
    const newId = generateId();
    const clone = { ...source, id: newId, label: source.label + ' (copy)' };
    set({ items: [...state.items, clone] });
    return newId;
  },

  updateItem: (id, updates) =>
    set((state) => {
      pushSnapshot(state);
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      };
    }),

  removeItem: (id) =>
    set((state) => {
      pushSnapshot(state);
      return {
        items: state.items.filter((item) => item.id !== id),
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        editingItemId: state.editingItemId === id ? null : state.editingItemId,
      };
    }),

  setSelectedItem: (id) => set({ selectedItemId: id }),
  setEditingItem: (id) => set({ editingItemId: id }),

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  setView: (view) =>
    set((state) => ({
      settings: { ...state.settings, view },
    })),

  setTheme: (theme) =>
    set((state) => ({
      settings: { ...state.settings, theme },
    })),

  setShowThemeCustomizer: (show) => set({ showThemeCustomizer: show }),

  updateCustomThemeColor: (key, value) =>
    set((state) => ({
      customTheme: {
        ...state.customTheme,
        colors: { ...state.customTheme.colors, [key]: value },
      },
      settings: { ...state.settings, theme: 'custom' as ThemeName },
    })),

  updateCustomThemeCategoryColor: (index, value) =>
    set((state) => {
      const cats = [...state.customTheme.colors.categories];
      cats[index] = value;
      return {
        customTheme: {
          ...state.customTheme,
          colors: { ...state.customTheme.colors, categories: cats },
        },
        settings: { ...state.settings, theme: 'custom' as ThemeName },
      };
    }),

  updateCustomThemeFont: (key, value) =>
    set((state) => ({
      customTheme: {
        ...state.customTheme,
        [key]: value,
      },
      settings: { ...state.settings, theme: 'custom' as ThemeName },
    })),

  initCustomThemeFrom: (themeName) =>
    set((state) => {
      const base = themes[themeName] || themes.corporate;
      return {
        customTheme: {
          ...base,
          name: 'custom',
          label: 'Custom',
          description: `Based on ${base.label}`,
          colors: { ...base.colors, categories: [...base.colors.categories] },
          effects: { ...base.effects },
        },
        settings: { ...state.settings, theme: 'custom' as ThemeName },
      };
    }),

  addEventLine: (line) =>
    set((state) => ({
      settings: {
        ...state.settings,
        eventLines: [...(state.settings.eventLines || []), { ...line, id: generateId() }],
      },
    })),
  updateEventLine: (id, updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        eventLines: (state.settings.eventLines || []).map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      },
    })),
  removeEventLine: (id) =>
    set((state) => ({
      settings: {
        ...state.settings,
        eventLines: (state.settings.eventLines || []).filter((l) => l.id !== id),
      },
    })),

  addRow: (label) =>
    set((state) => {
      pushSnapshot(state);
      return {
        settings: {
          ...state.settings,
          rowLabels: [...state.settings.rowLabels, label],
        },
      };
    }),

  removeRow: (index) =>
    set((state) => {
      pushSnapshot(state);
      const newLabels = state.settings.rowLabels.filter((_, i) => i !== index);
      const newItems = state.items
        .filter((item) => item.row !== index)
        .map((item) => ({
          ...item,
          row: item.row > index ? item.row - 1 : item.row,
        }));
      return {
        settings: { ...state.settings, rowLabels: newLabels },
        items: newItems,
      };
    }),

  renameRow: (index, label) =>
    set((state) => {
      const newLabels = [...state.settings.rowLabels];
      newLabels[index] = label;
      return { settings: { ...state.settings, rowLabels: newLabels } };
    }),

  moveRow: (index, direction) =>
    set((state) => {
      const labels = [...state.settings.rowLabels];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= labels.length) return state;
      // Swap labels
      [labels[index], labels[target]] = [labels[target], labels[index]];
      // Swap item row indices
      const newItems = state.items.map((item) => {
        if (item.row === index) return { ...item, row: target };
        if (item.row === target) return { ...item, row: index };
        return item;
      });
      return {
        settings: { ...state.settings, rowLabels: labels },
        items: newItems,
      };
    }),

  loadProject: (items, settings) => {
    const state = useTimelineStore.getState();
    pushSnapshot(state);
    set({ items, settings, selectedItemId: null, editingItemId: null });
  },

  clearProject: () => {
    const state = useTimelineStore.getState();
    pushSnapshot(state);
    set({
      items: [],
      settings: defaultSettings,
      selectedItemId: null,
      editingItemId: null,
    });
  },

  // ── Undo / Redo ──
  undo: () => {
    if (_undoStack.length === 0) return;
    const state = useTimelineStore.getState();
    _redoStack.push({
      items: JSON.parse(JSON.stringify(state.items)),
      settings: JSON.parse(JSON.stringify(state.settings)),
    });
    const snapshot = _undoStack.pop()!;
    _skipSnapshot = true;
    set({ items: snapshot.items, settings: snapshot.settings, selectedItemId: null });
    _skipSnapshot = false;
  },

  redo: () => {
    if (_redoStack.length === 0) return;
    const state = useTimelineStore.getState();
    _undoStack.push({
      items: JSON.parse(JSON.stringify(state.items)),
      settings: JSON.parse(JSON.stringify(state.settings)),
    });
    const snapshot = _redoStack.pop()!;
    _skipSnapshot = true;
    set({ items: snapshot.items, settings: snapshot.settings, selectedItemId: null });
    _skipSnapshot = false;
  },

  canUndo: () => _undoStack.length > 0,
  canRedo: () => _redoStack.length > 0,

  beginDrag: () => {
    // Snapshot once at start of drag, then suppress during drag moves
    const state = useTimelineStore.getState();
    pushSnapshot(state);
    _skipSnapshot = true;
  },
  endDrag: () => {
    _skipSnapshot = false;
  },
}));
