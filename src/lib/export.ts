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
  if (viewBox) {
    const parts = viewBox.split(' ').map(Number);
    if (parts.length === 4) {
      clone.setAttribute('width', parts[2].toString());
      clone.setAttribute('height', parts[3].toString());
    }
  }

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
