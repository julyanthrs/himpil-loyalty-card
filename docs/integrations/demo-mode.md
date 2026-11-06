# Integration: Demo Mode

> Read this document when troubleshooting local testing without backend, inspecting demo state, or modifying demo seed data.

---

## 1. Purpose & Overview

Demo Mode is a zero-configuration, fully offline-capable simulation layer built directly into the client.
- Activates automatically when Supabase credentials are not provided.
- Persists mock state in the browser's `localStorage` (`himpil-demo-v2`).
- Simulates realistic network delays (`120ms`–`400ms`).
- Emulates the entire barista stamping, cooldown, error handling, and redemption lifecycle.
- Syncs state instantly across multiple browser tabs.

---

## 2. Storage & State Lifecycle

### Storage Keys & Events
- **Storage Key**: `himpil-demo-v2`.
- **Internal Event**: `himpil-demo-change` (for updates within the same window).
- **Cross-Tab Event**: Standard DOM `storage` event (listens for changes triggered by another tab).

### In-Memory Fallback
If `localStorage` is disabled or blocked (e.g. strict private browsing or security sandbox), `DemoService` keeps a memory-resident `memory: DemoState | null` instance, ensuring the application remains interactive without throwing exceptions.

---

## 3. Seed State Schema

When initialized for the first time, `seed()` generates a rich pre-populated state for **Alex Rivera**:

```typescript
{
  signedIn: true,
  profile: {
    id: 'demo-user',
    fullName: 'Alex Rivera',
    email: 'alex@example.com',
    avatarUrl: null,
    memberSince: '<158 days ago>',
    notifyStamps: true,
    notifyOffers: false
  },
  account: {
    memberCode: 'HMP-7Q4K-2MXD',
    stamps: 7,               // 7 out of 9 stamps collected
    cycle: 4,                // Currently on 4th card cycle
    totalStamps: 34,         // 3 completed cards (27) + 7 on current card
    totalRedeemed: 3         // 3 past free drinks redeemed
  },
  activity: [ ... ],         // 34 stamps + 3 redemption events
  processedRequests: [],
  lastStampAt: 0
}
```

This rich seed allows immediate visual inspection of:
- The active card with 7 filled cups.
- The 3D historical card stack on `/rewards` with 3 completed, stamped cards.
- A populated chronological activity history on `/activity`.

---

## 4. Multi-Tab Barista Simulation

To test the interaction between customer and barista:
1. Open Tab 1 to `http://localhost:5173/scan`.
2. Open Tab 2 to `http://localhost:5173/staff`.
3. Changes made in Tab 2 write to `localStorage` and fire the `storage` event.
4. Tab 1 captures the `storage` event through `DemoService.subscribe`, calling `LoyaltyContext.refresh()`.
5. Tab 1 immediately updates the card, triggers the cup bounce animation, and presents a toast.

---

## 5. Resetting Demo State

- A customer can reset the demo state at any time via **Profile → Reset demo data**.
- Invoking `demo.reset()` re-seeds `localStorage` with the initial 7-stamp state and dispatches the change event across all open tabs.

