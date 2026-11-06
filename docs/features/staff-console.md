# Feature: Staff / Barista Console

> Read this document when modifying the barista interface at `/staff`, staff authorization, lookup, or barista controls.

---

## 1. Feature Purpose & Overview

The Barista Console (`/staff`) is the internal point-of-sale companion app used by coffee shop staff behind the counter.
- Provides high-speed QR code scanning of customer cards.
- Supports manual customer code entry (`HMP-XXXX-XXXX`) for damaged screens or low-light conditions.
- Displays current card progress, member name, and cycle count.
- Awards stamps with drink association and automatic slot clamping.
- Handles reward redemption with explicit confirmation to prevent accidental loss of completed cards.

---

## 2. Access Control & Authorization

| Mode | Authorization Logic |
|---|---|
| **Demo Mode** | Always returns `true` for `isStaff()`. Anyone can access `/staff` to test the end-to-end stamping flow. |
| **Live Mode (Supabase)** | Calls Postgres function `public.is_staff()`. If the user is unauthenticated, redirects to `/login`. If the authenticated user is not in `public.staff_roles`, renders a locked "Staff access only" warning screen (`ShieldAlert`). |

### Staff Roles Table
Only users with a row in `public.staff_roles` can call staff RPCs:
```sql
insert into public.staff_roles (user_id, role)
values ('<user-uuid>', 'barista'); -- role: 'barista' or 'manager'
```

---

## 3. Workflow & Component Architecture

### 1. Customer Lookup
- **Scanner Component**: Activates device rear camera via `QrScanner`. Detects code matching `himpil:member:HMP-XXXX-XXXX` and calls `lookup(code)`.
- **Manual Input Component**: Text field with automatic capitalization and whitespace stripping. Validates against regex: `^HMP-[A-Z0-9]{4}-[A-Z0-9]{4}$`.
- **RPC Invocation**: Calls `service.staffLookup(memberCode)` returning `StaffCustomerView`:
  ```typescript
  export interface StaffCustomerView {
    memberCode: string;
    fullName: string;
    stamps: number;
    cycle: number;
  }
  ```

### 2. Customer Panel (`CustomerPanel`)
Once a customer is located, the panel displays:
- Member's name and code.
- Interactive `StampGrid` showing current card progress.
- Horizontal drink selection pills (`MENU`).

### 3. Action State Machine

Depending on the customer's stamp balance (`stampsRemaining = 9 - stamps`):

#### Case A: Card Incomplete (`stamps < 9`)
- UI renders stamp counter `[-] [qty] [+]`.
- `qty` is bounded between `1` and `stampsRemaining`.
- Clicking "Add Stamp(s)" calls `service.staffAwardStamps()`.

#### Case B: Card Complete (`stamps = 9`)
- UI disables the stamp counter and displays a highlighted banner: *"Free drink ready"*.
- Clicking "Redeem free drink" triggers a secondary confirmation button: *"Confirm free [Drink]?"*.
- Clicking confirm calls `service.staffRedeemReward()`.

---

## 4. Idempotency & Fault Tolerance

To ensure that network instability in the café does not cause duplicate stamps:
1. `CustomerPanel` initializes a client-side UUID reference:
   ```typescript
   const requestId = useRef(newRequestId());
   ```
2. This `requestId` is passed with the mutation call.
3. If the request fails due to a network glitch and the barista clicks again, the exact same `requestId` is submitted.
4. The database RPC detects that the transaction was already processed and returns the current record without executing a second update.
5. Upon successful response, `requestId.current = newRequestId()` is rotated for the next transaction.

