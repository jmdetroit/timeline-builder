'use client';

import { TimelineItem, TimelineSettings, ThemeConfig } from './types';

const STORAGE_KEY = 'timeline-builder-project';
const CUSTOM_THEME_KEY = 'timeline-builder-custom-theme';

interface StoredProject {
  version: string;
  items: TimelineItem[];
  settings: TimelineSettings;
  savedAt: string;
}

/**
 * Save current project to localStorage
 */
export function saveProject(items: TimelineItem[], settings: TimelineSettings): void {
  try {
    const data: StoredProject = {
      version: '1.0',
      items,
      settings,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save project to localStorage:', err);
  }
}

/**
 * Load project from localStorage
 */
export function loadSavedProject(): { items: TimelineItem[]; settings: TimelineSettings } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredProject = JSON.parse(raw);
    if (data.items && data.settings) {
      return { items: data.items, settings: data.settings };
    }
    return null;
  } catch (err) {
    console.warn('Failed to load project from localStorage:', err);
    return null;
  }
}

/**
 * Save custom theme to localStorage
 */
export function saveCustomTheme(theme: ThemeConfig): void {
  try {
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(theme));
  } catch (err) {
    console.warn('Failed to save custom theme:', err);
  }
}

/**
 * Load custom theme from localStorage
 */
export function loadCustomTheme(): ThemeConfig | null {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeConfig;
  } catch (err) {
    console.warn('Failed to load custom theme:', err);
    return null;
  }
}

/**
 * Check if a saved project exists
 */
export function hasSavedProject(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Clear saved project
 */
export function clearSavedProject(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_THEME_KEY);
  } catch (err) {
    console.warn('Failed to clear saved project:', err);
  }
}
