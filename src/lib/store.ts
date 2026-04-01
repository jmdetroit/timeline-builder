'use client';

import { create } from 'zustand';
import { TimelineItem, TimelineSettings, ViewMode, ThemeName, ThemeConfig, ThemeColors, EventLine } from './types';
import { generateId } from './utils';
import { defaultCustomTheme, themes } from './themes';

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
    set((state) => ({
      items: [...state.items, { ...item, id: generateId() }],
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
      editingItemId: state.editingItemId === id ? null : state.editingItemId,
    })),

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
    set((state) => ({
      settings: {
        ...state.settings,
        rowLabels: [...state.settings.rowLabels, label],
      },
    })),

  removeRow: (index) =>
    set((state) => {
      const newLabels = state.settings.rowLabels.filter((_, i) => i !== index);
      // Remove items in this row, shift items in higher rows down
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

  loadProject: (items, settings) => set({ items, settings, selectedItemId: null, editingItemId: null }),

  clearProject: () =>
    set({
      items: [],
      settings: defaultSettings,
      selectedItemId: null,
      editingItemId: null,
    }),
}));
