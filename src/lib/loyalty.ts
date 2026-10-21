import type { ActivityItem, LoyaltyAccount, LoyaltyErrorCode, RewardStatus } from './types';
import { LoyaltyError } from './types';

/** Nine purchased cups unlock the tenth, free cup. */
export const STAMPS_PER_REWARD = 9;
export const CARD_SLOTS = STAMPS_PER_REWARD + 1;

export const QR_PREFIX = 'himpil:member:';

export function qrPayload(memberCode: string) {
  return `${QR_PREFIX}${memberCode}`;
}

/** Accepts a scanned QR payload or a typed member code and returns the normalized code. */
export function parseMemberCode(input: string): string | null {
  const raw = input.trim();
  const code = (raw.toLowerCase().startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : raw)
    .toUpperCase()
    .replace(/\s+/g, '');
  return /^HMP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) ? code : null;
}

export function stampsRemaining(stamps: number) {
  return Math.max(0, STAMPS_PER_REWARD - stamps);
}

export function rewardStatus(account: LoyaltyAccount, activity: ActivityItem[]): RewardStatus {
  if (account.stamps >= STAMPS_PER_REWARD) return 'available';
  // Just redeemed: the new cycle has no stamps yet and the latest event is the redemption.
  if (account.stamps === 0 && activity[0]?.kind === 'redemption') return 'redeemed';
  return 'locked';
}

/** A card in the Rewards stack: the current card (any progress) or one already exchanged for a free drink. */
export interface StackedCard {
  cycle: number;
  stamps: number;
  current: boolean;
  /** First and ninth stamp, when that history is still loaded. */
  startedAt: string | null;
  completedAt: string | null;
  redeemed: { drink: string; at: string } | null;
}

/**
 * The current card first, then completed cards newest first. Built from the activity feed,
 * so no extra backend query is needed.
 */
export function stackedCards(account: LoyaltyAccount, activity: ActivityItem[]): StackedCard[] {
  const stampsByCycle = new Map<number, string[]>();
  for (const a of activity) {
    if (a.kind !== 'stamp') continue;
    const list = stampsByCycle.get(a.cycle) ?? [];
    for (let i = 0; i < a.stamps; i++) list.push(a.createdAt);
    stampsByCycle.set(a.cycle, list);
  }
  const span = (cycle: number) => {
    const dates = (stampsByCycle.get(cycle) ?? []).sort();
    return { startedAt: dates[0] ?? null, completedAt: dates.length >= STAMPS_PER_REWARD ? dates[STAMPS_PER_REWARD - 1]! : null };
  };

  const completed: StackedCard[] = activity
    .filter((a) => a.kind === 'redemption' && a.cycle !== account.cycle)
    .map((r) => ({ cycle: r.cycle, stamps: STAMPS_PER_REWARD, current: false, ...span(r.cycle), redeemed: { drink: r.drink, at: r.createdAt } }))
    .sort((a, b) => b.cycle - a.cycle);
  const current: StackedCard = { cycle: account.cycle, stamps: account.stamps, current: true, ...span(account.cycle), redeemed: null };
  return [current, ...completed];
}

export function progressMessage(stamps: number) {
  const left = stampsRemaining(stamps);
  if (left === 0) return 'Your free drink is ready!';
  return `${left} ${left === 1 ? 'cup' : 'cups'} left until a free drink!`;
}

/** Card progress as shown in the app: collected cups out of the card's ten cups. */
export function cupsLabel(stamps: number) {
  return `${stamps} / ${CARD_SLOTS}`;
}

export function progressPercent(stamps: number) {
  return Math.round((stamps / CARD_SLOTS) * 100);
}

const ERROR_TEXT: Record<LoyaltyErrorCode, string> = {
  NOT_STAFF: 'Staff access only. Please sign in with a barista account.',
  NOT_FOUND: 'We couldn’t find that loyalty card. Check the code and try again.',
  REWARD_PENDING: 'This card is complete. Redeem the free drink before adding new stamps.',
  REWARD_LOCKED: 'The free drink unlocks after 9 stamps.',
  EXCEEDS_CARD: 'That’s more stamps than the card has room for.',
  COOLDOWN: 'A stamp was just added to this card. Wait a few seconds before adding another.',
  AUTH: 'Please sign in again.',
  NETWORK: 'Connection problem. Check your internet and try again.',
  UNKNOWN: 'Unable to collect stamp. Please ask our barista.',
};

export function errorMessage(err: unknown): string {
  if (err instanceof LoyaltyError) return ERROR_TEXT[err.code] ?? err.message;
  if (err instanceof Error && err.message) return err.message;
  return ERROR_TEXT.UNKNOWN;
}
