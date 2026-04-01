'use client';

import { create } from 'zustand';
import {
  MapMarker,
  MapConnection,
  MapRegionStyle,
  MapProjection,
  MapStylePreset,
  MapStyleConfig,
  MapViewState,
} from './map-types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

interface MapState {
  // Project metadata
  title: string;
  subtitle: string;

  // View
  projection: MapProjection;
  view: MapViewState;
  style: MapStylePreset;
  customStyle: Partial<MapStyleConfig>;

  // Data
  markers: MapMarker[];
  connections: MapConnection[];
  regionStyles: MapRegionStyle[];

  // Display options
  showGraticule: boolean;
  showBorders: boolean;
  width: number;
  height: number;

  // UI state
  selectedMarkerId: string | null;
  editingMarkerId: string | null;
  searchQuery: string;
  sidebarTab: 'markers' | 'connections' | 'regions' | 'style';

  // Actions - View
  setProjection: (p: MapProjection) => void;
  setView: (v: Partial<MapViewState>) => void;
  setStyle: (s: MapStylePreset) => void;
  updateCustomStyle: (overrides: Partial<MapStyleConfig>) => void;
  setShowGraticule: (v: boolean) => void;
  setShowBorders: (v: boolean) => void;
  setDimensions: (w: number, h: number) => void;

  // Actions - Metadata
  setTitle: (t: string) => void;
  setSubtitle: (s: string) => void;

  // Actions - Markers
  addMarker: (marker: Omit<MapMarker, 'id'>) => void;
  updateMarker: (id: string, updates: Partial<MapMarker>) => void;
  removeMarker: (id: string) => void;
  setSelectedMarker: (id: string | null) => void;
  setEditingMarker: (id: string | null) => void;

  // Actions - Connections
  addConnection: (conn: Omit<MapConnection, 'id'>) => void;
  updateConnection: (id: string, updates: Partial<MapConnection>) => void;
  removeConnection: (id: string) => void;

  // Actions - Region styles
  setRegionStyle: (rs: MapRegionStyle) => void;
  removeRegionStyle: (regionId: string) => void;

  // Actions - UI
  setSearchQuery: (q: string) => void;
  setSidebarTab: (tab: MapState['sidebarTab']) => void;

  // Actions - Project
  clearMap: () => void;
}

const defaultView: MapViewState = {
  center: [0, 20],
  zoom: 1,
  rotation: [0, -20, 0],
};

export const useMapStore = create<MapState>((set) => ({
  title: '',
  subtitle: '',
  projection: 'geoEqualEarth',
  view: defaultView,
  style: 'dark-network',
  customStyle: {},
  markers: [],
  connections: [],
  regionStyles: [],
  showGraticule: false,
  showBorders: true,
  width: 1200,
  height: 700,
  selectedMarkerId: null,
  editingMarkerId: null,
  searchQuery: '',
  sidebarTab: 'markers',

  setProjection: (projection) => set({ projection }),
  setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
  setStyle: (style) => set({ style }),
  updateCustomStyle: (overrides) =>
    set((s) => ({ customStyle: { ...s.customStyle, ...overrides } })),
  setShowGraticule: (showGraticule) => set({ showGraticule }),
  setShowBorders: (showBorders) => set({ showBorders }),
  setDimensions: (width, height) => set({ width, height }),

  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),

  addMarker: (marker) =>
    set((s) => ({ markers: [...s.markers, { ...marker, id: generateId() }] })),
  updateMarker: (id, updates) =>
    set((s) => ({
      markers: s.markers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMarker: (id) =>
    set((s) => ({
      markers: s.markers.filter((m) => m.id !== id),
      connections: s.connections.filter(
        (c) => c.fromMarkerId !== id && c.toMarkerId !== id
      ),
      selectedMarkerId: s.selectedMarkerId === id ? null : s.selectedMarkerId,
      editingMarkerId: s.editingMarkerId === id ? null : s.editingMarkerId,
    })),
  setSelectedMarker: (id) => set({ selectedMarkerId: id }),
  setEditingMarker: (id) => set({ editingMarkerId: id }),

  addConnection: (conn) =>
    set((s) => ({ connections: [...s.connections, { ...conn, id: generateId() }] })),
  updateConnection: (id, updates) =>
    set((s) => ({
      connections: s.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  removeConnection: (id) =>
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),

  setRegionStyle: (rs) =>
    set((s) => {
      const existing = s.regionStyles.findIndex((r) => r.regionId === rs.regionId);
      if (existing >= 0) {
        const updated = [...s.regionStyles];
        updated[existing] = rs;
        return { regionStyles: updated };
      }
      return { regionStyles: [...s.regionStyles, rs] };
    }),
  removeRegionStyle: (regionId) =>
    set((s) => ({
      regionStyles: s.regionStyles.filter((r) => r.regionId !== regionId),
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),

  clearMap: () =>
    set({
      title: '',
      subtitle: '',
      markers: [],
      connections: [],
      regionStyles: [],
      view: defaultView,
      selectedMarkerId: null,
      editingMarkerId: null,
    }),
}));
