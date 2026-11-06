# Security Model & Row-Level Security (RLS)

> Read this document before altering permissions, writing queries, changing RPCs, or touching auth guards.

---

## 1. Threat Model & Security Posture

A virtual loyalty program is susceptible to multiple client-side attack vectors:
1. **Malicious Client Writes**: An authenticated customer using browser DevTools or `curl` sending direct SQL updates to increment stamps on their own account.
2. **Man-In-The-Middle / QR Replay**: A customer photographing someone else's QR code or intercepting network traffic to fraudulently claim rewards.
3. **Double-Scanning / Network Glitches**: A barista accidentally tapping "Add Stamp" twice or a flaky mobile connection causing duplicate submissions.
4. **Race Conditions**: Concurrent requests attempting to claim multiple free drinks on the 9th stamp before the cycle counter increments.

Himpil addresses each of these vectors through a **zero-trust database architecture**.

---

## 2. Row-Level Security (RLS) Policies

All tables have RLS enabled (`alter table ... enable row level security`):

| Table | Policy Name | Command | Target Role | Using / With Check Clause |
|---|---|---|---|---|
| `public.profiles` | "Read own profile" | `SELECT` | `authenticated` | `id = (select auth.uid())` |
| `public.profiles` | "Update own profile" | `UPDATE` | `authenticated` | `id = (select auth.uid())` |
| `public.staff_roles` | "Read own staff role" | `SELECT` | `authenticated` | `user_id = (select auth.uid())` |
| `public.loyalty_accounts` | "Read own account" | `SELECT` | `authenticated` | `user_id = (select auth.uid())` |
| `public.stamp_transactions` | "Read own transactions" | `SELECT` | `authenticated` | `user_id = (select auth.uid())` |
| `public.reward_redemptions` | "Read own redemptions" | `SELECT` | `authenticated` | `user_id = (select auth.uid())` |

---

## 3. Defense-in-Depth: Column-Level Privilege Revocations

RLS policies govern row visibility, but SQL table-level grants determine which operations are permissible.
In `0001_himpil_loyalty.sql`, write privileges are completely stripped from clients:

```sql
-- 1. Strip all privileges from anonymous unauthenticated users
revoke all on public.profiles, public.staff_roles, public.loyalty_accounts,
              public.stamp_transactions, public.reward_redemptions, public.activity_feed from anon;

-- 2. Strip table-level insert, update, delete, truncate from authenticated users
revoke insert, update, delete, truncate on public.profiles, public.staff_roles, public.loyalty_accounts,
              public.stamp_transactions, public.reward_redemptions from authenticated;

-- 3. Grant SELECT only
grant select on public.profiles, public.staff_roles, public.loyalty_accounts,
             public.stamp_transactions, public.reward_redemptions, public.activity_feed to authenticated;

-- 4. Whitelist safe profile update columns ONLY
grant update (full_name, notify_stamps, notify_offers) on public.profiles to authenticated;
```

**Security Result**:
Even if an authenticated customer discovers the database endpoint and bypasses the frontend code, **PostgreSQL rejects any direct `INSERT` or `UPDATE` into `loyalty_accounts`, `stamp_transactions`, or `reward_redemptions`** at the database engine level.

---

## 4. `SECURITY DEFINER` Mutation Functions

Because clients cannot write to loyalty tables, all changes must flow through elevated `SECURITY DEFINER` stored procedures.

### Search Path Sanitization
To prevent PostgreSQL search-path hijacking attacks, all stored functions explicitly declare:
```sql
set search_path = ''
```
This forces all object references in the functions to be fully qualified (e.g. `public.loyalty_accounts`).

### Staff Verification Gate
Every staff procedure begins with:
```sql
perform public.assert_staff();
```
Which evaluates:
```sql
if not exists (select 1 from public.staff_roles where user_id = (select auth.uid())) then
  raise exception 'NOT_STAFF' using errcode = 'P0001';
end if;
```
If the caller is not in `public.staff_roles`, execution halts immediately.

---

## 5. Anti-Fraud & Concurrency Controls

### 1. Row Locking (`FOR UPDATE`)
Inside `staff_award_stamps` and `staff_redeem_reward`:
```sql
select * into acct from public.loyalty_accounts a
 where a.member_code = upper(trim(p_member_code))
 for update;
```
This locks the account row for the duration of the transaction. Any concurrent requests are serialized, preventing race conditions.

### 2. Idempotency via Client Request UUIDs
Every barista action generates a random UUID (`request_id`).
```sql
if exists (select 1 from public.stamp_transactions t where t.request_id = p_request_id) then
  return query select * from public.staff_lookup(p_member_code);
  return;
end if;
```
If a mobile network drops and resends the payload, the server returns the current state without duplicating stamps.

### 3. Rapid-Fire Cooldown
To prevent accidental double-scanning at the counter:
```sql
if acct.last_stamp_at is not null and acct.last_stamp_at > now() - interval '10 seconds' then
  raise exception 'COOLDOWN' using errcode = 'P0001';
end if;
```
A 10-second barrier blocks consecutive stamp awards on the same card.

### 4. Single Redemption Guarantee
In `reward_redemptions`:
```sql
unique (account_id, cycle)
```
Because the cycle number is fixed during the redemption transaction, it is mathematically impossible to record two redemptions for the same card cycle.

### 5. QR Code Security
The customer QR code contains only `himpil:member:HMP-XXXX-XXXX`.
- It does **not** contain authentication tokens or session data.
- Possessing or photographing the QR code grants **zero** authority to award stamps or claim rewards.
- The QR code functions purely as an identifier scanned by the authenticated barista.

