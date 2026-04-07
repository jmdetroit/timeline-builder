import { toPng } from 'html-to-image';
import { TimelineItem, TimelineSettings } from './types';

export interface ExportOptions {
  format: 'svg' | 'png';
  scale: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  transparent?: boolean;
}

/**
 * Export the timeline SVG element as a clean, standalone SVG string.
 * This extracts the actual SVG markup (not foreignObject wrapping),
 * so the output is editable in Illustrator, Figma, Inkscape, etc.
 */
export function exportTimelineSvg(svgElement: SVGSVGElement): string {
  // Clone the SVG so we don't mutate the live DOM
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Ensure the SVG has proper XML namespace
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Get computed font from the original
  const computedStyle = window.getComputedStyle(svgElement);
  const fontFamily = computedStyle.fontFamily;

  // Remove any interactive attributes (cursor, tabindex, role) for clean export
  const interactiveEls = clone.querySelectorAll('[role], [tabindex]');
  interactiveEls.forEach((el) => {
    el.removeAttribute('role');
    el.removeAttribute('tabindex');
  });

  // Remove inline cursor styles
  const allEls = clone.querySelectorAll('*');
  allEls.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style?.cursor) {
      htmlEl.style.cursor = '';
    }
  });

  // Get viewBox dimensions for width/height attributes
  const viewBox = clone.getAttribute('viewBox');
  let vbWidth = 1200;
  let vbHeight = 600;
  if (viewBox) {
    const parts = viewBox.split(' ').map(Number);
    if (parts.length === 4) {
      vbWidth = parts[2];
      vbHeight = parts[3];
      clone.setAttribute('width', vbWidth.toString());
      clone.setAttribute('height', vbHeight.toString());
    }
  }

  // Add rounded-corner clip path so the export looks like the card in the editor
  const radius = 12;
  const ns = 'http://www.w3.org/2000/svg';
  let defs = clone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(ns, 'defs');
    clone.insertBefore(defs, clone.firstChild);
  }
  const clipPath = document.createElementNS(ns, 'clipPath');
  clipPath.setAttribute('id', 'export-rounded-clip');
  const clipRect = document.createElementNS(ns, 'rect');
  clipRect.setAttribute('x', '0');
  clipRect.setAttribute('y', '0');
  clipRect.setAttribute('width', vbWidth.toString());
  clipRect.setAttribute('height', vbHeight.toString());
  clipRect.setAttribute('rx', radius.toString());
  clipRect.setAttribute('ry', radius.toString());
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);

  // Wrap all content (except defs) in a clipped group
  const wrapper = document.createElementNS(ns, 'g');
  wrapper.setAttribute('clip-path', 'url(#export-rounded-clip)');
  const children = Array.from(clone.childNodes);
  for (const child of children) {
    if (child !== defs) {
      wrapper.appendChild(child);
    }
  }
  clone.appendChild(wrapper);

  // Serialize to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Add XML declaration for maximum compatibility
  svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;

  return svgString;
}

/**
 * Download an SVG string as a .svg file
 */
export function downloadSvg(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export the timeline container as a PNG using html-to-image
 */
export async function exportTimelinePng(
  element: HTMLElement,
  options: { scale: number; backgroundColor: string; transparent?: boolean }
): Promise<void> {
  const { scale, backgroundColor, transparent } = options;

  const filter = (node: HTMLElement) => {
    if (node.dataset?.excludeExport === 'true') return false;
    return true;
  };

  const dataUrl = await toPng(element, {
    filter,
    backgroundColor: transparent ? 'transparent' : backgroundColor,
    pixelRatio: scale,
    cacheBust: true,
  });

  downloadDataUrl(dataUrl, 'timeline.png');
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── JSON Import/Export ──

export function exportProjectAsJson(items: TimelineItem[], settings: TimelineSettings): string {
  const project = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings,
    items,
  };
  return JSON.stringify(project, null, 2);
}

export function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

export function importProjectFromJson(json: string): { items: TimelineItem[]; settings: TimelineSettings } | null {
  try {
    const data = JSON.parse(json);
    if (data.items && data.settings) {
      return { items: data.items, settings: data.settings };
    }
    return null;
  } catch {
    return null;
  }
}

// ── CSV Export/Import ──

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = ['type', 'label', 'description', 'startDate', 'endDate', 'row', 'color', 'progress'] as const;

export function exportProjectAsCsv(items: TimelineItem[], settings: TimelineSettings): string {
  // Metadata lines (prefixed with #) to preserve project settings
  const meta = [
    `# title,${escapeCsvField(settings.title)}`,
    `# subtitle,${escapeCsvField(settings.subtitle || '')}`,
    `# startDate,${settings.startDate}`,
    `# endDate,${settings.endDate}`,
    `# theme,${settings.theme}`,
    `# view,${settings.view}`,
    `# showProgress,${settings.showProgress}`,
  ];
  const headerRow = CSV_HEADERS.join(',');
  const dataRows = items.map((item) => {
    const rowLabel = settings.rowLabels[item.row] || `Row ${item.row + 1}`;
    return [
      item.type,
      escapeCsvField(item.label),
      escapeCsvField(item.description || ''),
      item.startDate,
      item.endDate || '',
      escapeCsvField(rowLabel),
      item.color || '',
      item.progress != null ? String(item.progress) : '',
    ].join(',');
  });
  return [...meta, headerRow, ...dataRows].join('\n');
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateCsvTemplate(): string {
  const headerRow = CSV_HEADERS.join(',');
  const sampleRows = [
    'phase,Market Research,,2025-01-15,2025-03-15,Strategy',
    'phase,Roadmap Planning,,2025-02-01,2025-04-30,Strategy',
    'milestone,Strategy Approved,,2025-03-31,,Strategy',
    'phase,UX Research,,2025-03-01,2025-05-15,Design',
    'phase,UI Design Sprint,,2025-04-01,2025-06-30,Design',
    'task,Backend Architecture,,2025-04-15,2025-07-31,Development',
    'task,Frontend Development,,2025-06-01,2025-09-30,Development',
    'milestone,Beta Launch,,2025-08-15,,Launch',
    'phase,Beta Program,,2025-08-15,2025-10-31,Launch',
  ];
  return [headerRow, ...sampleRows].join('\n');
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export interface CsvImportResult {
  items: Omit<TimelineItem, 'id'>[];
  rowLabels: string[];
  meta: {
    title?: string;
    subtitle?: string;
    startDate?: string;
    endDate?: string;
    theme?: string;
    view?: string;
    showProgress?: string;
  };
}

export function importProjectFromCsv(csv: string): CsvImportResult | null {
  try {
    const allLines = csv.split(/\r?\n/);

    // Extract metadata from comment lines
    const meta: CsvImportResult['meta'] = {};
    const dataLines: string[] = [];
    for (const line of allLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        // Parse metadata: "# key,value"
        const content = trimmed.slice(1).trim();
        const commaIdx = content.indexOf(',');
        if (commaIdx !== -1) {
          const key = content.slice(0, commaIdx).trim();
          const value = content.slice(commaIdx + 1).trim().replace(/^"|"$/g, '');
          if (key === 'title') meta.title = value;
          else if (key === 'subtitle') meta.subtitle = value;
          else if (key === 'startDate') meta.startDate = value;
          else if (key === 'endDate') meta.endDate = value;
          else if (key === 'theme') meta.theme = value;
          else if (key === 'view') meta.view = value;
          else if (key === 'showProgress') meta.showProgress = value;
        }
      } else if (trimmed) {
        dataLines.push(trimmed);
      }
    }

    if (dataLines.length < 2) return null;

    // Parse header to find column indices
    const header = parseCsvLine(dataLines[0]).map((h) => h.toLowerCase().trim());
    const idx = {
      type: header.indexOf('type'),
      label: header.indexOf('label'),
      description: header.indexOf('description'),
      startDate: header.indexOf('startdate'),
      endDate: header.indexOf('enddate'),
      row: header.indexOf('row'),
      color: header.indexOf('color'),
      progress: header.indexOf('progress'),
    };

    if (idx.type === -1 || idx.label === -1 || idx.startDate === -1) return null;

    // Collect unique row labels in order of appearance
    const rowLabels: string[] = [];
    const items: Omit<TimelineItem, 'id'>[] = [];

    for (let i = 1; i < dataLines.length; i++) {
      const fields = parseCsvLine(dataLines[i]);
      if (fields.length < 3) continue;

      const type = (fields[idx.type] || 'phase') as TimelineItem['type'];
      if (!['phase', 'task', 'milestone'].includes(type)) continue;

      const label = fields[idx.label];
      if (!label) continue;

      const rowName = idx.row !== -1 ? fields[idx.row] || 'Default' : 'Default';
      if (!rowLabels.includes(rowName)) rowLabels.push(rowName);
      const rowIndex = rowLabels.indexOf(rowName);

      const colorVal = idx.color !== -1 ? fields[idx.color] || undefined : undefined;
      const progressVal = idx.progress !== -1 ? fields[idx.progress] : undefined;
      const progressNum = progressVal ? parseInt(progressVal, 10) : undefined;

      items.push({
        type,
        label,
        description: idx.description !== -1 ? fields[idx.description] || undefined : undefined,
        startDate: fields[idx.startDate],
        endDate: idx.endDate !== -1 ? fields[idx.endDate] || undefined : undefined,
        row: rowIndex,
        color: colorVal,
        progress: progressNum != null && !isNaN(progressNum) ? progressNum : undefined,
      });
    }

    // If no metadata date range, compute from items
    if (!meta.startDate || !meta.endDate) {
      const dates = items.flatMap((item) => [item.startDate, item.endDate].filter(Boolean) as string[]);
      if (dates.length > 0) {
        dates.sort();
        if (!meta.startDate) meta.startDate = dates[0];
        if (!meta.endDate) meta.endDate = dates[dates.length - 1];
      }
    }

    return { items, rowLabels, meta };
  } catch {
    return null;
  }
}
