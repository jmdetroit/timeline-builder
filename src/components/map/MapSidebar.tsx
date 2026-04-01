'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Link2,
  Palette,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Type,
} from 'lucide-react';
import { useMapStore } from '@/lib/map-store';
import { getMapStyle } from '@/lib/map-styles';
import { MarkerShape, MapPattern } from '@/lib/map-types';

const markerShapes: { value: MarkerShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'pin', label: 'Pin' },
  { value: 'square', label: 'Square' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'star', label: 'Star' },
];

const defaultColors = [
  '#00D4FF', '#FF3366', '#00FF88', '#FFAA00', '#FF00FF',
  '#4A6CF7', '#E84393', '#00B894', '#F39C12', '#6C5CE7',
];

export default function MapSidebar() {
  const {
    sidebarTab, setSidebarTab,
    markers, addMarker, updateMarker, removeMarker,
    selectedMarkerId, setSelectedMarker, editingMarkerId, setEditingMarker,
    connections, addConnection, updateConnection, removeConnection,
    title, subtitle, setTitle, setSubtitle,
    style, customStyle, updateCustomStyle,
  } = useMapStore();

  const mapStyle = getMapStyle(style, customStyle);

  return (
    <div className="map-sidebar">
      {/* Tab bar */}
      <div className="map-sidebar-tabs">
        <button
          className={`map-sidebar-tab ${sidebarTab === 'markers' ? 'active' : ''}`}
          onClick={() => setSidebarTab('markers')}
          title="Markers"
        >
          <MapPin size={16} />
          <span>Points</span>
        </button>
        <button
          className={`map-sidebar-tab ${sidebarTab === 'connections' ? 'active' : ''}`}
          onClick={() => setSidebarTab('connections')}
          title="Connections"
        >
          <Link2 size={16} />
          <span>Lines</span>
        </button>
        <button
          className={`map-sidebar-tab ${sidebarTab === 'style' ? 'active' : ''}`}
          onClick={() => setSidebarTab('style')}
          title="Settings"
        >
          <Palette size={16} />
          <span>Style</span>
        </button>
      </div>

      <div className="map-sidebar-content">
        {sidebarTab === 'markers' && (
          <MarkersPanel
            markers={markers}
            addMarker={addMarker}
            updateMarker={updateMarker}
            removeMarker={removeMarker}
            selectedMarkerId={selectedMarkerId}
            setSelectedMarker={setSelectedMarker}
            editingMarkerId={editingMarkerId}
            setEditingMarker={setEditingMarker}
            defaultColor={mapStyle.markerDefaultColor}
          />
        )}
        {sidebarTab === 'connections' && (
          <ConnectionsPanel
            connections={connections}
            markers={markers}
            addConnection={addConnection}
            updateConnection={updateConnection}
            removeConnection={removeConnection}
            defaultColor={mapStyle.connectionDefaultColor}
          />
        )}
        {sidebarTab === 'style' && (
          <StylePanel
            title={title}
            subtitle={subtitle}
            setTitle={setTitle}
            setSubtitle={setSubtitle}
            mapStyle={mapStyle}
            updateCustomStyle={updateCustomStyle}
          />
        )}
      </div>
    </div>
  );
}

// ── Markers Panel ──

function MarkersPanel({
  markers, addMarker, updateMarker, removeMarker,
  selectedMarkerId, setSelectedMarker,
  editingMarkerId, setEditingMarker,
  defaultColor,
}: any) {
  const [addMode, setAddMode] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');

  const handleAdd = () => {
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (!newLabel || isNaN(lat) || isNaN(lng)) return;
    addMarker({
      label: newLabel,
      latitude: lat,
      longitude: lng,
      color: defaultColor,
      size: 6,
      shape: 'circle' as MarkerShape,
      showLabel: true,
    });
    setNewLabel('');
    setNewLat('');
    setNewLng('');
    setAddMode(false);
  };

  return (
    <div>
      <div className="map-panel-header">
        <span>Markers ({markers.length})</span>
        <button
          className="map-btn-sm map-btn-primary"
          onClick={() => setAddMode(!addMode)}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {addMode && (
        <div className="map-add-form">
          <input
            placeholder="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="map-input"
          />
          <div className="map-input-row">
            <input
              placeholder="Latitude"
              value={newLat}
              onChange={(e) => setNewLat(e.target.value)}
              className="map-input"
              type="number"
              step="any"
            />
            <input
              placeholder="Longitude"
              value={newLng}
              onChange={(e) => setNewLng(e.target.value)}
              className="map-input"
              type="number"
              step="any"
            />
          </div>
          <button className="map-btn-sm map-btn-primary" onClick={handleAdd}>
            Add Marker
          </button>
        </div>
      )}

      <div className="map-marker-list">
        {markers.map((m: any) => (
          <div
            key={m.id}
            className={`map-marker-item ${selectedMarkerId === m.id ? 'selected' : ''}`}
            onClick={() => setSelectedMarker(m.id)}
          >
            {editingMarkerId === m.id ? (
              <MarkerEditor
                marker={m}
                updateMarker={updateMarker}
                onDone={() => setEditingMarker(null)}
              />
            ) : (
              <>
                <span
                  className="map-marker-dot"
                  style={{ background: m.color }}
                />
                <span className="map-marker-label">{m.label}</span>
                <span className="map-marker-coords">
                  {m.latitude.toFixed(2)}, {m.longitude.toFixed(2)}
                </span>
                <div className="map-marker-actions">
                  <button
                    className="map-btn-icon"
                    onClick={(e) => { e.stopPropagation(); setEditingMarker(m.id); }}
                    title="Edit"
                  >
                    <Type size={12} />
                  </button>
                  <button
                    className="map-btn-icon"
                    onClick={(e) => { e.stopPropagation(); updateMarker(m.id, { showLabel: !m.showLabel }); }}
                    title="Toggle label"
                  >
                    {m.showLabel ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    className="map-btn-icon map-btn-danger-icon"
                    onClick={(e) => { e.stopPropagation(); removeMarker(m.id); }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {markers.length === 0 && (
          <p className="map-empty-text">
            No markers yet. Click &quot;Add&quot; or search for a location to get started.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Marker Editor ──

function MarkerEditor({ marker, updateMarker, onDone }: any) {
  return (
    <div className="map-marker-editor" onClick={(e) => e.stopPropagation()}>
      <input
        className="map-input"
        value={marker.label}
        onChange={(e) => updateMarker(marker.id, { label: e.target.value })}
        placeholder="Label"
      />
      <div className="map-input-row">
        <label className="map-label">Color</label>
        <input
          type="color"
          value={marker.color}
          onChange={(e) => updateMarker(marker.id, { color: e.target.value })}
          className="map-color-input"
        />
      </div>
      <div className="map-input-row">
        <label className="map-label">Size</label>
        <input
          type="range"
          min={3}
          max={20}
          value={marker.size}
          onChange={(e) => updateMarker(marker.id, { size: parseInt(e.target.value) })}
          className="map-range"
        />
      </div>
      <div className="map-input-row">
        <label className="map-label">Shape</label>
        <select
          value={marker.shape}
          onChange={(e) => updateMarker(marker.id, { shape: e.target.value })}
          className="map-select"
        >
          {markerShapes.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="map-input-row">
        <label className="map-checkbox-label">
          <input
            type="checkbox"
            checked={marker.pulse || false}
            onChange={(e) => updateMarker(marker.id, { pulse: e.target.checked })}
          />
          Pulse animation
        </label>
      </div>
      <button className="map-btn-sm" onClick={onDone}>Done</button>
    </div>
  );
}

// ── Connections Panel ──

function ConnectionsPanel({
  connections, markers, addConnection, updateConnection, removeConnection, defaultColor,
}: any) {
  const [addMode, setAddMode] = useState(false);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');

  const handleAdd = () => {
    if (!fromId || !toId || fromId === toId) return;
    addConnection({
      fromMarkerId: fromId,
      toMarkerId: toId,
      color: defaultColor,
      width: 1.5,
    });
    setFromId('');
    setToId('');
    setAddMode(false);
  };

  return (
    <div>
      <div className="map-panel-header">
        <span>Connections ({connections.length})</span>
        <button
          className="map-btn-sm map-btn-primary"
          onClick={() => setAddMode(!addMode)}
          disabled={markers.length < 2}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {addMode && (
        <div className="map-add-form">
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="map-select">
            <option value="">From...</option>
            {markers.map((m: any) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className="map-select">
            <option value="">To...</option>
            {markers.map((m: any) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <button className="map-btn-sm map-btn-primary" onClick={handleAdd}>
            Add Connection
          </button>
        </div>
      )}

      <div className="map-marker-list">
        {connections.map((c: any) => {
          const from = markers.find((m: any) => m.id === c.fromMarkerId);
          const to = markers.find((m: any) => m.id === c.toMarkerId);
          return (
            <div key={c.id} className="map-marker-item">
              <span className="map-marker-dot" style={{ background: c.color }} />
              <span className="map-marker-label">
                {from?.label || '?'} → {to?.label || '?'}
              </span>
              <div className="map-marker-actions">
                <input
                  type="color"
                  value={c.color}
                  onChange={(e) => updateConnection(c.id, { color: e.target.value })}
                  className="map-color-input-sm"
                  title="Color"
                />
                <button
                  className="map-btn-icon"
                  onClick={() => updateConnection(c.id, { dashed: !c.dashed })}
                  title="Toggle dashed"
                >
                  <span style={{ fontSize: 10, opacity: c.dashed ? 1 : 0.4 }}>---</span>
                </button>
                <button
                  className="map-btn-icon map-btn-danger-icon"
                  onClick={() => removeConnection(c.id)}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {connections.length === 0 && (
          <p className="map-empty-text">
            {markers.length < 2
              ? 'Add at least 2 markers to create connections.'
              : 'No connections yet. Connect your markers with lines.'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Style Panel ──

const patternOptions: { value: MapPattern; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dots' },
  { value: 'gridlines', label: 'Grid Lines' },
  { value: 'scanlines', label: 'Scanlines' },
  { value: 'hex', label: 'Hexagons' },
  { value: 'dither', label: 'Dither' },
  { value: 'crosshatch', label: 'Crosshatch' },
];

function StylePanel({ title, subtitle, setTitle, setSubtitle, mapStyle, updateCustomStyle }: any) {
  return (
    <div>
      <div className="map-panel-header">
        <span>Map Settings</span>
      </div>
      <div className="map-add-form">
        <label className="map-label">Title</label>
        <input
          className="map-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Map title"
        />
        <label className="map-label">Subtitle</label>
        <input
          className="map-input"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle or description"
        />
      </div>

      {/* Land Pattern */}
      <div className="map-panel-header" style={{ marginTop: 16 }}>
        <span>Land Pattern</span>
      </div>
      <div className="map-add-form">
        <div className="map-input-row">
          <label className="map-label">Pattern</label>
          <select
            className="map-select"
            value={mapStyle.landPattern || 'none'}
            onChange={(e) => updateCustomStyle({ landPattern: e.target.value })}
          >
            {patternOptions.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        {mapStyle.landPattern && mapStyle.landPattern !== 'none' && (
          <>
            <div className="map-input-row">
              <label className="map-label">Color</label>
              <input
                type="color"
                className="map-color-input"
                value={mapStyle.landPatternColor || mapStyle.landStroke}
                onChange={(e) => updateCustomStyle({ landPatternColor: e.target.value })}
              />
            </div>
            <div className="map-input-row">
              <label className="map-label">Opacity</label>
              <input
                type="range"
                className="map-range"
                min={0.02}
                max={0.5}
                step={0.02}
                value={mapStyle.landPatternOpacity ?? 0.15}
                onChange={(e) => updateCustomStyle({ landPatternOpacity: parseFloat(e.target.value) })}
              />
              <span className="map-range-value">{((mapStyle.landPatternOpacity ?? 0.15) * 100).toFixed(0)}%</span>
            </div>
            <div className="map-input-row">
              <label className="map-label">Size</label>
              <input
                type="range"
                className="map-range"
                min={0.01}
                max={2}
                step={0.01}
                value={mapStyle.landPatternScale ?? 1}
                onChange={(e) => updateCustomStyle({ landPatternScale: parseFloat(e.target.value) })}
              />
              <span className="map-range-value">{(mapStyle.landPatternScale ?? 1).toFixed(2)}x</span>
            </div>
          </>
        )}
      </div>

      {/* Ocean Pattern */}
      <div className="map-panel-header" style={{ marginTop: 16 }}>
        <span>Ocean Pattern</span>
      </div>
      <div className="map-add-form">
        <div className="map-input-row">
          <label className="map-label">Pattern</label>
          <select
            className="map-select"
            value={mapStyle.oceanPattern || 'none'}
            onChange={(e) => updateCustomStyle({ oceanPattern: e.target.value })}
          >
            {patternOptions.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        {mapStyle.oceanPattern && mapStyle.oceanPattern !== 'none' && (
          <>
            <div className="map-input-row">
              <label className="map-label">Color</label>
              <input
                type="color"
                className="map-color-input"
                value={mapStyle.oceanPatternColor || mapStyle.graticuleColor || '#444444'}
                onChange={(e) => updateCustomStyle({ oceanPatternColor: e.target.value })}
              />
            </div>
            <div className="map-input-row">
              <label className="map-label">Opacity</label>
              <input
                type="range"
                className="map-range"
                min={0.02}
                max={0.5}
                step={0.02}
                value={mapStyle.oceanPatternOpacity ?? 0.1}
                onChange={(e) => updateCustomStyle({ oceanPatternOpacity: parseFloat(e.target.value) })}
              />
              <span className="map-range-value">{((mapStyle.oceanPatternOpacity ?? 0.1) * 100).toFixed(0)}%</span>
            </div>
            <div className="map-input-row">
              <label className="map-label">Size</label>
              <input
                type="range"
                className="map-range"
                min={0.01}
                max={2}
                step={0.01}
                value={mapStyle.oceanPatternScale ?? 1}
                onChange={(e) => updateCustomStyle({ oceanPatternScale: parseFloat(e.target.value) })}
              />
              <span className="map-range-value">{(mapStyle.oceanPatternScale ?? 1).toFixed(2)}x</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
