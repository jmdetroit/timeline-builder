export type MapProjection =
  | 'geoMercator'
  | 'geoEqualEarth'
  | 'geoAlbersUsa'
  | 'geoOrthographic'
  | 'geoNaturalEarth1';

export type MarkerShape = 'circle' | 'pin' | 'square' | 'diamond' | 'star';

export type MapPattern =
  | 'none'
  | 'dots'
  | 'gridlines'
  | 'scanlines'
  | 'hex'
  | 'dither'
  | 'crosshatch';

export type MapStylePreset =
  | 'dark-network'
  | 'light-clean'
  | 'satellite-glow'
  | 'blueprint'
  | 'minimal'
  | 'neon';

export interface MapMarker {
  id: string;
  label: string;
  description?: string;
  latitude: number;
  longitude: number;
  color: string;
  size: number;         // radius in px
  shape: MarkerShape;
  showLabel: boolean;
  labelOffset?: [number, number];
  pulse?: boolean;      // animated pulse ring
  group?: string;       // for grouping/filtering
}

export interface MapConnection {
  id: string;
  fromMarkerId: string;
  toMarkerId: string;
  color: string;
  width: number;
  dashed?: boolean;
  label?: string;
  curvature?: number;   // 0 = straight, positive = arc
}

export interface MapRegionStyle {
  regionId: string;     // ISO country/state code or feature id
  fillColor: string;
  strokeColor?: string;
  opacity?: number;
  label?: string;
}

export interface MapStyleConfig {
  name: MapStylePreset;
  label: string;
  backgroundColor: string;
  landFill: string;
  landStroke: string;
  landStrokeWidth: number;
  oceanFill: string;
  borderColor: string;
  borderWidth: number;
  markerDefaultColor: string;
  connectionDefaultColor: string;
  labelColor: string;
  labelFont: string;
  titleColor: string;
  titleFont: string;
  graticuleColor?: string;
  graticuleOpacity?: number;
  glowEffect?: boolean;
  dotPattern?: boolean;
  landPattern?: MapPattern;
  landPatternColor?: string;
  landPatternOpacity?: number;
  landPatternScale?: number;    // 0.25–4, default 1
  oceanPattern?: MapPattern;
  oceanPatternColor?: string;
  oceanPatternOpacity?: number;
  oceanPatternScale?: number;   // 0.25–4, default 1
}

export interface MapViewState {
  center: [number, number];  // [lng, lat]
  zoom: number;              // 1 = world, higher = closer
  rotation: [number, number, number]; // [lambda, phi, gamma] for globe
}

export interface MapProject {
  id: string;
  name: string;
  description?: string;
  projection: MapProjection;
  style: MapStylePreset;
  customStyle?: Partial<MapStyleConfig>;
  view: MapViewState;
  markers: MapMarker[];
  connections: MapConnection[];
  regionStyles: MapRegionStyle[];
  title?: string;
  subtitle?: string;
  showGraticule: boolean;
  showBorders: boolean;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

// Nominatim geocoding result
export interface GeocodingResult {
  placeId: number;
  displayName: string;
  lat: number;
  lon: number;
  type: string;
  boundingBox: [number, number, number, number]; // [south, north, west, east]
}
