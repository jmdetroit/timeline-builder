'use client';

import { TimelineItem, TimelineSettings, ThemeConfig, TimelineProject } from './types';

const STORAGE_KEY = 'timeline-builder-project';
const CUSTOM_THEME_KEY = 'timeline-builder-custom-theme';
const PROJECTS_KEY = 'timeline-builder-saved-projects';
const ACTIVE_PROJECT_KEY = 'timeline-builder-active-project-id';

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
      return { items: data.items, settings: migrateSettings(data.settings) };
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

// ============================================================
// Multi-project storage
// ============================================================

function generateProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function migrateSettings(settings: TimelineSettings): TimelineSettings {
  return {
    ...settings,
    eventLines: settings.eventLines || [],
    showTodayMarker: settings.showTodayMarker ?? true,
    showProgress: settings.showProgress ?? false,
    zoom: settings.zoom ?? 1,
    layoutMode: settings.layoutMode ?? 'default',
  };
}

/**
 * Get all saved projects
 */
export function getSavedProjects(): TimelineProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const projects: TimelineProject[] = JSON.parse(raw);
    // Migrate settings on read
    return projects.map((p) => ({ ...p, settings: migrateSettings(p.settings) }));
  } catch (err) {
    console.warn('Failed to load saved projects:', err);
    return [];
  }
}

/**
 * Save a new project (returns the new project)
 */
export function saveNewProject(
  name: string,
  items: TimelineItem[],
  settings: TimelineSettings
): TimelineProject {
  const project: TimelineProject = {
    id: generateProjectId(),
    name,
    items,
    settings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const projects = getSavedProjects();
  projects.unshift(project);
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  } catch (err) {
    console.warn('Failed to save new project:', err);
  }
  return project;
}

/**
 * Update an existing saved project
 */
export function updateSavedProject(
  id: string,
  items: TimelineItem[],
  settings: TimelineSettings,
  name?: string
): void {
  const projects = getSavedProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  projects[idx] = {
    ...projects[idx],
    items,
    settings,
    updatedAt: new Date().toISOString(),
    ...(name !== undefined ? { name } : {}),
  };
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn('Failed to update project:', err);
  }
}

/**
 * Rename a saved project
 */
export function renameSavedProject(id: string, name: string): void {
  const projects = getSavedProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  projects[idx] = { ...projects[idx], name, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn('Failed to rename project:', err);
  }
}

/**
 * Delete a saved project
 */
export function deleteSavedProject(id: string): void {
  const projects = getSavedProjects().filter((p) => p.id !== id);
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    // Clear active if it was the deleted one
    if (getActiveProjectId() === id) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  } catch (err) {
    console.warn('Failed to delete project:', err);
  }
}

/**
 * Get active project ID
 */
export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  } catch {
    return null;
  }
}

/**
 * Set active project ID
 */
export function setActiveProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  } catch (err) {
    console.warn('Failed to set active project ID:', err);
  }
}
