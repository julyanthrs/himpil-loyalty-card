# Feature: Stamp Collection

> Read this document when modifying how stamps are awarded, QR code display, scanner logic, or cooldown checks.

---

## 1. Feature Purpose & Overview

Stamp Collection is the primary operational transaction between customer and staff:
- Customers display their unique member QR code on `/scan` or the Home dashboard.
- Baristas scan the code using device camera on `/staff` (or enter the code manually).
- Baristas select the purchased beverage and quantity of stamps (1 to remaining slots).
- The system awards stamps atomically, enforcing limits and cooldowns.
- The customer's card updates in real time with audio-visual affirmation.

---

## 2. Customer QR Display & Experience

### Files Involved
- `src/pages/Scan.tsx`
- `src/components/loyalty/QrPanel.tsx`
- `src/lib/loyalty.ts` (`qrPayload`, `QR_PREFIX`)

### Screen Wake Lock API
In `Scan.tsx`, the custom hook `useWakeLock` requests a screen wake lock via `navigator.wakeLock.request('screen')`:
- Prevents the customer's phone from sleeping or locking while waiting in line at the counter.
- Gracefully releases the lock when navigating away or when the page visibility changes.

### QR Code Structure
- Generated using `qrcode.react` (`QRCodeSVG`).
- Format:
  ```text
  himpil:member:HMP-XXXX-XXXX
  ```
- Uses error correction level `M` for fast optical recognition in café ambient lighting.

---

## 3. Barista Scanning & Awarding Flow

### Files Involved
- `src/pages/Staff.tsx`
- `src/lib/loyalty.ts` (`parseMemberCode`)
- `src/data/service.ts` (`staffAwardStamps`)

### Optical Camera Scanner
- Implemented with the lightweight `qr-scanner` engine.
- Configured with `preferredCamera: 'environment'`, `highlightScanRegion: true`, and `maxScansPerSecond: 6`.
- Scanned string is passed through `parseMemberCode()`, which strips `himpil:member:` and normalizes whitespace/casing.
- Gracefully handles missing camera hardware or denied permissions by prompting the barista to use the manual code input.

### Transaction Controls
- **Quantity Selector**: Baristas can adjust stamp count with `+` / `-` buttons, bounded between `1` and `stampsRemaining` (`9 - currentStamps`).
- **Drink Selector**: Selects the drink from the `MENU` constant (`Caffè Latte`, `Spanish Latte`, etc.).

---

## 4. Backend Validation Rules

When `staffAwardStamps` is invoked:
1. **Staff Verification**: `assert_staff()` ensures caller is in `public.staff_roles`.
2. **Account Lock**: Acquires `FOR UPDATE` lock on `loyalty_accounts`.
3. **Idempotency**: If `request_id` already exists in `stamp_transactions`, the operation succeeds without re-incrementing stamps.
4. **Card Capacity**:
   - If `account.stamps >= 9`, throws `REWARD_PENDING` (must redeem reward first).
   - If `account.stamps + quantity > 9`, throws `EXCEEDS_CARD`.
5. **Cooldown**:
   - If `last_stamp_at > now() - interval '10 seconds'`, throws `COOLDOWN`.
   - Prevents accidental double-scans.
6. **Persistence**:
   - Inserts row into `stamp_transactions`.
   - Updates `loyalty_accounts.stamps`, `total_stamps`, and `last_stamp_at`.

---

## 5. Realtime Propagation

1. **Supabase Mode**:
   - `SupabaseService.subscribe` listens to PostgreSQL changes on `loyalty_accounts` filtered by `user_id = eq.${id}`.
   - Upon change, `LoyaltyContext.refresh()` pulls the latest profile, account, and activity.
2. **Demo Mode**:
   - `DemoService.staffAwardStamps` updates `localStorage` and dispatches `window.dispatchEvent(new Event('himpil-demo-change'))`.
   - Listens to both `himpil-demo-change` and cross-tab `storage` events.
3. **User Feedback**:
   - Toast notification appears: *"Stamp collected! You’re closer to your free drink."*
   - Newly filled cup plays bounce animation.

