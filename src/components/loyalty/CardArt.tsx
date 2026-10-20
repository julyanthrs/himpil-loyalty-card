import art from '../../brand/card-back.json';
import { CARD_SLOTS, STAMPS_PER_REWARD } from '../../lib/loyalty';

/** Front of the physical Himpil card (original artwork) plus the "Buy 9, Get 1 Free" line from the app. */
export function CardFrontArt() {
  return (
    <div className="@container relative size-full overflow-hidden bg-bean">
      <img src="/brand/card-front.webp" alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
      <p className="absolute inset-x-0 top-[73%] text-center font-serif text-[5.2cqw] leading-none text-[#e3cdb0] [text-shadow:0_1px_6px_rgb(30_17_10/0.6)]">
        Buy 9, Get 1 Free
      </p>
    </div>
  );
}

/**
 * Back of the physical card (original artwork). Collected cups are revealed from a pre-filled copy
 * of the same artwork, clipped to each cup, so the original line drawings stay untouched.
 */
export function CardBackArt({ stamps, popIndex }: { stamps: number; popIndex?: number }) {
  const ready = stamps >= STAMPS_PER_REWARD;
  return (
    <div className="@container relative size-full overflow-hidden bg-[#c4a98c]">
      <img src="/brand/card-back.webp" alt="" className="absolute inset-0 size-full" draggable={false} />
      {art.cups.slice(0, CARD_SLOTS).map((cup, i) => {
        const filled = i < STAMPS_PER_REWARD ? i < stamps : ready;
        if (!filled) return null;
        const pop = i === popIndex || (i === STAMPS_PER_REWARD && popIndex === STAMPS_PER_REWARD - 1);
        return (
          <img
            key={i}
            src="/brand/card-back-filled.webp"
            alt=""
            draggable={false}
            className={`absolute inset-0 size-full ${pop ? 'animate-stamp-pop' : ''}`}
            style={{
              clipPath: `inset(${cup.top}% ${100 - cup.left - cup.width}% ${100 - cup.top - cup.height}% ${cup.left}%)`,
              transformOrigin: `${cup.left + cup.width / 2}% ${cup.top + cup.height / 2}%`,
            }}
          />
        );
      })}
      {ready && (
        <span
          className="pointer-events-none absolute animate-pulse rounded-[18%] ring-[0.5cqw] ring-cream/80"
          style={{
            left: `${art.cups[9]!.left - 1}%`,
            top: `${art.cups[9]!.top - 2}%`,
            width: `${art.cups[9]!.width + 2}%`,
            height: `${art.cups[9]!.height + 4}%`,
          }}
        />
      )}
      {/* The printed paragraph, re-set as text (typos from the print file corrected). */}
      <p
        className="absolute inset-x-[6%] flex items-center justify-center text-center text-[1.82cqw] leading-[1.5] font-bold text-[#6a3d1f]"
        style={{ top: `${art.text.top}%`, height: `${art.text.height}%` }}
      >
        <span>
          Enjoy your favorite brew with our exclusive loyalty program. Buy 9 cups of coffee
          <br />
          and get the 10th one absolutely free! It’s our way of saying
          <br />
          thank you for being part of the Himpil family. Start collecting
          <br />
          your stamps today and savor the rewards of great coffee.
          <br />
          Cheers to loyalty!
        </span>
      </p>
    </div>
  );
}
