import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatDate } from '../../lib/format';
import { cupsLabel, progressMessage, STAMPS_PER_REWARD, type StackedCard } from '../../lib/loyalty';
import { CardBackArt } from './CardArt';

const THROW_MS = 280;
/** How many cards peek out from under the top one. */
const PEEK = 2;

const chip = 'absolute top-[5%] inline-flex items-center gap-[0.8cqw] rounded-full px-[2cqw] py-[0.6cqw] text-[2.3cqw] font-medium';

/** One card: the original card back with its collected cups filled, plus a "redeemed" ink stamp once used. */
function StackCard({ card }: { card: StackedCard }) {
  const ready = card.stamps >= STAMPS_PER_REWARD;
  return (
    <div className="@container relative size-full overflow-hidden rounded-[1.5rem] shadow-card select-none">
      <CardBackArt stamps={card.stamps} redeemed={!!card.redeemed} />
      <span className={`${chip} left-[3.5%] bg-espresso/75 tracking-wide text-cream`}>{card.current ? 'Current card' : `Card ${card.cycle}`}</span>
      {card.redeemed ? (
        <div className="pointer-events-none absolute top-[37%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[9deg] rounded-[1.4cqw] border-[0.7cqw] border-double border-[#8a2f1d]/80 px-[3.2cqw] py-[1.2cqw] text-center text-[#8a2f1d]/85 mix-blend-multiply">
          <p className="text-[5.6cqw] leading-none font-bold tracking-[0.18em]">REDEEMED</p>
          <p className="mt-[0.8cqw] text-[1.9cqw] font-semibold tracking-[0.1em] uppercase">{formatDate(card.redeemed.at)}</p>
        </div>
      ) : ready ? (
        <span className={`${chip} right-[3.5%] bg-espresso text-ivory`}>
          <Gift className="size-[2.6cqw]" aria-hidden /> Free drink ready
        </span>
      ) : (
        <span className={`${chip} right-[3.5%] bg-ivory/90 font-serif text-espresso`}>{cupsLabel(card.stamps)}</span>
      )}
    </div>
  );
}

function describe(card: StackedCard) {
  if (!card.redeemed) {
    if (card.stamps >= STAMPS_PER_REWARD) return 'Complete! Show your QR code at the counter to get your free drink.';
    const started = card.startedAt ? ` · Started ${formatDate(card.startedAt)}` : '';
    return `${progressMessage(card.stamps)}${started}`;
  }
  const done = card.completedAt ? `Completed ${formatDate(card.completedAt)}` : 'Completed';
  return `${done} · Free ${card.redeemed.drink} on ${formatDate(card.redeemed.at)}`;
}

/**
 * The loyalty cards as a physical stack: the current card on top, then completed cards, newest first.
 * Swipe left for older cards, right to bring the newer one back (buttons and arrow keys do the same).
 */
export function CardStack({ cards }: { cards: StackedCard[] }) {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; axis: 'x' | 'y' | null; lastX: number; lastT: number; v: number } | null>(null);

  const hasPrev = index > 0;
  const hasNext = index < cards.length - 1;
  const width = () => box.current?.offsetWidth ?? 360;

  const go = (dir: 1 | -1) => {
    if (busy || (dir === 1 ? !hasNext : !hasPrev)) return void setDx(0);
    setBusy(true);
    setDragging(false);
    // Next: throw the top card off to the left. Previous: slide the newer card back in from the left.
    setDx(dir === 1 ? -width() * 1.25 : width() * 1.1);
    window.setTimeout(() => {
      setIndex((i) => i + dir);
      setDx(0);
      setBusy(false);
    }, THROW_MS);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const mx = e.clientX - d.x;
    const my = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
      d.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (d.axis === 'y') return void (drag.current = null);
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    // Rubber-band when there is nothing further in that direction.
    const blocked = (mx < 0 && !hasNext) || (mx > 0 && !hasPrev);
    setDx(blocked ? mx * 0.25 : mx);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.axis !== 'x') return;
    setDragging(false);
    const far = Math.abs(dx) > width() * 0.25;
    const flick = Math.abs(d.v) > 0.45 && Math.abs(dx) > 20;
    if ((far || flick) && dx < 0 && hasNext) go(1);
    else if ((far || flick) && dx > 0 && hasPrev) go(-1);
    else setDx(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else return;
    e.preventDefault();
  };

  const w = width();
  // 0 → 1 as the top card leaves (left) or the newer card comes back (right).
  const p = Math.min(1, Math.abs(dx) / w);
  const transition = dragging ? 'none' : `transform ${THROW_MS}ms cubic-bezier(.2,.8,.2,1), opacity ${THROW_MS}ms`;

  // One transform shape for every layer, so a card handed from one role to another never jumps.
  const style = (x: number, depth: number, z: number): React.CSSProperties => ({
    transform: `translate(${x}px, ${depth * 16}px) rotate(${(x / w) * 9}deg) scale(${1 - depth * 0.055})`,
    opacity: Math.max(0, Math.min(1, PEEK + 1 - depth)),
    zIndex: z,
    transition,
  });

  const revealing = dx > 0 && hasPrev;
  const layers: { card: StackedCard; style: React.CSSProperties }[] = [];
  if (revealing) layers.push({ card: cards[index - 1]!, style: style(dx - w * 1.1, 0, 30) });
  for (let d = 0; d <= PEEK + 1 && index + d < cards.length; d++) {
    const card = cards[index + d]!;
    if (d === 0) layers.push({ card, style: revealing ? style(0, p, 20) : style(dx, 0, 20) });
    else layers.push({ card, style: style(0, dx < 0 && hasNext ? d - p : revealing ? d + p : d, 10 - d) });
  }

  const shown = cards[index]!;

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div
        ref={box}
        role="group"
        aria-roledescription="card stack"
        aria-label={`Your loyalty cards, ${index + 1} of ${cards.length}. Use the arrow keys to move between cards.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={`relative mb-16 aspect-[1050/600] touch-pan-y rounded-[1.5rem] ${cards.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {layers
          .slice()
          .reverse()
          .map(({ card, style }) => (
            <div key={card.cycle} className="absolute inset-0 origin-bottom will-change-transform motion-reduce:!transition-none" style={style}>
              <StackCard card={card} />
            </div>
          ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={!hasPrev}
          aria-label="Newer card"
          className="flex size-10 items-center justify-center rounded-full bg-ivory text-espresso shadow-soft ring-1 ring-latte/60 transition hover:bg-cream disabled:opacity-35"
        >
          <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
        <div className="min-w-0 flex-1 text-center" aria-live="polite">
          <p className="font-serif text-[1.2rem] text-espresso">
            {shown.current ? `Current card · ${cupsLabel(shown.stamps)}` : `Card ${shown.cycle}`}
          </p>
          <p className="mt-0.5 text-[0.82rem] text-subtle">{describe(shown)}</p>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={!hasNext}
          aria-label="Older card"
          className="flex size-10 items-center justify-center rounded-full bg-ivory text-espresso shadow-soft ring-1 ring-latte/60 transition hover:bg-cream disabled:opacity-35"
        >
          <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {cards.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {cards.map((c, i) => (
            <span key={c.cycle} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-espresso' : 'w-1.5 bg-latte'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
