# Decision: Client Idempotency Keys and Anti-Fraud Controls

## Context
Café point-of-sale environments frequently encounter poor cellular reception, Wi-Fi interference, accidental double-taps on touchscreens, and rapid consecutive customer scans. Without protection, this causes duplicate stamp awards or customer claims of lost stamps.

## Decision
Enforce a four-pillar anti-fraud and concurrency protection suite in the database and application:
1. **Client Request UUIDs (`request_id`)**: Every intended barista action generates a UUID before sending. Retrying the same mutation returns the current state idempotently without double-incrementing.
2. **Row Locking (`FOR UPDATE`)**: The customer's account row is locked during the transaction to prevent concurrent stamp writes.
3. **10-Second Cooldown**: The server rejects any stamp operation if `last_stamp_at` was within the preceding 10 seconds.
4. **Unique Redemption Constraint**: `UNIQUE (account_id, cycle)` on `reward_redemptions` ensures each card cycle can only be redeemed once.

## Reasoning
- Eliminates accidental double-charges and race conditions caused by network latency or jitter.
- Guarantees that even under network retry loops, exactly one transaction is committed.
- Stops dishonest baristas or customers from attempting rapid multiple stamps on a single purchase.

## Alternatives
- Client-side button debouncing only (insufficient: does not protect against page refreshes, network retries, or malicious requests).
- Rate limiting at API gateway / reverse proxy (does not understand customer-level business cycles or per-account state).

## Consequences
- Baristas must wait 10 seconds between scanning the same card twice. If a customer legitimately buys multiple drinks in one order, the barista must award multiple stamps in a single transaction using the quantity selector rather than scanning multiple times consecutively.

