'use client';

import React from 'react';
import { TimelineItem, ThemeConfig } from '@/lib/types';
import { dateToPosition } from '@/lib/utils';

interface PhaseBarProps {
  item: TimelineItem;
  theme: ThemeConfig;
  startDate: string;
  endDate: string;
  contentWidth: number;
  paddingLeft: number;
  paddingTop: number;
  rowHeight: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function PhaseBar({
  item,
  theme,
  startDate,
  endDate,
  contentWidth,
  paddingLeft,
  paddingTop,
  rowHeight,
  isSelected,
  onClick,
}: PhaseBarProps) {
  // Phase bars sit at the top of each row
  const y = paddingTop + item.row * rowHeight + 4;

  const x = paddingLeft + dateToPosition(item.startDate, startDate, endDate, contentWidth);
  const xEnd = paddingLeft + dateToPosition(item.endDate || item.startDate, startDate, endDate, contentWidth);
  const barWidth = Math.max(xEnd - x, 20);

  const colorIndex = item.row % theme.colors.categories.length;
  const { effects } = theme;

  // Determine fill
  let fill: string;
  if (item.color) {
    fill = item.color;
  } else if (effects.barGradient) {
    const dir = effects.barGradientDirection === 'vertical' ? 'v' : 'h';
    if (theme.name === 'glass') {
      fill = `url(#bar-glass-${colorIndex})`;
    } else {
      fill = `url(#bar-gradient-${dir}-${colorIndex})`;
    }
  } else {
    fill = theme.colors.categories[colorIndex];
  }

  const opacity = effects.barOpacity ?? 0.85;
  // NOTE: glow filter is now applied at the row-group level in TimelineRenderer
  // so overlapping bars share a single glow pass instead of stacking

  let rx = 4;
  if (theme.barStyle === 'pill') rx = theme.itemHeight / 2;
  else if (theme.barStyle === 'sharp') rx = 0;

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
    >
      {/* Shadow (only for non-glow themes) */}
      {!effects.barGlow && (
        <rect
          x={x + 1}
          y={y + 1}
          width={barWidth}
          height={theme.itemHeight}
          rx={rx}
          fill="rgba(0,0,0,0.08)"
        />
      )}

      {/* Main bar */}
      <rect
        x={x}
        y={y}
        width={barWidth}
        height={theme.itemHeight}
        rx={rx}
        fill={fill}
        opacity={opacity}
        stroke={
          isSelected
            ? theme.colors.text
            : effects.barStroke
            ? effects.barStrokeColor || 'rgba(255,255,255,0.2)'
            : 'transparent'
        }
        strokeWidth={isSelected ? 2 : effects.barStroke ? (effects.barStrokeWidth || 1) : 0}
      />

      {/* Inner highlight overlay for 3D effect */}
      {effects.barInnerShadow && (
        <rect
          x={x}
          y={y}
          width={barWidth}
          height={theme.itemHeight}
          rx={rx}
          fill="url(#inner-highlight)"
          pointerEvents="none"
        />
      )}

      {/* Label */}
      {barWidth > 40 && (
        <text
          x={x + 10}
          y={y + theme.itemHeight / 2 + 1}
          fill="#FFFFFF"
          fontSize={11}
          fontWeight={500}
          fontFamily={theme.fontFamily}
          dominantBaseline="middle"
          filter={effects.textGlow ? 'url(#text-glow)' : undefined}
        >
          {item.label.length > barWidth / 7
            ? item.label.substring(0, Math.floor(barWidth / 7)) + '...'
            : item.label}
        </text>
      )}
    </g>
  );
}
