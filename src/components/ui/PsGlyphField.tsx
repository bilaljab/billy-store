import type { CSSProperties } from 'react';

const GLYPHS = ['△', '○', '✕', '□'];
const SIZE_BY_TIER = ['text-2xl', 'text-4xl', 'text-6xl'];
const OPACITY_BY_TIER = [0.10, 0.16, 0.22];
// Explicit tier per instance rather than `i % 3`: since GLYPHS has 4 entries and there
// are 3 tiers, a plain modulo pairs each glyph with a FIXED pair of tiers (4 and 3 are
// coprime) — △ and □ always landed on {0,1}, never the brightest tier 2, which is why
// □ in particular read as barely-there. These sequences give every glyph an even mix.
const TIER_SEQUENCE_DEFAULT = [2, 1, 2, 1, 1, 2, 1, 2]; // △○✕□△○✕□ → each glyph gets one tier-1 + one tier-2 turn
const TIER_SEQUENCE_SPARSE = [1, 2, 1, 2]; // △○✕□, one turn each

interface PsGlyphFieldProps {
  /** 'field' = animated ambient background motif. 'mark' = static brand mark (footer). */
  variant?: 'field' | 'mark';
  /** Instance count for the 'field' variant. */
  density?: 'sparse' | 'default';
  /** Positioning pattern for the 'field' variant. */
  layout?: 'ring' | 'scatter';
  className?: string;
}

function getPosition(layout: 'ring' | 'scatter', i: number, count: number): CSSProperties {
  if (layout === 'scatter') {
    const left = count > 1 ? 6 + (i / (count - 1)) * 82 : 45;
    const top = 10 + (i % 3) * 16;
    return { top: `${top}%`, left: `${left}%` };
  }
  // ring: two loose diagonal bands framing the content, alternating sides
  return i % 2 === 0
    ? { top: `${15 + i * 9}%`, right: `${4 + i * 5}%` }
    : { top: `${22 + i * 8}%`, left: `${3 + i * 6}%` };
}

export default function PsGlyphField({
  variant = 'field',
  density = 'default',
  layout = 'ring',
  className = '',
}: PsGlyphFieldProps) {
  if (variant === 'mark') {
    return (
      <span className={`text-muted text-xs tracking-widest ${className}`}>
        △ ○ ✕ □
      </span>
    );
  }

  const count = density === 'sparse' ? 4 : 8;
  const tierSequence = density === 'sparse' ? TIER_SEQUENCE_SPARSE : TIER_SEQUENCE_DEFAULT;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const tier = tierSequence[i];
        const duration = 14 + (i % 4) * 2;
        const delay = i * 0.6;

        return (
          <span
            key={i}
            className={`absolute ${SIZE_BY_TIER[tier]} font-bold text-ink animate-psglyph-drift`}
            style={{
              ...getPosition(layout, i, count),
              opacity: OPACITY_BY_TIER[tier],
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            {GLYPHS[i % 4]}
          </span>
        );
      })}
    </div>
  );
}
