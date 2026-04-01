'use client';

import React from 'react';
import { MapPattern } from '@/lib/map-types';

interface MapPatternsProps {
  landPattern: MapPattern;
  landPatternColor: string;
  landPatternOpacity: number;
  landPatternScale: number;
  oceanPattern: MapPattern;
  oceanPatternColor: string;
  oceanPatternOpacity: number;
  oceanPatternScale: number;
}

export default function MapPatterns({
  landPattern,
  landPatternColor,
  landPatternOpacity,
  landPatternScale,
  oceanPattern,
  oceanPatternColor,
  oceanPatternOpacity,
  oceanPatternScale,
}: MapPatternsProps) {
  return (
    <>
      {landPattern !== 'none' && renderPattern('land-pattern', landPattern, landPatternColor, landPatternOpacity, landPatternScale)}
      {oceanPattern !== 'none' && renderPattern('ocean-pattern', oceanPattern, oceanPatternColor, oceanPatternOpacity, oceanPatternScale)}
    </>
  );
}

function renderPattern(id: string, pattern: MapPattern, color: string, opacity: number, scale: number) {
  const s = scale;

  switch (pattern) {
    case 'dots': {
      const w = 12 * s;
      const r = 1.2 * s;
      return (
        <pattern id={id} x="0" y="0" width={w} height={w} patternUnits="userSpaceOnUse">
          <circle cx={w / 2} cy={w / 2} r={r} fill={color} opacity={opacity} />
        </pattern>
      );
    }

    case 'gridlines': {
      const w = 20 * s;
      return (
        <pattern id={id} x="0" y="0" width={w} height={w} patternUnits="userSpaceOnUse">
          <path d={`M ${w} 0 L 0 0 0 ${w}`} fill="none" stroke={color} strokeWidth={0.5 * Math.max(s, 0.5)} opacity={opacity} />
        </pattern>
      );
    }

    case 'scanlines': {
      const h = 4 * s;
      return (
        <pattern id={id} x="0" y="0" width={h} height={h} patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2={h} y2="0" stroke={color} strokeWidth={1 * Math.max(s, 0.5)} opacity={opacity} />
        </pattern>
      );
    }

    case 'hex': {
      const w = 28 * s;
      const h = 48.5 * s;
      const hw = w / 2;
      const sh = h * (8.5 / 48.5);
      const mh = h * (25.5 / 48.5);
      const fh = h * (34 / 48.5);
      return (
        <pattern id={id} x="0" y="0" width={w} height={h} patternUnits="userSpaceOnUse">
          <path
            d={`M${hw} 0 L${w} ${sh} L${w} ${mh} L${hw} ${fh} L0 ${mh} L0 ${sh} Z`}
            fill="none"
            stroke={color}
            strokeWidth={0.6 * Math.max(s, 0.5)}
            opacity={opacity}
          />
          <path
            d={`M${hw} ${fh} L${w} ${h * (42.5 / 48.5)} L${w} ${h * (59.5 / 48.5)} L${hw} ${h * (68 / 48.5)} L0 ${h * (59.5 / 48.5)} L0 ${h * (42.5 / 48.5)} Z`}
            fill="none"
            stroke={color}
            strokeWidth={0.6 * Math.max(s, 0.5)}
            opacity={opacity}
            transform={`translate(${hw}, ${-h * (14.25 / 48.5)})`}
          />
        </pattern>
      );
    }

    case 'dither': {
      const w = 4 * s;
      const half = w / 2;
      return (
        <pattern id={id} x="0" y="0" width={w} height={w} patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width={half} height={half} fill={color} opacity={opacity} />
          <rect x={half} y={half} width={half} height={half} fill={color} opacity={opacity} />
        </pattern>
      );
    }

    case 'crosshatch': {
      const w = 10 * s;
      return (
        <pattern id={id} x="0" y="0" width={w} height={w} patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2={w} y2={w} stroke={color} strokeWidth={0.5 * Math.max(s, 0.5)} opacity={opacity} />
          <line x1={w} y1="0" x2="0" y2={w} stroke={color} strokeWidth={0.5 * Math.max(s, 0.5)} opacity={opacity} />
        </pattern>
      );
    }

    default:
      return null;
  }
}
