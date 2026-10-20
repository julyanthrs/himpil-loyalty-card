/**
 * Coffee-branch line illustration (leaves + cherries), drawn in currentColor so it can sit
 * on cream or on the dark bean surface. Geometry is computed once at module load.
 */

type Pt = [number, number];

function leaf([x, y]: Pt, angle: number, len: number, width: number) {
  const w = width;
  const outline = `M0 0C${w} ${-len * 0.25} ${w * 0.9} ${-len * 0.75} 0 ${-len}C${-w * 0.9} ${-len * 0.75} ${-w} ${-len * 0.25} 0 0Z`;
  let veins = `M0 -2Q${w * 0.08} ${-len * 0.5} 0 ${-len * 0.94}`;
  for (let i = 1; i <= 4; i++) {
    const t = -len * (0.18 + i * 0.16);
    const reach = w * (0.75 - i * 0.08);
    veins += `M0 ${t}Q${reach * 0.5} ${t - len * 0.04} ${reach} ${t - len * 0.12}`;
    veins += `M0 ${t}Q${-reach * 0.5} ${t - len * 0.04} ${-reach} ${t - len * 0.12}`;
  }
  return { transform: `translate(${x} ${y}) rotate(${angle})`, outline, veins };
}

const BRANCH = {
  stem: 'M8 292C46 250 70 214 92 170C112 130 140 96 186 70C214 54 244 44 276 40',
  twig: 'M92 170C120 172 146 186 166 206',
  leaves: [
    leaf([40, 255], -38, 70, 22),
    leaf([62, 226], 62, 64, 20),
    leaf([88, 176], -20, 74, 24),
    leaf([118, 120], 72, 70, 22),
    leaf([150, 92], -6, 66, 21),
    leaf([196, 66], 80, 62, 20),
    leaf([236, 48], 18, 54, 18),
    leaf([166, 206], 120, 58, 18),
  ],
  cherries: [
    [104, 150], [114, 160], [98, 162], [132, 186], [142, 196], [126, 200], [212, 62], [222, 72],
  ] as Pt[],
};

export function Botanical({ className = '', strokeWidth = 1.4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 300 300" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={BRANCH.stem} strokeWidth={strokeWidth * 1.3} />
      <path d={BRANCH.twig} strokeWidth={strokeWidth} />
      {BRANCH.leaves.map((l, i) => (
        <g key={i} transform={l.transform}>
          <path d={l.outline} strokeWidth={strokeWidth} />
          <path d={l.veins} strokeWidth={strokeWidth * 0.6} />
        </g>
      ))}
      {BRANCH.cherries.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r={7} strokeWidth={strokeWidth} />
          <path d="M-3 -2.5Q-1.5 -4.5 1 -4.6" strokeWidth={strokeWidth * 0.6} />
          <path d="M2 4.4L2.8 6.2M2 4.4L0.6 6M2 4.4L3.6 5" strokeWidth={strokeWidth * 0.6} />
        </g>
      ))}
    </svg>
  );
}
