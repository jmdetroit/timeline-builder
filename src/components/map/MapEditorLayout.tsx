'use client';

import React from 'react';
import MapToolbar from './MapToolbar';
import MapCanvas from './MapCanvas';
import MapSidebar from './MapSidebar';

export default function MapEditorLayout() {
  return (
    <div className="map-editor-layout">
      <MapToolbar />
      <div className="map-editor-body">
        <MapSidebar />
        <div className="map-canvas-wrapper">
          <MapCanvas />
        </div>
      </div>
    </div>
  );
}
