export type CupState = 'filled' | 'empty' | 'free' | 'free-ready';

interface Props {
  state: CupState;
  /** Light variant for use on the dark bean surface. */
  onDark?: boolean;
  animate?: boolean;
  className?: string;
}

// Body tapers from x=9..39 at y=17 to x=13..35 at y=56 (sleeve between y=26 and y=46).
const LID_TOP = 'M12 4.5h24a2 2 0 0 1 2 2V10H10V6.5a2 2 0 0 1 2-2Z';
const LID_RIM = 'M7.5 10h33a2.5 2.5 0 0 1 2.5 2.5v2A2.5 2.5 0 0 1 40.5 17h-33A2.5 2.5 0 0 1 5 14.5v-2A2.5 2.5 0 0 1 7.5 10Z';
const BODY = 'M9 17h30l-3.7 38.6A3 3 0 0 1 32.3 58H15.7a3 3 0 0 1-3-2.4Z';
const SLEEVE = 'M9.9 26h28.2l-2 20H11.9Z';
const BEAN = 'M24 30.2c2.9 0 4.6 2.6 4.6 5.8s-1.7 5.8-4.6 5.8-4.6-2.6-4.6-5.8 1.7-5.8 4.6-5.8Z';
const CREASE = 'M24.4 30.6c-1.8 1.8-1.8 3.6 0 5.4s1.8 3.6 0 5.4';

const PALETTE = {
  light: { line: '#3E2416', lid: '#EBDCC6', body: '#F1E5D3', sleeve: '#C9A37E', bean: '#6B4A32' },
  dark: { line: '#2B1910', lid: '#E8D6BD', body: '#F3E8D8', sleeve: '#C9A37E', bean: '#5A3A26' },
};

/** Takeaway-cup stamp in the style of the physical Himpil loyalty card. */
export function CupStamp({ state, onDark = false, animate = false, className = '' }: Props) {
  const p = onDark ? PALETTE.dark : PALETTE.light;
  const anim = animate ? 'animate-stamp-pop' : '';

  if (state === 'free' || state === 'free-ready') {
    const ready = state === 'free-ready';
    const stroke = onDark ? '#F6EFE4' : ready ? '#3E2416' : '#6B4A32';
    return (
      <svg viewBox="0 0 48 60" className={`${className} ${anim}`} aria-hidden>
        <g fill={ready ? (onDark ? '#F6EFE4' : '#3E2416') : 'none'} stroke={stroke} strokeWidth={1.6} strokeDasharray={ready ? undefined : '3.2 2.6'} strokeLinejoin="round">
          <path d={LID_TOP} />
          <path d={LID_RIM} />
          <path d={BODY} />
        </g>
        <text
          x={24}
          y={41}
          textAnchor="middle"
          fontSize={9.5}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill={ready ? (onDark ? '#3E2416' : '#F6EFE4') : stroke}
        >
          Free
        </text>
      </svg>
    );
  }

  if (state === 'empty') {
    const line = onDark ? 'rgb(246 239 228 / 0.45)' : '#CDB89B';
    return (
      <svg viewBox="0 0 48 60" className={className} aria-hidden>
        <g fill={onDark ? 'rgb(246 239 228 / 0.06)' : '#FAF5ED'} stroke={line} strokeWidth={1.4} strokeLinejoin="round">
          <path d={BODY} />
          <path d={SLEEVE} fill="none" />
          <path d={LID_RIM} />
          <path d={LID_TOP} />
        </g>
        <g fill="none" stroke={line} strokeWidth={1.2}>
          <path d={BEAN} />
          <path d={CREASE} strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 60" className={`${className} ${anim}`} aria-hidden>
      <g stroke={p.line} strokeWidth={1.6} strokeLinejoin="round">
        <path d={BODY} fill={p.body} />
        <path d={SLEEVE} fill={p.sleeve} />
        <path d={LID_RIM} fill={p.lid} />
        <path d={LID_TOP} fill={p.lid} />
      </g>
      <path d={BEAN} fill={p.bean} stroke={p.line} strokeWidth={1} />
      <path d={CREASE} fill="none" stroke={p.sleeve} strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}
