# Feature: Rewards & Redemption

> Read this document when modifying reward unlock triggers, redemption flow, card stack history, or reward drinks menu.

---

## 1. Feature Purpose & Overview

The Rewards feature delivers on the brand promise: **"Buy 9, Get 1 Free"**.
- Collecting 9 stamps unlocks the 10th free cup.
- Once unlocked, the customer's card enters the `available` reward status.
- At the counter, the barista redeems the reward through `/staff`.
- The customer's account advances to cycle `n + 1`, resetting current stamps to 0.
- Completed cards are never deleted; they are permanently archived into the interactive 3D **Card Stack** on the Rewards page (`/rewards`).

---

## 2. Technical Architecture & File Map

| Component / File | Purpose |
|---|---|
| `src/pages/Rewards.tsx` | Main Rewards screen. Displays the 3D `CardStack`, "Show My QR Code" button when reward is ready, and chronological reward history. |
| `src/components/loyalty/CardStack.tsx` | Interactive 3D deck of current and past cards supporting pointer drag, velocity throwing, and keyboard navigation. |
| `src/lib/loyalty.ts` | Calculates `rewardStatus()`, `stampsRemaining()`, and constructs `stackedCards()`. |
| `src/lib/drinks.ts` | Menu drink catalog and beverage image resolvers (`drinkImage(drink)`). |
| `src/pages/Staff.tsx` | Barista redemption interface with two-step confirmation dialog. |

---

## 3. Redemption Mechanics & Lifecycle

```
Customer reaches 9 stamps
   │
   ▼
UI State: "Free drink ready · show your code to redeem"
   │
   ▼
Barista looks up customer on /staff
   │
   ├─ UI highlights: "Free drink ready"
   ├─ Selects free drink from menu
   ├─ Clicks "Redeem free drink" → prompts "Confirm free [Drink]?"
   │
   ▼
staffRedeemReward(memberCode, drink, requestId)
   │
   ├─ 1. Verifies caller role in public.staff_roles
   ├─ 2. Acquires row lock FOR UPDATE on loyalty_accounts
   ├─ 3. Verifies account.stamps = 9 (throws REWARD_LOCKED if < 9)
   ├─ 4. Checks idempotency: if request_id exists, returns existing customer view
   ├─ 5. Inserts into public.reward_redemptions (account_id, user_id, drink, cycle, staff_id, request_id)
   │     [Constraint UNIQUE (account_id, cycle) guarantees exactly 1 redemption per card]
   │
   └─ 6. Updates public.loyalty_accounts:
         set stamps = 0,
             cycle = cycle + 1,
             total_redeemed = total_redeemed + 1
```

---

## 4. The Historical Card Stack (`CardStack.tsx`)

The Rewards page features a physical 3D card deck representing the customer's loyalty journey:

### Data Construction Without Extra Tables
In `src/lib/loyalty.ts`, `stackedCards(account, activity)` constructs the deck purely by scanning the customer's `activity_feed`:
- Identifies all `redemption` records to derive completed cards.
- Matches `stamp` items by `cycle` to extract exact start and completion dates.
- Produces an array where `cards[0]` is the active card (progress 0–9), followed by historical cards in reverse chronological order.

### Visual Styling
- Completed cards in the stack display an authentic physical ink stamp:
  - Deep maroon ink border (`border-[#8a2f1d]/80`).
  - Text: `REDEEMED [DATE]`.
  - Rotated `-9deg` with CSS `mix-blend-multiply` to look stamped directly onto the cardboard artwork.

### Gestures & Physics
- **Pointer Dragging**: Uses `PointerEvent` API with `setPointerCapture`.
- **Directional Locking**: Axis locking prevents vertical page scrolling from interfering with horizontal card swipes.
- **Velocity Fling**: Flicking with `velocity > 0.45` throws the card offscreen (`THROW_MS = 280ms`).
- **Rubber-Banding**: Dragging beyond the bounds (past the newest card or oldest card) resists motion with a `0.25x` drag dampener.
- **Keyboard Access**: Left/Right arrow keys navigate between cards.

---

## 5. Drinks Catalog

Available drinks for stamps and redemption are declared in `src/lib/drinks.ts`:
- Caffè Latte
- Spanish Latte
- Cappuccino
- Flat White
- Americano
- Iced Americano
- Iced Coffee
- Espresso

Images are loaded from `/images/drinks/[slug].webp`.

