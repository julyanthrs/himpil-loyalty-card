import { QRCodeSVG } from 'qrcode.react';
import { qrPayload } from '../../lib/loyalty';
import { Logo } from '../brand/Logo';

/** Outline coffee beans scattered around the panel edges, as in the app mockup. */
const BEANS: [number, number, number, number][] = [
  // left%, top%, rotation, size(px)
  [-2, 4, -30, 64], [10, 30, 20, 38], [-4, 52, 15, 58], [6, 80, -20, 50],
  [86, 2, 35, 60], [80, 30, -15, 40], [90, 50, 25, 62], [82, 82, -35, 54],
];

function BeanOutline({ size, rot, style }: { size: number; rot: number; style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 56" width={size} height={size * 1.4} style={{ ...style, transform: `rotate(${rot}deg)` }} className="absolute" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden>
      <ellipse cx="20" cy="28" rx="16" ry="25" />
      <path d="M20 4c6 8-6 16 0 24s-6 16 0 24" strokeLinecap="round" />
      <path d="M9 14c-3 6-3 22 0 28M31 14c3 6 3 22 0 28" strokeWidth={0.7} opacity={0.6} />
    </svg>
  );
}

/** The customer's personal code. Scanning it only identifies the card — stamps are added by staff. */
export function QrPanel({ memberCode, showLogo = true }: { memberCode: string; showLogo?: boolean }) {
  return (
    <div className="rounded-[1.6rem] bg-ivory p-2.5 shadow-card">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-[#efe4d3] px-6 pt-6 pb-6 text-center md:pt-8 md:pb-8">
        <div className="text-roasted/25">
          {BEANS.map(([l, t, r, s], i) => (
            <BeanOutline key={i} size={s} rot={r} style={{ left: `${l}%`, top: `${t}%` }} />
          ))}
        </div>
        <div className="relative">
          {showLogo && <Logo size={34} />}
          <div className={`mx-auto w-fit rounded-2xl bg-white p-4 shadow-soft md:p-5 ${showLogo ? 'mt-4' : ''}`}>
            <QRCodeSVG
              value={qrPayload(memberCode)}
              size={220}
              level="M"
              fgColor="#111111"
              bgColor="#ffffff"
              marginSize={0}
              title={`Himpil loyalty code ${memberCode}`}
              className="h-auto w-[min(48vw,220px)]"
            />
          </div>
          <p className="mt-5 font-serif text-[1.15rem] text-espresso md:text-[1.3rem]">Show this code to our barista</p>
          <p className="mt-1 font-serif text-[0.9rem] text-mocha">Scan to collect your stamp</p>
        </div>
      </div>
    </div>
  );
}
