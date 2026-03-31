'use client';

import React, { useCallback, useMemo } from 'react';
import { useTimelineStore } from '@/lib/store';
import { getTheme } from '@/lib/themes';
import SvgEffects from './SvgEffects';
import TimelineGrid from './TimelineGrid';
import PhaseBar from './PhaseBar';
import MilestoneMarker from './MilestoneMarker';

// Layout constants
const TITLE_AREA = 56;       // Space for title + subtitle
const HEADER_GAP = 28;       // Gap between subtitle and column headers
const MILESTONE_ROW_HEIGHT = 24; // Dedicated height for milestone sub-row

interface TimelineRendererProps {
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export default function TimelineRenderer({ svgRef }: TimelineRendererProps) {
  const items = useTimelineStore((s) => s.items);
  const settings = useTimelineStore((s) => s.settings);
  const selectedItemId = useTimelineStore((s) => s.selectedItemId);
  const setSelectedItem = useTimelineStore((s) => s.setSelectedItem);
  const customTheme = useTimelineStore((s) => s.customTheme);

  const theme = settings.theme === 'custom' ? customTheme : getTheme(settings.theme);
  const rowCount = Math.max(settings.rowLabels.length, 1);

  // Row layout: each row has a phase area + a milestone sub-row
  const phaseAreaHeight = theme.itemHeight + theme.itemGap;
  const rowHeight = phaseAreaHeight + MILESTONE_ROW_HEIGHT + 4; // phase + milestone + gap

  const paddingTop = TITLE_AREA + HEADER_GAP + 30; // title + gap + column header space
  const padding = { top: paddingTop, left: 160, right: 30, bottom: 40 };
  const width = 1200;
  const height = padding.top + rowCount * rowHeight + padding.bottom;
  const contentWidth = width - padding.left - padding.right;

  // Pre-compute which rows have milestones
  const rowHasMilestones = useMemo(() => {
    const set = new Set<number>();
    items.filter(i => i.type === 'milestone').forEach(i => set.add(i.row));
    return set;
  }, [items]);

  const handleItemClick = useCallback(
    (id: string) => { setSelectedItem(id); },
    [setSelectedItem]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedItem(null);
  }, [setSelectedItem]);

  const phases = items.filter((item) => item.type === 'phase' || item.type === 'task');
  const milestones = items.filter((item) => item.type === 'milestone');
  const { effects } = theme;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{
        maxWidth: width,
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
        rowHeight={rowHeight}
        milestoneRowHeight={MILESTONE_ROW_HEIGHT}
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

        // Wrap each row's bars in a group — glow filter applied at group level
        // so overlapping bars within a row share one glow pass
        return (
          <g key={`row-phases-${rowIndex}`} filter={effects.barGlow ? 'url(#glow-filter)' : undefined}>
            {rowPhases.map((item) => (
              <PhaseBar
                key={item.id}
                item={item}
                theme={theme}
                startDate={settings.startDate}
                endDate={settings.endDate}
                contentWidth={contentWidth}
                paddingLeft={padding.left}
                paddingTop={padding.top}
                rowHeight={rowHeight}
                isSelected={selectedItemId === item.id}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </g>
        );
      })}

      {/* ── Milestones (on their own dedicated sub-row) ── */}
      {settings.rowLabels.map((_, rowIndex) => {
        const rowMilestones = milestones.filter(item => item.row === rowIndex);
        if (rowMilestones.length === 0) return null;

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
                paddingTop={padding.top}
                rowHeight={rowHeight}
                phaseAreaHeight={phaseAreaHeight}
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
