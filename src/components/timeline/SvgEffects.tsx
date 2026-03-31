'use client';

import React from 'react';
import { ThemeConfig } from '@/lib/types';

interface SvgEffectsProps {
  theme: ThemeConfig;
  width: number;
  height: number;
}

/**
 * Defines SVG <defs> for gradients, filters, and patterns used by themed bars.
 * Each bar references these by ID: `bar-gradient-{index}`, `glow-filter`, etc.
 */
export default function SvgEffects({ theme, width, height }: SvgEffectsProps) {
  const { effects, colors } = theme;

  return (
    <defs>
      {/* ── Per-category bar gradients ── */}
      {colors.categories.map((color, i) => (
        <React.Fragment key={`grad-${i}`}>
          {/* Horizontal gradient: color → lighter */}
          <linearGradient
            id={`bar-gradient-h-${i}`}
            x1="0%" y1="0%" x2="100%" y2="0%"
          >
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={lighten(color, 30)} stopOpacity={0.85} />
          </linearGradient>
          {/* Vertical gradient: lighter top → color bottom (3D/bubble) */}
          <linearGradient
            id={`bar-gradient-v-${i}`}
            x1="0%" y1="0%" x2="0%" y2="100%"
          >
            <stop offset="0%" stopColor={lighten(color, 50)} stopOpacity={0.95} />
            <stop offset="50%" stopColor={color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={darken(color, 20)} stopOpacity={1} />
          </linearGradient>
          {/* Glass gradient overlay */}
          <linearGradient
            id={`bar-glass-${i}`}
            x1="0%" y1="0%" x2="0%" y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <stop offset="60%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={darken(color, 15)} stopOpacity={0.8} />
          </linearGradient>
          {/* Frosted overlay: tinted frost on top of color */}
          <linearGradient
            id={`bar-frost-${i}`}
            x1="0%" y1="0%" x2="0%" y2="100%"
          >
            <stop offset="0%" stopColor={effects.frostColor || '#FFFFFF'} stopOpacity={0.92} />
            <stop offset="50%" stopColor={effects.frostColor || '#FFFFFF'} stopOpacity={0.78} />
            <stop offset="100%" stopColor={effects.frostColor || '#FFFFFF'} stopOpacity={0.6} />
          </linearGradient>
          {/* Frost-solid gradient: transparent top → opaque frosty bottom (bubble feel) */}
          <linearGradient
            id={`bar-frost-solid-${i}`}
            x1="0%" y1="0%" x2="0%" y2="100%"
          >
            <stop offset="0%" stopColor="#F0F0F6" stopOpacity={0.15} />
            <stop offset="35%" stopColor="#E8E9F0" stopOpacity={0.4} />
            <stop offset="70%" stopColor="#E2E3EC" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#DDDEE8" stopOpacity={0.88} />
          </linearGradient>
        </React.Fragment>
      ))}

      {/* ── Neumorphic shadow filters ── */}
      {effects.frostSolid && (
        <>
          <filter id="neu-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
          <filter id="neu-highlight" x="-10%" y="-10%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
          </filter>
        </>
      )}

      {/* ── Glow filter (soft falloff to avoid harsh row edges) ── */}
      {effects.barGlow && (
        <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={effects.barGlowRadius || 6}
            result="blur"
          />
          {/* Fade the blur to ~40% opacity for a soft, natural falloff */}
          <feComponentTransfer in="blur" result="softBlur">
            <feFuncA type="linear" slope="0.4" intercept="0" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="softBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}

      {/* ── Text glow filter (subtle) ── */}
      {effects.textGlow && (
        <filter id="text-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feComponentTransfer in="blur" result="softBlur">
            <feFuncA type="linear" slope="0.35" intercept="0" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="softBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}

      {/* ── Milestone glow filter (soft) ── */}
      {effects.milestoneGlow && (
        <filter id="milestone-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="softBlur">
            <feFuncA type="linear" slope="0.35" intercept="0" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="softBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}

      {/* ── Grid glow filter (subtle) ── */}
      {effects.gridGlow && (
        <filter id="grid-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feComponentTransfer in="blur" result="softBlur">
            <feFuncA type="linear" slope="0.3" intercept="0" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="softBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}

      {/* ── Background patterns ── */}
      {effects.bgPattern === 'scanlines' && (
        <pattern id="bg-pattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke={effects.bgPatternColor || '#FFF'} strokeWidth="1" opacity={effects.bgPatternOpacity || 0.03} />
        </pattern>
      )}

      {effects.bgPattern === 'dots' && (
        <pattern id="bg-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.5" fill={effects.bgPatternColor || '#FFF'} opacity={effects.bgPatternOpacity || 0.06} />
        </pattern>
      )}

      {effects.bgPattern === 'grid' && (
        <pattern id="bg-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={effects.bgPatternColor || '#FFF'} strokeWidth="0.5" opacity={effects.bgPatternOpacity || 0.04} />
        </pattern>
      )}

      {effects.bgPattern === 'stars' && (
        <pattern id="bg-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill={effects.bgPatternColor || '#FFF'} opacity={effects.bgPatternOpacity || 0.08} />
          <circle cx="40" cy="25" r="0.7" fill={effects.bgPatternColor || '#FFF'} opacity={(effects.bgPatternOpacity || 0.08) * 0.6} />
          <circle cx="25" cy="50" r="1.2" fill={effects.bgPatternColor || '#FFF'} opacity={effects.bgPatternOpacity || 0.08} />
          <circle cx="55" cy="5" r="0.5" fill={effects.bgPatternColor || '#FFF'} opacity={(effects.bgPatternOpacity || 0.08) * 0.4} />
          <circle cx="5" cy="40" r="0.8" fill={effects.bgPatternColor || '#FFF'} opacity={(effects.bgPatternOpacity || 0.08) * 0.7} />
        </pattern>
      )}

      {/* ── Inner shadow / highlight for 3D bars ── */}
      {effects.barInnerShadow && (
        <linearGradient id="inner-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity={0.0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.15} />
        </linearGradient>
      )}
    </defs>
  );
}

// ── Color utility helpers ──

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * percent / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const r = Math.max(0, ((num >> 16) & 0xFF) - Math.round(255 * percent / 100));
  const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * percent / 100));
  const b = Math.max(0, (num & 0xFF) - Math.round(255 * percent / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
