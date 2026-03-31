export type ViewMode = 'yearly' | 'quarterly' | 'monthly';
export type ThemeName =
  | 'corporate'
  | 'modern'
  | 'minimal'
  | 'colorful'
  | 'scifi'
  | 'glass'
  | 'liquid'
  | 'y2k'
  | 'flat'
  | 'neon'
  | 'custom';
export type ItemType = 'phase' | 'milestone' | 'task';

export interface TimelineItem {
  id: string;
  type: ItemType;
  label: string;
  description?: string;
  startDate: string; // ISO date string
  endDate?: string;  // ISO date string (optional for milestones)
  row: number;
  category?: string;
  color?: string;
}

export interface TimelineSettings {
  view: ViewMode;
  theme: ThemeName;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  showGrid: boolean;
  showLabels: boolean;
  rowLabels: string[];
}

export interface TimelineProject {
  id: string;
  name: string;
  description?: string;
  items: TimelineItem[];
  settings: TimelineSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  accent: string;
  gridLine: string;
  gridText: string;
  headerBg: string;
  headerText: string;
  // Category colors for items
  categories: string[];
}

// Visual effects that go beyond simple colors
export interface ThemeEffects {
  // Bar rendering
  barGradient?: boolean;          // Use gradient fills on bars
  barGradientDirection?: 'horizontal' | 'vertical';
  barGlow?: boolean;              // Glow/shadow around bars
  barGlowColor?: string;         // Glow color
  barGlowRadius?: number;        // Glow blur radius
  barOpacity?: number;            // Base opacity (for glass effect)
  barStroke?: boolean;            // Show border stroke on bars
  barStrokeColor?: string;
  barStrokeWidth?: number;
  barInnerShadow?: boolean;      // Inner highlight for 3D effect

  // Background effects
  bgPattern?: 'none' | 'dots' | 'grid' | 'scanlines' | 'stars';
  bgPatternColor?: string;
  bgPatternOpacity?: number;

  // Grid effects
  gridGlow?: boolean;
  gridStyle?: 'solid' | 'dashed' | 'dotted';

  // Text effects
  textGlow?: boolean;
  textGlowColor?: string;

  // Milestone effects
  milestoneGlow?: boolean;
  milestonePulse?: boolean;

  // Special SVG filters
  useBlur?: boolean;
  useNoise?: boolean;
}

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  description: string;
  category: 'classic' | 'stylistic';
  colors: ThemeColors;
  effects: ThemeEffects;
  borderRadius: string;
  fontFamily: string;
  headingFont: string;
  itemHeight: number;
  itemGap: number;
  barStyle: 'rounded' | 'sharp' | 'pill';
  milestoneShape: 'diamond' | 'circle' | 'square' | 'star';
}
