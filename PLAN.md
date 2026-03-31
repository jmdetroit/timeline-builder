# Timeline Builder - Implementation Plan

## Overview
A web-based timeline/roadmap builder that lets users create professional timelines (quarterly, monthly, yearly views), visually edit them with drag-and-drop, apply multiple visual styles, and export as SVG/PNG for use in PowerPoint and slide decks. Deployed on Vercel.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR, Vercel-native, great DX |
| **Styling** | Tailwind CSS + shadcn/ui | Multiple themes, dark mode, copy-paste components |
| **Color System** | Radix Colors + CSS variables | Perceptually consistent palettes, easy theme switching |
| **Timeline Rendering** | Custom SVG components | Full control over export quality and styling |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | Modern, accessible, performant |
| **SVG Export** | html-to-image + save-svg-as-png | DOM-to-SVG and native SVG extraction |
| **Icons** | Lucide React (via shadcn) | Clean, consistent iconography |
| **State** | Zustand | Lightweight, no boilerplate |
| **Storage** | localStorage + JSON import/export | No backend needed |
| **Deployment** | Vercel | Zero-config for Next.js |
| **Design Reference** | Figma (connected via MCP) | Pull styles, validate designs |

---

## Visual Themes (4 Styles)

Each theme is a CSS variable set that transforms the entire timeline look:

1. **Corporate** - Clean blues/grays, serif headings, subtle borders (boardroom-ready)
2. **Modern** - Dark mode, gradients, rounded corners, vibrant accents (Linear-inspired)
3. **Minimal** - Monochrome, thin lines, generous whitespace, sans-serif (Apple-inspired)
4. **Colorful** - Bright category colors, playful shapes, gradient backgrounds (Notion-inspired)

---

## Timeline Views

- **Yearly** - High-level, shows full years with major milestones
- **Quarterly** - Q1/Q2/Q3/Q4 columns, project phases as horizontal bars
- **Monthly** - 12-month or custom range, detailed task-level view

---

## Project Structure

```
E:/Claude Projects/timeline-builder/
├── .claude/
│   └── launch.json              # Dev server config for Claude Preview
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with theme provider
│   │   ├── page.tsx             # Main editor page
│   │   └── globals.css          # Theme CSS variables + Tailwind
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (Button, Card, Dialog, etc.)
│   │   ├── editor/
│   │   │   ├── EditorLayout.tsx     # Main split-pane layout
│   │   │   ├── FormPanel.tsx        # Left panel: form-based data entry
│   │   │   ├── TimelineCanvas.tsx   # Right panel: live SVG preview
│   │   │   ├── Toolbar.tsx          # Top bar: view toggle, theme picker, export
│   │   │   └── ItemEditor.tsx       # Modal/popover for editing individual items
│   │   ├── timeline/
│   │   │   ├── TimelineRenderer.tsx # Core SVG timeline renderer
│   │   │   ├── YearlyView.tsx       # Yearly layout logic
│   │   │   ├── QuarterlyView.tsx    # Quarterly layout logic
│   │   │   ├── MonthlyView.tsx      # Monthly layout logic
│   │   │   ├── TimelineItem.tsx     # Individual draggable item/bar
│   │   │   ├── MilestoneMarker.tsx  # Diamond/circle milestone markers
│   │   │   ├── PhaseBar.tsx         # Horizontal phase/project bar
│   │   │   └── TimelineGrid.tsx     # Background grid lines + labels
│   │   └── export/
│   │       └── ExportDialog.tsx     # Export options (SVG, PNG, dimensions)
│   ├── lib/
│   │   ├── store.ts             # Zustand store (timeline data, UI state)
│   │   ├── types.ts             # TypeScript types for timeline data model
│   │   ├── themes.ts            # Theme definitions and CSS variable maps
│   │   ├── export.ts            # SVG/PNG export utilities
│   │   ├── sample-data.ts       # Pre-built sample timelines for demo
│   │   └── utils.ts             # Date math, layout calculations
│   └── hooks/
│       ├── useTimeline.ts       # Timeline data management hook
│       ├── useDragItem.ts       # Drag-and-drop integration hook
│       └── useExport.ts         # Export functionality hook
├── public/
│   └── fonts/                   # Theme-specific fonts if needed
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Data Model

```typescript
interface TimelineProject {
  id: string;
  name: string;
  description?: string;
  items: TimelineItem[];
  settings: TimelineSettings;
  createdAt: string;
  updatedAt: string;
}

interface TimelineItem {
  id: string;
  type: 'phase' | 'milestone' | 'task';
  label: string;
  description?: string;
  startDate: string;       // ISO date
  endDate?: string;        // ISO date (optional for milestones)
  row: number;             // Swim lane index
  category?: string;       // For color coding
  color?: string;          // Override color
  icon?: string;           // Optional icon
}

interface TimelineSettings {
  view: 'yearly' | 'quarterly' | 'monthly';
  theme: 'corporate' | 'modern' | 'minimal' | 'colorful';
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  showGrid: boolean;
  showLabels: boolean;
  rowLabels: string[];     // Swim lane names (e.g., "Frontend", "Backend", "Design")
}
```

---

## Implementation Steps

### Phase 1: Project Scaffolding
1. Initialize Next.js project with TypeScript + Tailwind
2. Install dependencies (shadcn/ui, @dnd-kit, zustand, html-to-image, lucide-react)
3. Set up shadcn/ui components (Button, Card, Dialog, Select, Input, Popover, Tabs)
4. Configure `.claude/launch.json` for Claude Preview
5. Set up theme CSS variables in globals.css (all 4 themes)

### Phase 2: Core Timeline Renderer
6. Build TypeScript types and Zustand store
7. Build `TimelineGrid.tsx` - SVG grid with time labels
8. Build `PhaseBar.tsx` - horizontal bars for phases/projects
9. Build `MilestoneMarker.tsx` - diamond/circle markers
10. Build `TimelineRenderer.tsx` - orchestrates grid + items for each view
11. Build `YearlyView`, `QuarterlyView`, `MonthlyView` layout calculators

### Phase 3: Editor UI
12. Build `Toolbar.tsx` - view switcher, theme picker, export button
13. Build `FormPanel.tsx` - add/edit timeline items via forms
14. Build `EditorLayout.tsx` - split-pane layout (form left, preview right)
15. Build `ItemEditor.tsx` - click-to-edit individual items
16. Wire up sample data for immediate visual feedback

### Phase 4: Drag-and-Drop
17. Integrate @dnd-kit for dragging items on the timeline
18. Add drag-to-resize for phase bars (adjust start/end dates)
19. Add snap-to-grid behavior

### Phase 5: Export Pipeline
20. Build SVG export (clean SVG with embedded styles)
21. Build PNG export (configurable resolution)
22. Build `ExportDialog.tsx` with dimension/format options
23. Add JSON import/export for saving/loading projects

### Phase 6: Polish & Deploy
24. Add sample timeline templates (Product Roadmap, Sprint Plan, Project Timeline)
25. Add localStorage auto-save
26. Responsive layout adjustments
27. Vercel deployment config

---

## Figma Integration Points
- Pull color tokens and typography from connected Figma design system
- Use Figma to prototype/validate each theme before coding
- Reference Figma community roadmap templates for layout inspiration
- Architecture diagram already created: [FigJam Board](link in session)

---

## Export Specifications
- **SVG**: Standalone file with embedded CSS, no external dependencies. Clean enough to edit in Illustrator/Figma.
- **PNG**: 2x resolution by default (configurable). Transparent or white background option.
- **Dimensions**: Default 1920x1080 (16:9 slide), with presets for 4:3, A4 landscape, and custom.
