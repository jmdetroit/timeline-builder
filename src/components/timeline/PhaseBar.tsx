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

  const hasFrost = !!effects.frostOverlay;
  const hasFrostSolid = !!effects.frostSolid;
  const isFrostStyle = hasFrost || hasFrostSolid;

  // Determine fill
  let fill: string;
  if (item.color) {
    fill = item.color;
  } else if (hasFrostSolid) {
    // Neumorphic: solid near-white
    fill = '#E8E8EE';
  } else if (hasFrost) {
    // Frost overlay: solid color as base (frost overlay added separately)
    fill = theme.colors.categories[colorIndex];
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
      {/* Shadow (only for non-glow, non-neumorphic themes) */}
      {!effects.barGlow && !hasFrostSolid && (
        <rect
          x={x + 1}
          y={y + 1}
          width={barWidth}
          height={theme.itemHeight}
          rx={rx}
          fill="rgba(0,0,0,0.08)"
        />
      )}

      {/* Neumorphic: dark shadow (bottom-right) */}
      {hasFrostSolid && (
        <rect
          x={x + 2}
          y={y + 2}
          width={barWidth}
          height={theme.itemHeight}
          rx={rx}
          fill="rgba(174,174,192,0.25)"
          filter="url(#neu-shadow)"
        />
      )}

      {/* Neumorphic: light highlight (top-left) */}
      {hasFrostSolid && (
        <rect
          x={x - 1.5}
          y={y - 1.5}
          width={barWidth}
          height={theme.itemHeight}
          rx={rx}
          fill="rgba(255,255,255,0.8)"
          filter="url(#neu-highlight)"
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

      {/* Frosted overlay: tinted frost on top of vivid color (frostOverlay only) */}
      {hasFrost && (
        <rect
          x={x}
          y={y}
          width={barWidth}
          height={theme.itemHeight}
          rx={rx}
          fill={`url(#bar-frost-${colorIndex})`}
          pointerEvents="none"
        />
      )}

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

      {/* Frost style: thin colored accent line at bottom of bar */}
      {isFrostStyle && (
        <rect
          x={x + 6}
          y={y + theme.itemHeight - 5}
          width={barWidth - 12}
          height={2.5}
          rx={1.25}
          fill={theme.colors.categories[colorIndex]}
          opacity={hasFrostSolid ? 0.85 : 0.7}
          pointerEvents="none"
        />
      )}

      {/* Label */}
      {barWidth > 40 && (() => {
        const labelText = item.label.length > barWidth / (effects.barLetterSpacing ? 10 : 7)
          ? item.label.substring(0, Math.floor(barWidth / (effects.barLetterSpacing ? 10 : 7))) + '...'
          : item.label;
        const displayText = effects.barTextUppercase
          ? labelText.toUpperCase().split('').join(String.fromCharCode(8202).repeat(effects.barLetterSpacing || 1))
          : labelText;
        return (
          <text
            x={x + 10}
            y={y + theme.itemHeight / 2 + (isFrostStyle ? -1 : 1)}
            fill={isFrostStyle ? theme.colors.categories[colorIndex] : '#FFFFFF'}
            fontSize={isFrostStyle ? 9 : 11}
            fontWeight={600}
            fontFamily={theme.fontFamily}
            dominantBaseline="middle"
            filter={effects.textGlow ? 'url(#text-glow)' : undefined}
          >
            {displayText}
          </text>
        );
      })()}
    </g>
  );
}
