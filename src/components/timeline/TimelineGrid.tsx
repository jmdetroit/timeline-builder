'use client';

import React from 'react';
import { ThemeConfig } from '@/lib/types';
import { getTimeColumns, dateToPosition } from '@/lib/utils';
import { useTimelineStore } from '@/lib/store';

interface TimelineGridProps {
  width: number;
  height: number;
  padding: { top: number; left: number; right: number; bottom: number };
  theme: ThemeConfig;
  /** Top Y of each row */
  rowTops: number[];
  /** Total height of each row (phase area + milestone sub-row) */
  rowHeights: number[];
  /** Phase area height of each row (may vary in stacked mode) */
  rowPhaseHeights: number[];
}

export default function TimelineGrid({ width, height, padding, theme, rowTops, rowHeights, rowPhaseHeights }: TimelineGridProps) {
  const settings = useTimelineStore((s) => s.settings);
  const contentWidth = width - padding.left - padding.right;
  const columns = getTimeColumns(settings.view, settings.startDate, settings.endDate);

  const { effects } = theme;
  const gridDash = effects.gridStyle === 'dashed' ? '6,4' : effects.gridStyle === 'dotted' ? '2,4' : undefined;
  const gridFilter = effects.gridGlow ? 'url(#grid-glow)' : undefined;

  return (
    <g>
      {/* Column backgrounds (alternating) */}
      {columns.map((col, i) => {
        const x = dateToPosition(col.start, settings.startDate, settings.endDate, contentWidth);
        const xEnd = dateToPosition(col.end, settings.startDate, settings.endDate, contentWidth);
        const colWidth = xEnd - x;
        return (
          <rect
            key={`col-bg-${i}`}
            x={padding.left + x}
            y={padding.top}
            width={colWidth}
            height={height - padding.top - padding.bottom}
            fill={i % 2 === 0 ? 'transparent' : theme.colors.surface}
            opacity={0.5}
          />
        );
      })}

      {/* Vertical grid lines */}
      {settings.showGrid &&
        columns.map((col, i) => {
          const x = dateToPosition(col.start, settings.startDate, settings.endDate, contentWidth);
          return (
            <line
              key={`grid-${i}`}
              x1={padding.left + x}
              y1={padding.top}
              x2={padding.left + x}
              y2={height - padding.bottom}
              stroke={theme.colors.gridLine}
              strokeWidth={1}
              strokeDasharray={gridDash}
              filter={gridFilter}
            />
          );
        })}

      {/* Column headers — positioned with generous gap below title */}
      {columns.map((col, i) => {
        const x = dateToPosition(col.start, settings.startDate, settings.endDate, contentWidth);
        const xEnd = dateToPosition(col.end, settings.startDate, settings.endDate, contentWidth);
        const midX = padding.left + x + (xEnd - x) / 2;
        return (
          <g key={`header-${i}`}>
            <text
              x={midX}
              y={padding.top - 20}
              textAnchor="middle"
              fill={theme.colors.text}
              fontSize={13}
              fontWeight={600}
              fontFamily={theme.fontFamily}
              filter={effects.textGlow ? 'url(#text-glow)' : undefined}
            >
              {col.label}
            </text>
            {col.subLabel && (
              <text
                x={midX}
                y={padding.top - 6}
                textAnchor="middle"
                fill={theme.colors.textMuted}
                fontSize={10}
                fontFamily={theme.fontFamily}
              >
                {col.subLabel}
              </text>
            )}
          </g>
        );
      })}

      {/* Row labels — centered vertically in the phase area of each row */}
      {settings.showLabels &&
        settings.rowLabels.map((label, i) => {
          const y = (rowTops[i] ?? padding.top) + (rowPhaseHeights[i] ?? 0) / 2;
          return (
            <text
              key={`row-${i}`}
              x={padding.left - 12}
              y={y + 2}
              textAnchor="end"
              fill={theme.colors.textSecondary}
              fontSize={12}
              fontFamily={theme.fontFamily}
              dominantBaseline="middle"
              filter={effects.textGlow ? 'url(#text-glow)' : undefined}
            >
              {label}
            </text>
          );
        })}

      {/* Horizontal row separators — at the bottom of each full row (below milestone area) */}
      {settings.rowLabels.map((_, i) => {
        const y = (rowTops[i] ?? padding.top) + (rowHeights[i] ?? 0);
        return (
          <line
            key={`row-line-${i}`}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke={theme.colors.gridLine}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        );
      })}

      {/* Event lines */}
      {(settings.eventLines || []).map((evt) => {
        if (evt.date < settings.startDate || evt.date > settings.endDate) return null;
        const x = padding.left + dateToPosition(evt.date, settings.startDate, settings.endDate, contentWidth);
        const dashMap = { dashed: '6,3', dotted: '2,4', solid: undefined };
        return (
          <g key={evt.id}>
            <line
              x1={x}
              y1={padding.top}
              x2={x}
              y2={height - padding.bottom}
              stroke={evt.color}
              strokeWidth={1.5}
              strokeDasharray={dashMap[evt.style] || undefined}
              opacity={evt.opacity ?? 0.7}
            />
            <text
              x={x}
              y={height - padding.bottom + 14}
              textAnchor="middle"
              fill={evt.color}
              fontSize={9}
              fontWeight={600}
              fontFamily={theme.fontFamily}
            >
              {evt.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Today marker */}
      {(() => {
        if (settings.showTodayMarker === false) return null;
        const today = new Date().toISOString().split('T')[0];
        if (today >= settings.startDate && today <= settings.endDate) {
          const x = padding.left + dateToPosition(today, settings.startDate, settings.endDate, contentWidth);
          return (
            <g>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={height - padding.bottom}
                stroke={theme.colors.primary}
                strokeWidth={1.5}
                strokeDasharray="6,3"
                opacity={0.6}
              />
              <text
                x={x}
                y={height - padding.bottom + 14}
                textAnchor="middle"
                fill={theme.colors.primary}
                fontSize={9}
                fontWeight={600}
                fontFamily={theme.fontFamily}
              >
                TODAY
              </text>
            </g>
          );
        }
        return null;
      })()}
    </g>
  );
}
