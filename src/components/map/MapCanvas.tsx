'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  Graticule,
  ZoomableGroup,
  Sphere,
} from 'react-simple-maps';
import { useMapStore } from '@/lib/map-store';
import { getMapStyle } from '@/lib/map-styles';
import MapPatterns from './MapPatterns';

const WORLD_TOPO =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function MapCanvas() {
  const {
    projection,
    view,
    style,
    customStyle,
    markers,
    connections,
    regionStyles,
    showGraticule,
    showBorders,
    width,
    height,
    title,
    subtitle,
    selectedMarkerId,
    setSelectedMarker,
    setView,
  } = useMapStore();

  const mapStyle = getMapStyle(style, customStyle);
  const isGlobe = projection === 'geoOrthographic';

  // Globe drag rotation state
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; rotation: [number, number, number] } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isGlobe) return;
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        rotation: [...view.rotation] as [number, number, number],
      };
    },
    [isGlobe, view.rotation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !dragStart.current || !isGlobe) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const sensitivity = 0.4;
      const newLambda = dragStart.current.rotation[0] + dx * sensitivity;
      const newPhi = Math.max(-90, Math.min(90, dragStart.current.rotation[1] - dy * sensitivity));
      setView({ rotation: [newLambda, newPhi, dragStart.current.rotation[2]] });
    },
    [dragging, isGlobe, setView]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  // Add mouseup listener to window for when mouse leaves the canvas
  useEffect(() => {
    if (dragging) {
      const up = () => { setDragging(false); dragStart.current = null; };
      window.addEventListener('mouseup', up);
      return () => window.removeEventListener('mouseup', up);
    }
  }, [dragging]);

  const handleMoveEnd = useCallback(
    (pos: { coordinates: [number, number]; zoom: number }) => {
      if (!isGlobe) {
        setView({ center: pos.coordinates, zoom: pos.zoom });
      }
    },
    [setView, isGlobe]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isGlobe) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.85 : 1.15;
      setView({ zoom: Math.max(1, Math.min(20, view.zoom * delta)) });
    },
    [isGlobe, view.zoom, setView]
  );

  const regionStyleMap = new Map(
    regionStyles.map((rs) => [rs.regionId, rs])
  );
  const markerMap = new Map(markers.map((m) => [m.id, m]));

  // Pattern fills
  const landPattern = mapStyle.landPattern || 'none';
  const oceanPattern = mapStyle.oceanPattern || 'none';
  const hasLandPattern = landPattern !== 'none';
  const hasOceanPattern = oceanPattern !== 'none';

  // For globe, we pass rotation as projectionConfig
  const projectionConfig = isGlobe
    ? { rotate: [-view.rotation[0], -view.rotation[1], -view.rotation[2]] as [number, number, number], scale: 250 * view.zoom }
    : undefined;

  return (
    <div
      className="map-canvas-container"
      id="map-export-root"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isGlobe && dragging ? 'grabbing' : isGlobe ? 'grab' : undefined }}
    >
      {/* Title overlay */}
      {title && (
        <div
          className="map-title-overlay"
          style={{ color: mapStyle.titleColor, fontFamily: mapStyle.titleFont }}
        >
          <h1 className="map-title">{title}</h1>
          {subtitle && <p className="map-subtitle">{subtitle}</p>}
        </div>
      )}

      <ComposableMap
        projection={projection}
        projectionConfig={projectionConfig}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', background: mapStyle.backgroundColor }}
      >
        {/* SVG defs for effects and patterns */}
        <defs>
          {mapStyle.glowEffect && (
            <filter id="map-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feComponentTransfer in="blur" result="soft">
                <feFuncA type="linear" slope="0.5" intercept="0" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="soft" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
          {mapStyle.glowEffect && (
            <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feComponentTransfer in="blur" result="soft">
                <feFuncA type="linear" slope="0.6" intercept="0" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="soft" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
          <MapPatterns
            landPattern={landPattern}
            landPatternColor={mapStyle.landPatternColor || mapStyle.landStroke}
            landPatternOpacity={mapStyle.landPatternOpacity ?? 0.15}
            landPatternScale={mapStyle.landPatternScale ?? 1}
            oceanPattern={oceanPattern}
            oceanPatternColor={mapStyle.oceanPatternColor || mapStyle.graticuleColor || '#444'}
            oceanPatternOpacity={mapStyle.oceanPatternOpacity ?? 0.1}
            oceanPatternScale={mapStyle.oceanPatternScale ?? 1}
          />
        </defs>

        {isGlobe ? (
          /* Globe mode: no ZoomableGroup, rotation handled via projectionConfig */
          <g>
            {/* Sphere outline (ocean) */}
            <Sphere
              id="globe-sphere"
              fill={mapStyle.oceanFill}
              stroke={mapStyle.landStroke}
              strokeWidth={0.5}
            />

            {/* Ocean pattern overlay on sphere */}
            {hasOceanPattern && (
              <Sphere
                id="globe-ocean-pattern"
                fill="url(#ocean-pattern)"
                stroke="transparent"
                strokeWidth={0}
              />
            )}

            {/* Graticule */}
            {showGraticule && (
              <Graticule
                stroke={mapStyle.graticuleColor || '#222'}
                strokeWidth={0.4}
                strokeOpacity={mapStyle.graticuleOpacity ?? 0.3}
              />
            )}

            {/* Geographies */}
            <Geographies geography={WORLD_TOPO}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isoCode = geo.properties?.ISO_A3 || geo.id;
                  const regionOverride = regionStyleMap.get(isoCode);
                  return (
                    <React.Fragment key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        fill={regionOverride?.fillColor || mapStyle.landFill}
                        stroke={showBorders ? regionOverride?.strokeColor || mapStyle.landStroke : 'transparent'}
                        strokeWidth={mapStyle.landStrokeWidth}
                        opacity={regionOverride?.opacity ?? 1}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: regionOverride?.fillColor || lighten(mapStyle.landFill, 15), cursor: 'pointer' },
                          pressed: { outline: 'none' },
                        }}
                      />
                      {hasLandPattern && (
                        <Geography
                          geography={geo}
                          fill="url(#land-pattern)"
                          stroke="transparent"
                          strokeWidth={0}
                          style={{ default: { outline: 'none', pointerEvents: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              }
            </Geographies>

            {/* Connections */}
            {connections.map((conn) => {
              const from = markerMap.get(conn.fromMarkerId);
              const to = markerMap.get(conn.toMarkerId);
              if (!from || !to) return null;
              return (
                <Line
                  key={conn.id}
                  from={[from.longitude, from.latitude]}
                  to={[to.longitude, to.latitude]}
                  stroke={conn.color}
                  strokeWidth={conn.width}
                  strokeLinecap="round"
                  strokeDasharray={conn.dashed ? '4 2' : undefined}
                  style={{ filter: mapStyle.glowEffect ? 'url(#map-glow)' : undefined }}
                />
              );
            })}

            {/* Markers */}
            {markers.map((marker) => {
              const isSelected = marker.id === selectedMarkerId;
              return (
                <Marker key={marker.id} coordinates={[marker.longitude, marker.latitude]} onClick={() => setSelectedMarker(marker.id)}>
                  {marker.pulse && <circle r={marker.size * 2} fill="transparent" stroke={marker.color} strokeWidth={1} opacity={0.4} className="marker-pulse" />}
                  {mapStyle.glowEffect && <circle r={marker.size} fill={marker.color} filter="url(#marker-glow)" opacity={0.6} />}
                  {renderMarkerShape(marker, isSelected)}
                  {isSelected && <circle r={marker.size + 4} fill="transparent" stroke="#FFFFFF" strokeWidth={2} strokeDasharray="3 2" />}
                  {marker.showLabel && (
                    <text textAnchor="middle" y={marker.size + 14 + (marker.labelOffset?.[1] || 0)} x={marker.labelOffset?.[0] || 0} fill={mapStyle.labelColor} fontSize={11} fontFamily={mapStyle.labelFont} fontWeight={500} style={{ pointerEvents: 'none' }}>
                      {marker.label}
                    </text>
                  )}
                </Marker>
              );
            })}
          </g>
        ) : (
          /* Flat projection mode: use ZoomableGroup for pan/zoom */
          <ZoomableGroup
            center={view.center}
            zoom={view.zoom}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={20}
          >
            {/* Ocean background */}
            <rect x={-width} y={-height} width={width * 3} height={height * 3} fill={mapStyle.oceanFill} />

            {/* Ocean pattern overlay */}
            {hasOceanPattern && (
              <rect x={-width} y={-height} width={width * 3} height={height * 3} fill="url(#ocean-pattern)" pointerEvents="none" />
            )}

            {/* Graticule */}
            {showGraticule && (
              <Graticule
                stroke={mapStyle.graticuleColor || '#222'}
                strokeWidth={0.4}
                strokeOpacity={mapStyle.graticuleOpacity ?? 0.3}
              />
            )}

            {/* Geographies */}
            <Geographies geography={WORLD_TOPO}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isoCode = geo.properties?.ISO_A3 || geo.id;
                  const regionOverride = regionStyleMap.get(isoCode);
                  return (
                    <React.Fragment key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        fill={regionOverride?.fillColor || mapStyle.landFill}
                        stroke={showBorders ? regionOverride?.strokeColor || mapStyle.landStroke : 'transparent'}
                        strokeWidth={mapStyle.landStrokeWidth}
                        opacity={regionOverride?.opacity ?? 1}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: regionOverride?.fillColor || lighten(mapStyle.landFill, 15), cursor: 'pointer' },
                          pressed: { outline: 'none' },
                        }}
                      />
                      {hasLandPattern && (
                        <Geography
                          geography={geo}
                          fill="url(#land-pattern)"
                          stroke="transparent"
                          strokeWidth={0}
                          style={{ default: { outline: 'none', pointerEvents: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              }
            </Geographies>

            {/* Connections */}
            {connections.map((conn) => {
              const from = markerMap.get(conn.fromMarkerId);
              const to = markerMap.get(conn.toMarkerId);
              if (!from || !to) return null;
              return (
                <Line
                  key={conn.id}
                  from={[from.longitude, from.latitude]}
                  to={[to.longitude, to.latitude]}
                  stroke={conn.color}
                  strokeWidth={conn.width}
                  strokeLinecap="round"
                  strokeDasharray={conn.dashed ? '4 2' : undefined}
                  style={{ filter: mapStyle.glowEffect ? 'url(#map-glow)' : undefined }}
                />
              );
            })}

            {/* Markers */}
            {markers.map((marker) => {
              const isSelected = marker.id === selectedMarkerId;
              return (
                <Marker key={marker.id} coordinates={[marker.longitude, marker.latitude]} onClick={() => setSelectedMarker(marker.id)}>
                  {marker.pulse && <circle r={marker.size * 2} fill="transparent" stroke={marker.color} strokeWidth={1} opacity={0.4} className="marker-pulse" />}
                  {mapStyle.glowEffect && <circle r={marker.size} fill={marker.color} filter="url(#marker-glow)" opacity={0.6} />}
                  {renderMarkerShape(marker, isSelected)}
                  {isSelected && <circle r={marker.size + 4} fill="transparent" stroke="#FFFFFF" strokeWidth={2} strokeDasharray="3 2" />}
                  {marker.showLabel && (
                    <text textAnchor="middle" y={marker.size + 14 + (marker.labelOffset?.[1] || 0)} x={marker.labelOffset?.[0] || 0} fill={mapStyle.labelColor} fontSize={11} fontFamily={mapStyle.labelFont} fontWeight={500} style={{ pointerEvents: 'none' }}>
                      {marker.label}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        )}
      </ComposableMap>
    </div>
  );
}

function renderMarkerShape(
  marker: { color: string; size: number; shape: string },
  isSelected: boolean
) {
  const { color, size, shape } = marker;
  const stroke = isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.3)';
  const sw = isSelected ? 2 : 0.5;

  switch (shape) {
    case 'pin':
      return (
        <g>
          <circle r={size} fill={color} stroke={stroke} strokeWidth={sw} />
          <circle r={size * 0.4} fill="#FFFFFF" opacity={0.8} />
        </g>
      );
    case 'square':
      return <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={color} stroke={stroke} strokeWidth={sw} rx={2} />;
    case 'diamond':
      return <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={color} stroke={stroke} strokeWidth={sw} transform="rotate(45)" rx={1} />;
    case 'star': {
      const points = 5;
      const outer = size;
      const inner = size * 0.5;
      const d = Array.from({ length: points * 2 }, (_, i) => {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI * i) / points - Math.PI / 2;
        return `${Math.cos(a) * r},${Math.sin(a) * r}`;
      }).join(' ');
      return <polygon points={d} fill={color} stroke={stroke} strokeWidth={sw} />;
    }
    default:
      return <circle r={size} fill={color} stroke={stroke} strokeWidth={sw} />;
  }
}

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
