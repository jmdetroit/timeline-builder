'use client';

import React, { useState, useRef, useCallback } from 'react';
import { TimelineItem, ThemeConfig } from '@/lib/types';
import { dateToPosition, positionToDate } from '@/lib/utils';

interface PhaseBarProps {
  item: TimelineItem;
  theme: ThemeConfig;
  startDate: string;
  endDate: string;
  contentWidth: number;
  paddingLeft: number;
  /** Absolute Y pixel coordinate of the top of this bar (already includes row offset & lane stacking) */
  barY: number;
  isSelected: boolean;
  showProgress: boolean;
  onClick: () => void;
  onDragUpdate?: (id: string, updates: Partial<TimelineItem>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDuplicate?: (id: string) => string | null;
  onRename?: (id: string, label: string) => void;
}

type DragMode = 'move' | 'resize-left' | 'resize-right' | null;

export default function PhaseBar({
  item,
  theme,
  startDate,
  endDate,
  contentWidth,
  paddingLeft,
  barY,
  isSelected,
  showProgress,
  onClick,
  onDragUpdate,
  onDragStart,
  onDragEnd,
  onDuplicate,
  onRename,
}: PhaseBarProps) {
  const y = barY;

  const x = paddingLeft + dateToPosition(item.startDate, startDate, endDate, contentWidth);
  const xEnd = paddingLeft + dateToPosition(item.endDate || item.startDate, startDate, endDate, contentWidth);
  const barWidth = Math.max(xEnd - x, 20);

  const colorIndex = item.row % theme.colors.categories.length;
  const { effects } = theme;

  const hasFrost = !!effects.frostOverlay;
  const hasFrostSolid = !!effects.frostSolid;
  const isFrostStyle = hasFrost || hasFrostSolid;

  const accentColor = item.color || theme.colors.categories[colorIndex];

  let fill: string;
  if (hasFrostSolid) {
    fill = theme.colors.surface;
  } else if (item.color) {
    fill = item.color;
  } else if (hasFrost) {
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

  let rx = 4;
  if (theme.barStyle === 'pill') rx = theme.itemHeight / 2;
  else if (theme.barStyle === 'sharp') rx = 0;

  // ── Inline editing state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitEdit = useCallback(() => {
    const trimmed = editLabel.trim();
    if (trimmed && trimmed !== item.label) {
      onRename?.(item.id, trimmed);
    }
    setIsEditing(false);
  }, [editLabel, item.label, item.id, onRename]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!onRename) return;
    e.stopPropagation();
    setEditLabel(item.label);
    setIsEditing(true);
    // Focus after render
    setTimeout(() => inputRef.current?.select(), 0);
  }, [item.label, onRename]);

  // ── Drag state ──
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const dragRef = useRef<{
    startMouseX: number;
    origX: number;
    origXEnd: number;
    svgEl: SVGSVGElement | null;
    dragItemId: string;
  } | null>(null);

  const getSvgPoint = useCallback((clientX: number, svgEl: SVGSVGElement) => {
    const pt = svgEl.createSVGPoint();
    pt.x = clientX;
    pt.y = 0;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return clientX;
    return pt.matrixTransform(ctm.inverse()).x;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: DragMode) => {
    if (!onDragUpdate) return;
    e.stopPropagation();
    e.preventDefault();
    const svgEl = (e.target as SVGElement).ownerSVGElement;
    if (!svgEl) return;
    const svgX = getSvgPoint(e.clientX, svgEl);

    let dragItemId = item.id;

    // ALT+drag on move = duplicate the item first
    if (e.altKey && mode === 'move' && onDuplicate) {
      const newId = onDuplicate(item.id);
      if (newId) {
        dragItemId = newId;
      }
    }

    dragRef.current = { startMouseX: svgX, origX: x, origXEnd: x + barWidth, svgEl, dragItemId };
    setDragMode(mode);
    onDragStart?.();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, [x, barWidth, getSvgPoint, onDragUpdate, onDragStart, onDuplicate, item.id]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragMode || !dragRef.current || !onDragUpdate) return;
    const { startMouseX, origX, origXEnd, svgEl, dragItemId } = dragRef.current;
    if (!svgEl) return;
    const currentX = getSvgPoint(e.clientX, svgEl);
    const dx = currentX - startMouseX;

    if (dragMode === 'move') {
      let newX = origX + dx;
      let newXEnd = origXEnd + dx;
      // Clamp to content area
      if (newX < paddingLeft) { newXEnd += paddingLeft - newX; newX = paddingLeft; }
      if (newXEnd > paddingLeft + contentWidth) { newX -= newXEnd - (paddingLeft + contentWidth); newXEnd = paddingLeft + contentWidth; }
      const newStart = positionToDate(newX - paddingLeft, startDate, endDate, contentWidth);
      const newEnd = positionToDate(newXEnd - paddingLeft, startDate, endDate, contentWidth);
      onDragUpdate(dragItemId, { startDate: newStart, endDate: newEnd });
    } else if (dragMode === 'resize-left') {
      let newX = Math.min(origX + dx, origXEnd - 20);
      newX = Math.max(newX, paddingLeft);
      const newStart = positionToDate(newX - paddingLeft, startDate, endDate, contentWidth);
      onDragUpdate(dragItemId, { startDate: newStart });
    } else if (dragMode === 'resize-right') {
      let newXEnd = Math.max(origXEnd + dx, origX + 20);
      newXEnd = Math.min(newXEnd, paddingLeft + contentWidth);
      const newEnd = positionToDate(newXEnd - paddingLeft, startDate, endDate, contentWidth);
      onDragUpdate(dragItemId, { endDate: newEnd });
    }
  }, [dragMode, getSvgPoint, onDragUpdate, paddingLeft, contentWidth, startDate, endDate]);

  const handlePointerUp = useCallback(() => {
    setDragMode(null);
    dragRef.current = null;
    onDragEnd?.();
  }, [onDragEnd]);

  // ── Progress rendering ──
  const progress = Math.max(0, Math.min(100, item.progress ?? 0));
  const progressWidth = (progress / 100) * barWidth;
  const showProgressBar = showProgress && item.type !== 'milestone';

  // Resize handle width
  const handleW = 6;

  return (
    <g
      onClick={(e) => { if (!dragMode && !isEditing) onClick(); }}
      style={{ cursor: dragMode === 'move' ? 'grabbing' : 'pointer' }}
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
          fill={effects.neuShadowColor || 'rgba(174,174,192,0.25)'}
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
          fill={effects.neuHighlightColor || 'rgba(255,255,255,0.8)'}
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

      {/* Frosted overlay (frostOverlay only) */}
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

      {/* Inner highlight overlay */}
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

      {/* ── Progress fill ── */}
      {showProgressBar && progress > 0 && (
        <g pointerEvents="none">
          {/* Clip to bar shape */}
          <clipPath id={`progress-clip-${item.id}`}>
            <rect x={x} y={y} width={barWidth} height={theme.itemHeight} rx={rx} />
          </clipPath>
          {/* Progress fill - subtle overlay */}
          <rect
            x={x}
            y={y}
            width={progressWidth}
            height={theme.itemHeight}
            fill={isFrostStyle ? accentColor : 'rgba(255,255,255,0.25)'}
            opacity={isFrostStyle ? 0.12 : 0.3}
            clipPath={`url(#progress-clip-${item.id})`}
          />
          {/* Progress edge line - crisp divider */}
          {progress > 2 && progress < 98 && (
            <line
              x1={x + progressWidth}
              y1={y + 3}
              x2={x + progressWidth}
              y2={y + theme.itemHeight - 3}
              stroke={isFrostStyle ? accentColor : 'rgba(255,255,255,0.5)'}
              strokeWidth={1.5}
              opacity={0.4}
              clipPath={`url(#progress-clip-${item.id})`}
            />
          )}
        </g>
      )}

      {/* Frost style: thin colored accent line at bottom of bar */}
      {isFrostStyle && (
        <rect
          x={x + 6}
          y={y + theme.itemHeight - 5}
          width={barWidth - 12}
          height={2.5}
          rx={1.25}
          fill={accentColor}
          opacity={hasFrostSolid ? 0.85 : 0.7}
          pointerEvents="none"
        />
      )}

      {/* ── Progress percentage badge ── */}
      {showProgressBar && progress > 0 && (() => {
        const pctText = `${progress}%`;
        const badgeWidth = progress === 100 ? 36 : progress >= 10 ? 32 : 28;
        // Position badge at right side of bar
        const badgeX = x + barWidth - badgeWidth - 6;
        const badgeY = y + (theme.itemHeight / 2);

        if (barWidth < 60) return null; // too narrow for badge

        return (
          <g pointerEvents="none">
            <rect
              x={badgeX}
              y={badgeY - 8}
              width={badgeWidth}
              height={16}
              rx={8}
              fill={progress === 100
                ? (isFrostStyle ? accentColor : 'rgba(255,255,255,0.3)')
                : (isFrostStyle ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.15)')
              }
            />
            <text
              x={badgeX + badgeWidth / 2}
              y={badgeY + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={progress === 100
                ? (isFrostStyle ? '#FFFFFF' : '#FFFFFF')
                : (isFrostStyle ? accentColor : 'rgba(255,255,255,0.85)')
              }
              fontSize={8}
              fontWeight={700}
              fontFamily={theme.fontFamily}
            >
              {pctText}
            </text>
          </g>
        );
      })()}

      {/* Label */}
      {barWidth > 40 && (() => {
        const maxChars = Math.floor((barWidth - (showProgressBar && progress > 0 && barWidth >= 60 ? 50 : 20)) / (effects.barLetterSpacing ? 10 : 7));
        const labelText = item.label.length > maxChars
          ? item.label.substring(0, maxChars) + '...'
          : item.label;
        const displayText = effects.barTextUppercase
          ? labelText.toUpperCase().split('').join(String.fromCharCode(8202).repeat(effects.barLetterSpacing || 1))
          : labelText;
        return (
          <text
            x={x + 10}
            y={y + theme.itemHeight / 2 + (isFrostStyle ? -1 : 1)}
            fill={isFrostStyle ? accentColor : '#FFFFFF'}
            fontSize={isFrostStyle ? 9 : 11}
            fontWeight={600}
            fontFamily={theme.fontFamily}
            dominantBaseline="middle"
            filter={effects.textGlow ? 'url(#text-glow)' : undefined}
            pointerEvents="none"
          >
            {displayText}
          </text>
        );
      })()}

      {/* ── Drag handles (visible when selected) ── */}
      {/* Move handle - full bar area */}
      <rect
        x={x + handleW}
        y={y}
        width={Math.max(barWidth - handleW * 2, 0)}
        height={theme.itemHeight}
        fill="transparent"
        style={{ cursor: dragMode === 'move' ? 'grabbing' : 'grab' }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />
      {/* Left resize handle */}
      <rect
        x={x}
        y={y}
        width={handleW}
        height={theme.itemHeight}
        fill="transparent"
        style={{ cursor: 'col-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-left')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {/* Right resize handle */}
      <rect
        x={x + barWidth - handleW}
        y={y}
        width={handleW}
        height={theme.itemHeight}
        fill="transparent"
        style={{ cursor: 'col-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-right')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Resize grip indicators (only when selected) */}
      {isSelected && barWidth > 40 && (
        <>
          <line x1={x + 2} y1={y + theme.itemHeight / 2 - 4} x2={x + 2} y2={y + theme.itemHeight / 2 + 4}
            stroke={isFrostStyle ? accentColor : 'rgba(255,255,255,0.6)'} strokeWidth={1.5} strokeLinecap="round" pointerEvents="none" />
          <line x1={x + barWidth - 2} y1={y + theme.itemHeight / 2 - 4} x2={x + barWidth - 2} y2={y + theme.itemHeight / 2 + 4}
            stroke={isFrostStyle ? accentColor : 'rgba(255,255,255,0.6)'} strokeWidth={1.5} strokeLinecap="round" pointerEvents="none" />
        </>
      )}

      {/* ── Inline label editing ── */}
      {isEditing && (
        <foreignObject x={x + 4} y={y + 2} width={barWidth - 8} height={theme.itemHeight - 4}>
          <input
            ref={inputRef}
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel((e.target as HTMLInputElement).value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'rgba(0,0,0,0.15)',
              color: isFrostStyle ? accentColor : '#FFFFFF',
              fontSize: isFrostStyle ? 9 : 11,
              fontWeight: 600,
              fontFamily: theme.fontFamily,
              padding: '0 4px',
              borderRadius: 4,
              boxSizing: 'border-box',
              textTransform: effects.barTextUppercase ? 'uppercase' : 'none',
              letterSpacing: effects.barLetterSpacing ? `${effects.barLetterSpacing}px` : 'normal',
            }}
          />
        </foreignObject>
      )}
    </g>
  );
}
