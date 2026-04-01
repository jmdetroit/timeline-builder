'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Globe,
  Search,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  Grid3X3,
  Maximize2,
  Map as MapIcon,
  Home,
} from 'lucide-react';
import { useMapStore } from '@/lib/map-store';
import { mapStyles } from '@/lib/map-styles';
import { MapProjection, MapStylePreset, GeocodingResult } from '@/lib/map-types';
import { exportMapAsSvg, exportMapAsPng } from '@/lib/map-export';

const projections: { value: MapProjection; label: string }[] = [
  { value: 'geoEqualEarth', label: 'Equal Earth' },
  { value: 'geoMercator', label: 'Mercator' },
  { value: 'geoNaturalEarth1', label: 'Natural Earth' },
  { value: 'geoOrthographic', label: 'Globe' },
  { value: 'geoAlbersUsa', label: 'Albers USA' },
];

export default function MapToolbar() {
  const {
    projection, setProjection,
    style, setStyle,
    view, setView,
    showGraticule, setShowGraticule,
    showBorders, setShowBorders,
    clearMap,
  } = useMapStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6`,
        { headers: { 'User-Agent': 'TimelineBuilder-MapTool/1.0' } }
      );
      const data = await res.json();
      setSearchResults(
        data.map((r: any) => ({
          placeId: r.place_id,
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          type: r.type,
          boundingBox: r.boundingbox?.map(Number) || [0, 0, 0, 0],
        }))
      );
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  const onSearchInput = (val: string) => {
    setSearchText(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(val), 500);
  };

  const selectResult = (result: GeocodingResult) => {
    // Calculate zoom based on bounding box size
    const [south, north, west, east] = result.boundingBox;
    const latSpan = Math.abs(north - south);
    const lonSpan = Math.abs(east - west);
    const span = Math.max(latSpan, lonSpan);
    let zoom = 1;
    if (span < 0.1) zoom = 12;
    else if (span < 0.5) zoom = 8;
    else if (span < 2) zoom = 6;
    else if (span < 10) zoom = 4;
    else if (span < 40) zoom = 3;
    else if (span < 90) zoom = 2;

    setView({ center: [result.lon, result.lat], zoom });
    setSearchOpen(false);
    setSearchText('');
    setSearchResults([]);
  };

  const zoomIn = () => setView({ zoom: Math.min(view.zoom * 1.5, 20) });
  const zoomOut = () => setView({ zoom: Math.max(view.zoom / 1.5, 1) });
  const resetView = () => setView({ center: [0, 20], zoom: 1 });

  return (
    <div className="map-toolbar">
      <div className="map-toolbar-group">
        <a href="/" className="map-toolbar-btn" title="Timeline Builder">
          <Home size={16} />
        </a>
        <span className="map-toolbar-label">MAP BUILDER</span>
      </div>

      {/* Search */}
      <div className="map-toolbar-group" style={{ position: 'relative' }}>
        <button
          className={`map-toolbar-btn ${searchOpen ? 'active' : ''}`}
          onClick={() => setSearchOpen(!searchOpen)}
          title="Search location"
        >
          <Search size={16} />
        </button>
        {searchOpen && (
          <div className="map-dropdown map-search-dropdown">
            <input
              type="text"
              placeholder="Search city, country..."
              value={searchText}
              onChange={(e) => onSearchInput(e.target.value)}
              autoFocus
              className="map-search-input"
            />
            {searching && <div className="map-search-loading">Searching...</div>}
            {searchResults.map((r) => (
              <button
                key={r.placeId}
                className="map-search-result"
                onClick={() => selectResult(r)}
              >
                <span className="map-search-result-name">
                  {r.displayName.split(',').slice(0, 2).join(',')}
                </span>
                <span className="map-search-result-detail">
                  {r.displayName.split(',').slice(2, 4).join(',')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom */}
      <div className="map-toolbar-group">
        <button className="map-toolbar-btn" onClick={zoomOut} title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <span className="map-toolbar-zoom">{Math.round(view.zoom * 100)}%</span>
        <button className="map-toolbar-btn" onClick={zoomIn} title="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button className="map-toolbar-btn" onClick={resetView} title="Reset view">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Projection */}
      <div className="map-toolbar-group" style={{ position: 'relative' }}>
        <button
          className="map-toolbar-btn"
          onClick={() => { setProjOpen(!projOpen); setStyleOpen(false); setExportOpen(false); }}
          title="Projection"
        >
          <Globe size={16} />
          <span className="map-toolbar-btn-label">
            {projections.find((p) => p.value === projection)?.label}
          </span>
        </button>
        {projOpen && (
          <div className="map-dropdown">
            {projections.map((p) => (
              <button
                key={p.value}
                className={`map-dropdown-item ${projection === p.value ? 'active' : ''}`}
                onClick={() => { setProjection(p.value); setProjOpen(false); }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Style */}
      <div className="map-toolbar-group" style={{ position: 'relative' }}>
        <button
          className="map-toolbar-btn"
          onClick={() => { setStyleOpen(!styleOpen); setProjOpen(false); setExportOpen(false); }}
          title="Map style"
        >
          <MapIcon size={16} />
          <span className="map-toolbar-btn-label">{mapStyles[style]?.label}</span>
        </button>
        {styleOpen && (
          <div className="map-dropdown">
            {Object.entries(mapStyles).map(([key, ms]) => (
              <button
                key={key}
                className={`map-dropdown-item ${style === key ? 'active' : ''}`}
                onClick={() => { setStyle(key as MapStylePreset); setStyleOpen(false); }}
              >
                <span
                  className="map-style-swatch"
                  style={{ background: ms.backgroundColor, border: `2px solid ${ms.landStroke}` }}
                />
                {ms.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Display toggles */}
      <div className="map-toolbar-group">
        <button
          className={`map-toolbar-btn ${showGraticule ? 'active' : ''}`}
          onClick={() => setShowGraticule(!showGraticule)}
          title="Toggle graticule grid"
        >
          <Grid3X3 size={16} />
        </button>
        <button
          className={`map-toolbar-btn ${showBorders ? 'active' : ''}`}
          onClick={() => setShowBorders(!showBorders)}
          title="Toggle borders"
        >
          <Globe size={16} />
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Export */}
      <div className="map-toolbar-group" style={{ position: 'relative' }}>
        <button
          className="map-toolbar-btn map-toolbar-btn-primary"
          onClick={() => { setExportOpen(!exportOpen); setStyleOpen(false); setProjOpen(false); }}
        >
          <Download size={16} />
          <span className="map-toolbar-btn-label">Export</span>
        </button>
        {exportOpen && (
          <div className="map-dropdown map-dropdown-right">
            <button
              className="map-dropdown-item"
              onClick={() => { exportMapAsSvg(); setExportOpen(false); }}
            >
              Export SVG
            </button>
            <button
              className="map-dropdown-item"
              onClick={() => { exportMapAsPng(); setExportOpen(false); }}
            >
              Export PNG (2x)
            </button>
          </div>
        )}
      </div>

      {/* Clear */}
      <div className="map-toolbar-group">
        <button className="map-toolbar-btn map-toolbar-btn-danger" onClick={clearMap} title="Clear map">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
