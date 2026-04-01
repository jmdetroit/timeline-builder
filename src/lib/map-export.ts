'use client';

import { toPng } from 'html-to-image';

/**
 * Export the map canvas as an SVG file.
 * Grabs the <svg> rendered by react-simple-maps and serialises it.
 */
export function exportMapAsSvg() {
  const container = document.getElementById('map-export-root');
  if (!container) return;

  const svg = container.querySelector('svg');
  if (!svg) return;

  // Clone to avoid mutating the live DOM
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Ensure xmlns
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Embed computed background from the style attribute
  const bg = svg.style.background || svg.style.backgroundColor;
  if (bg) {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', bg);
    clone.insertBefore(bgRect, clone.firstChild);
  }

  // Add title if present
  const titleEl = container.querySelector('.map-title');
  const subtitleEl = container.querySelector('.map-subtitle');
  if (titleEl) {
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '40');
    titleText.setAttribute('y', '50');
    titleText.setAttribute('fill', titleEl instanceof HTMLElement ? getComputedStyle(titleEl).color : '#FFFFFF');
    titleText.setAttribute('font-size', '28');
    titleText.setAttribute('font-weight', '700');
    titleText.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    titleText.textContent = titleEl.textContent;
    clone.appendChild(titleText);

    if (subtitleEl) {
      const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subText.setAttribute('x', '40');
      subText.setAttribute('y', '76');
      subText.setAttribute('fill', subtitleEl instanceof HTMLElement ? getComputedStyle(subtitleEl).color : '#AAAAAA');
      subText.setAttribute('font-size', '14');
      subText.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      subText.textContent = subtitleEl.textContent;
      clone.appendChild(subText);
    }
  }

  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `map-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export the map canvas as a 2x PNG.
 */
export async function exportMapAsPng() {
  const container = document.getElementById('map-export-root');
  if (!container) return;

  try {
    const dataUrl = await toPng(container, {
      pixelRatio: 2,
      backgroundColor: undefined,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `map-${Date.now()}.png`;
    a.click();
  } catch (err) {
    console.error('PNG export failed:', err);
  }
}
