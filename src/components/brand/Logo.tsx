import type { CSSProperties } from 'react';
import logo from '../../brand/logo-official.json';

/**
 * Official Himpil logo — traced from Himpil's own photography by scripts/extract-logo.mjs.
 * Parts share one coordinate space; each part's path is offset vertically by its `y`.
 * Leaves and other counters are true cut-outs, so the logo works on any background.
 */
type Part = (typeof logo.parts)['mark'];
const { mark, wordmark, script } = logo.parts;

/** Wordmark width in em at the given `size` (keeps the old Playfair-wordmark proportions). */
const WORDMARK_EM = 2.7;
const EM = wordmark.width / WORDMARK_EM; // logo units per em

/** Traced paths store counters (the p's bowl, the leaves) as inner shapes, so they need even-odd filling. */
function PartPaths({ part }: { part: Part }) {
  return <path transform={`translate(0 ${part.y})`} d={part.d} fillRule="evenodd" />;
}

function viewBoxOf(parts: Part[]) {
  const x0 = Math.min(...parts.map((p) => p.x));
  const x1 = Math.max(...parts.map((p) => p.x + p.width));
  const y0 = Math.min(...parts.map((p) => p.y));
  const y1 = Math.max(...parts.map((p) => p.y + p.height));
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
}

interface MarkProps {
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function LogoMark({ color = 'var(--color-espresso)', className, style }: MarkProps) {
  const vb = viewBoxOf([mark]);
  return (
    <svg viewBox={`${vb.x0} ${vb.y0} ${vb.w} ${vb.h}`} className={className} style={style} fill={color} aria-hidden>
      <PartPaths part={mark} />
    </svg>
  );
}

/**
 * The logo exactly where it is printed on the source photo, in its printed color. Place it inside
 * a box with the photo's aspect ratio (the photo fills that box), and it tracks the photo's crop.
 */
export function LogoOnPhoto() {
  const parts = [mark, wordmark, script];
  const vb = viewBoxOf(parts);
  const { photo } = logo;
  return (
    <svg
      viewBox={`${vb.x0} ${vb.y0} ${vb.w} ${vb.h}`}
      className="absolute h-auto"
      style={{
        left: `${((photo.x + vb.x0 / photo.scale) / photo.width) * 100}%`,
        top: `${((photo.y + vb.y0 / photo.scale) / photo.height) * 100}%`,
        width: `${(vb.w / photo.scale / photo.width) * 100}%`,
      }}
      fill={logo.color}
      role="img"
      aria-label="Himpil"
    >
      {parts.map((p, i) => (
        <PartPaths key={i} part={p} />
      ))}
    </svg>
  );
}

export const PHOTO_ASPECT = logo.photo.width / logo.photo.height;

interface LogoProps {
  variant?: 'stacked' | 'inline';
  tone?: 'dark' | 'light';
  /** Scale in px (or any CSS length): the wordmark is 2.7× this wide. */
  size?: number | string;
  className?: string;
  /** Hide the Baybayin line (for very small sizes). */
  noScript?: boolean;
}

export function Logo({ variant = 'stacked', tone = 'dark', size = 40, className = '', noScript }: LogoProps) {
  const color = tone === 'dark' ? 'var(--color-espresso)' : 'var(--color-cream)';

  if (variant === 'inline') {
    const mvb = viewBoxOf([mark]);
    const wvb = viewBoxOf([wordmark]);
    return (
      <span className={`inline-flex items-center gap-[0.32em] ${className}`} style={{ fontSize: size, color }} role="img" aria-label="Himpil">
        <svg viewBox={`${mvb.x0} ${mvb.y0} ${mvb.w} ${mvb.h}`} style={{ height: '1.2em', width: 'auto' }} fill="currentColor" aria-hidden>
          <PartPaths part={mark} />
        </svg>
        <svg viewBox={`${wvb.x0} ${wvb.y0} ${wvb.w} ${wvb.h}`} style={{ width: `${wvb.w / EM}em`, height: 'auto' }} fill="currentColor" aria-hidden>
          <PartPaths part={wordmark} />
        </svg>
      </span>
    );
  }

  const parts = noScript ? [mark, wordmark] : [mark, wordmark, script];
  const vb = viewBoxOf(parts);
  return (
    <span className={`inline-flex ${className}`} style={{ fontSize: size, color }} role="img" aria-label="Himpil">
      <svg viewBox={`${vb.x0} ${vb.y0} ${vb.w} ${vb.h}`} style={{ width: `${vb.w / EM}em`, height: 'auto' }} fill="currentColor" aria-hidden>
        {parts.map((p, i) => (
          <PartPaths key={i} part={p} />
        ))}
      </svg>
    </span>
  );
}
