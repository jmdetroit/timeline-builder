import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ViewMode } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function daysBetween(start: string, end: string): number {
  const s = parseDate(start);
  const e = parseDate(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function dateToPosition(
  date: string,
  rangeStart: string,
  rangeEnd: string,
  totalWidth: number
): number {
  const total = daysBetween(rangeStart, rangeEnd);
  if (total === 0) return 0;
  const offset = daysBetween(rangeStart, date);
  return (offset / total) * totalWidth;
}

export function positionToDate(
  x: number,
  rangeStart: string,
  rangeEnd: string,
  totalWidth: number
): string {
  const total = daysBetween(rangeStart, rangeEnd);
  const days = Math.round((x / totalWidth) * total);
  const start = parseDate(rangeStart);
  start.setDate(start.getDate() + days);
  return formatDate(start);
}

export function getTimeColumns(
  view: ViewMode,
  startDate: string,
  endDate: string
): { label: string; subLabel?: string; start: string; end: string }[] {
  const columns: { label: string; subLabel?: string; start: string; end: string }[] = [];
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (view === 'yearly') {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    for (let y = startYear; y <= endYear; y++) {
      columns.push({
        label: y.toString(),
        start: `${y}-01-01`,
        end: `${y}-12-31`,
      });
    }
  } else if (view === 'quarterly') {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    for (let y = startYear; y <= endYear; y++) {
      for (let q = 1; q <= 4; q++) {
        const qStart = new Date(y, (q - 1) * 3, 1);
        const qEnd = new Date(y, q * 3, 0);
        if (qStart > end) break;
        if (qEnd < start) continue;
        columns.push({
          label: `Q${q}`,
          subLabel: y.toString(),
          start: formatDate(qStart),
          end: formatDate(qEnd),
        });
      }
    }
  } else {
    // monthly
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    while (current <= end) {
      const mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      columns.push({
        label: monthNames[current.getMonth()],
        subLabel: current.getFullYear().toString(),
        start: formatDate(current),
        end: formatDate(mEnd),
      });
      current.setMonth(current.getMonth() + 1);
    }
  }

  return columns;
}

export function clampDate(date: string, min: string, max: string): string {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}
