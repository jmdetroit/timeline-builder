'use client';

import React, { useCallback, useMemo } from 'react';
import { useTimelineStore } from '@/lib/store';
import { TimelineItem } from '@/lib/types';
import { getTheme } from '@/lib/themes';
import SvgEffects from './SvgEffects';
import TimelineGrid from './TimelineGrid';
import PhaseBar from './PhaseBar';
import MilestoneMarker from './MilestoneMarker';

// Layout constants
const TITLE_AREA = 56;       // Space for title + subtitle
const HEADER_GAP = 28;       // Gap between subtitle and column headers
const MILESTONE_ROW_HEIGHT = 24; // Dedicated height for milestone sub-row
const BASE_WIDTH = 1200;

interface TimelineRendererProps {
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

// Assigns each row's phase/task items to stack lanes so overlapping ranges don't collide.
// Returns a map: itemId → laneIndex, plus the number of lanes used per row.
function computeStackLanes(items: TimelineItem[], rowCount: number, enabled: boolean) {
  const laneByItem = new Map<string, number>();
  const lanesPerRow: number[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowItems = items
      .filter((i) => i.row === rowIndex && (i.type === 'phase' || i.type === 'task'))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (!enabled) {
      rowItems.forEach((it) => laneByItem.set(it.id, 0));
      lanesPerRow.push(1);
      continue;
    }

    // Greedy lane assignment. A lane is an array of {end} of the last item placed.
    const laneEnds: string[] = [];
    rowItems.forEach((it) => {
      const start = it.startDate;
      const end = it.endDate || it.startDate;
      let placed = -1;
      for (let i = 0; i < laneEnds.length; i++) {
        if (start >= laneEnds[i]) {
          placed = i;
          laneEnds[i] = end;
          break;
        }
      }
      if (placed === -1) {
        placed = laneEnds.length;
        laneEnds.push(end);
      }
      laneByItem.set(it.id, placed);
    });
    lanesPerRow.push(Math.max(laneEnds.length, 1));
  }

  return { laneByItem, lanesPerRow };
}

export default function TimelineRenderer({ svgRef }: TimelineRendererProps) {
  const items = useTimelineStore((s) => s.items);
  const settings = useTimelineStore((s) => s.settings);
  const selectedItemId = useTimelineStore((s) => s.selectedItemId);
  const setSelectedItem = useTimelineStore((s) => s.setSelectedItem);
  const updateItem = useTimelineStore((s) => s.updateItem);
  const customTheme = useTimelineStore((s) => s.customTheme);

  const theme = settings.theme === 'custom' ? customTheme : getTheme(settings.theme);
  const rowCount = Math.max(settings.rowLabels.length, 1);

  // ── Zoom-scaled width ──
  const zoom = Math.max(0.5, Math.min(4, settings.zoom ?? 1));
  const width = Math.round(BASE_WIDTH * zoom);

  // ── Per-row stack lane computation ──
  const stackEnabled = settings.layoutMode === 'stacked';
  const { laneByItem, lanesPerRow } = useMemo(
    () => computeStackLanes(items, rowCount, stackEnabled),
    [items, rowCount, stackEnabled]
  );

  // ── Row geometry (per-row heights & tops) ──
  const paddingTop = TITLE_AREA + HEADER_GAP + 30;
  const padding = { top: paddingTop, left: 160, right: 30, bottom: 40 };

  const baseItemHeight = theme.itemHeight;
  const singleLaneArea = baseItemHeight + theme.itemGap; // original phase area
  const laneStep = baseItemHeight + 4; // additional lane height per extra lane

  const rowPhaseHeights = lanesPerRow.map(
    (depth) => singleLaneArea + (depth - 1) * laneStep
  );
  const rowHeights = rowPhaseHeights.map((ph) => ph + MILESTONE_ROW_HEIGHT + 4);
  const rowTops: number[] = [];
  {
    let acc = padding.top;
    for (let i = 0; i < rowCount; i++) {
      rowTops.push(acc);
      acc += rowHeights[i];
    }
  }

  const totalRowHeight = rowHeights.reduce((a, b) => a + b, 0);
  const height = padding.top + totalRowHeight + padding.bottom;
  const contentWidth = width - padding.left - padding.right;

  const handleItemClick = useCallback(
    (id: string) => { setSelectedItem(id); },
    [setSelectedItem]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedItem(null);
  }, [setSelectedItem]);

  const beginDrag = useTimelineStore((s) => s.beginDrag);
  const endDrag = useTimelineStore((s) => s.endDrag);
  const duplicateItem = useTimelineStore((s) => s.duplicateItem);

  const handleDragUpdate = useCallback(
    (id: string, updates: Partial<TimelineItem>) => {
      updateItem(id, updates);
    },
    [updateItem]
  );

  const handleDragStart = useCallback(() => { beginDrag(); }, [beginDrag]);
  const handleDragEnd = useCallback(() => { endDrag(); }, [endDrag]);
  const handleDuplicate = useCallback((id: string) => duplicateItem(id), [duplicateItem]);
  const handleRename = useCallback((id: string, label: string) => updateItem(id, { label }), [updateItem]);

  const phases = items.filter((item) => item.type === 'phase' || item.type === 'task');
  const milestones = items.filter((item) => item.type === 'milestone');
  const { effects } = theme;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        display: 'block',
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: theme.fontFamily,
        backgroundColor: theme.colors.background,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* SVG Defs: gradients, filters, patterns */}
      <SvgEffects theme={theme} width={width} height={height} />

      {/* Background */}
      <rect x={0} y={0} width={width} height={height} fill={theme.colors.background} />

      {/* Background pattern overlay */}
      {effects.bgPattern && effects.bgPattern !== 'none' && (
        <rect x={0} y={0} width={width} height={height} fill="url(#bg-pattern)" />
      )}

      {/* ── Title area (with generous spacing) ── */}
      <text
        x={width / 2}
        y={24}
        textAnchor="middle"
        fill={theme.colors.text}
        fontSize={20}
        fontWeight={700}
        fontFamily={theme.headingFont}
        filter={effects.textGlow ? 'url(#text-glow)' : undefined}
      >
        {settings.title}
      </text>
      {settings.subtitle && (
        <text
          x={width / 2}
          y={46}
          textAnchor="middle"
          fill={theme.colors.textMuted}
          fontSize={13}
          fontFamily={theme.fontFamily}
          filter={effects.textGlow ? 'url(#text-glow)' : undefined}
        >
          {settings.subtitle}
        </text>
      )}

      {/* Grid */}
      <TimelineGrid
        width={width}
        height={height}
        padding={padding}
        theme={theme}
        rowTops={rowTops}
        rowHeights={rowHeights}
        rowPhaseHeights={rowPhaseHeights}
      />

      {/* Click catcher for deselection */}
      <rect
        x={padding.left}
        y={padding.top}
        width={contentWidth}
        height={height - padding.top - padding.bottom}
        fill="transparent"
        onClick={handleBackgroundClick}
      />

      {/* ── Phase bars (rendered per-row group to isolate glow) ── */}
      {settings.rowLabels.map((_, rowIndex) => {
        const rowPhases = phases.filter(item => item.row === rowIndex);
        if (rowPhases.length === 0) return null;

        return (
          <g key={`row-phases-${rowIndex}`} filter={effects.barGlow ? 'url(#glow-filter)' : undefined}>
            {rowPhases.map((item) => {
              const lane = laneByItem.get(item.id) ?? 0;
              const barY = rowTops[rowIndex] + 4 + lane * laneStep;
              return (
                <PhaseBar
                  key={item.id}
                  item={item}
                  theme={theme}
                  startDate={settings.startDate}
                  endDate={settings.endDate}
                  contentWidth={contentWidth}
                  paddingLeft={padding.left}
                  barY={barY}
                  isSelected={selectedItemId === item.id}
                  showProgress={settings.showProgress !== false}
                  onClick={() => handleItemClick(item.id)}
                  onDragUpdate={handleDragUpdate}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDuplicate={handleDuplicate}
                  onRename={handleRename}
                />
              );
            })}
          </g>
        );
      })}

      {/* ── Milestones (on their own dedicated sub-row) ── */}
      {settings.rowLabels.map((_, rowIndex) => {
        const rowMilestones = milestones.filter(item => item.row === rowIndex);
        if (rowMilestones.length === 0) return null;

        const milestoneY = rowTops[rowIndex] + rowPhaseHeights[rowIndex] + 14;
        const tickTop = rowTops[rowIndex] + rowPhaseHeights[rowIndex] + 2;

        return (
          <g key={`row-milestones-${rowIndex}`} filter={effects.milestoneGlow ? 'url(#milestone-glow)' : undefined}>
            {rowMilestones.map((item) => (
              <MilestoneMarker
                key={item.id}
                item={item}
                theme={theme}
                startDate={settings.startDate}
                endDate={settings.endDate}
                contentWidth={contentWidth}
                paddingLeft={padding.left}
                milestoneY={milestoneY}
                tickTop={tickTop}
                isSelected={selectedItemId === item.id}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
