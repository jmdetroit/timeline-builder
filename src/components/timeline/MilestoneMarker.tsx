'use client';

import React from 'react';
import { TimelineItem, ThemeConfig } from '@/lib/types';
import { dateToPosition, parseDate } from '@/lib/utils';

interface MilestoneMarkerProps {
  item: TimelineItem;
  theme: ThemeConfig;
  startDate: string;
  endDate: string;
  contentWidth: number;
  paddingLeft: number;
  paddingTop: number;
  rowHeight: number;
  phaseAreaHeight: number;
  isSelected: boolean;
  onClick: () => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMilestoneDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function MilestoneMarker({
  item,
  theme,
  startDate,
  endDate,
  contentWidth,
  paddingLeft,
  paddingTop,
  rowHeight,
  phaseAreaHeight,
  isSelected,
  onClick,
}: MilestoneMarkerProps) {
  // Milestones sit on their own sub-row below the phase bar area
  const milestoneY = paddingTop + item.row * rowHeight + phaseAreaHeight + 14;
  const x = paddingLeft + dateToPosition(item.startDate, startDate, endDate, contentWidth);
  const size = 8;

  const colorIndex = item.row % theme.colors.categories.length;
  const color = item.color || theme.colors.categories[colorIndex];
  const { effects } = theme;

  // NOTE: glow filter is now applied at the row-group level in TimelineRenderer

  const strokeProps = {
    stroke: isSelected ? theme.colors.text : effects.barStroke ? (effects.barStrokeColor || 'transparent') : 'transparent',
    strokeWidth: isSelected ? 2 : effects.barStroke ? (effects.barStrokeWidth || 1) : 0,
  };

  const renderShape = () => {
    if (theme.milestoneShape === 'diamond') {
      return (
        <polygon
          points={`${x},${milestoneY - size} ${x + size},${milestoneY} ${x},${milestoneY + size} ${x - size},${milestoneY}`}
          fill={color}
          {...strokeProps}
        />
      );
    } else if (theme.milestoneShape === 'circle') {
      return (
        <circle cx={x} cy={milestoneY} r={size} fill={color} {...strokeProps} />
      );
    } else if (theme.milestoneShape === 'star') {
      const points = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? size : size * 0.45;
        const angle = (Math.PI / 2) + (Math.PI * 2 * i) / 10;
        points.push(`${x + r * Math.cos(angle)},${milestoneY - r * Math.sin(angle)}`);
      }
      return (
        <polygon points={points.join(' ')} fill={color} {...strokeProps} />
      );
    } else {
      return (
        <rect
          x={x - size} y={milestoneY - size}
          width={size * 2} height={size * 2}
          fill={color} {...strokeProps}
        />
      );
    }
  };

  // Vertical tick line connecting milestone to the phase area above
  const tickTop = paddingTop + item.row * rowHeight + phaseAreaHeight + 2;

  const dateLabel = formatMilestoneDate(item.startDate);

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="button" tabIndex={0}>
      {/* Vertical tick line from phase area down to milestone */}
      <line
        x1={x}
        y1={tickTop}
        x2={x}
        y2={milestoneY - size - 1}
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
        strokeDasharray="2,2"
      />

      {/* Milestone shape */}
      {renderShape()}

      {/* Label: name */}
      <text
        x={x + size + 6}
        y={milestoneY - 2}
        fill={theme.colors.text}
        fontSize={10}
        fontWeight={600}
        fontFamily={theme.fontFamily}
        dominantBaseline="middle"
        filter={effects.textGlow ? 'url(#text-glow)' : undefined}
      >
        {item.label}
      </text>

      {/* Label: date */}
      <text
        x={x + size + 6}
        y={milestoneY + 10}
        fill={theme.colors.textMuted}
        fontSize={9}
        fontWeight={400}
        fontFamily={theme.fontFamily}
        dominantBaseline="middle"
      >
        {dateLabel}
      </text>
    </g>
  );
}
