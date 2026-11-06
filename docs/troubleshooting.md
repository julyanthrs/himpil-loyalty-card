# Troubleshooting & Diagnostics

> Read this document when encountering runtime errors, Supabase connection failures, QR scanner camera blocks, or hydration issues.

---

## 1. Scanner & Camera Diagnostics (`/staff`)

### Problem: Camera does not start or displays "Camera unavailable"
- **Cause 1: Insecure Context**: Browsers prohibit `navigator.mediaDevices` on non-secure origins. WebRTC camera APIs only function on `https://` or `http://localhost`.
  - **Fix**: When testing on a physical mobile device, access via an HTTPS tunnel or enter the member code manually in the input box on `/staff`.
- **Cause 2: Permission Blocked**: The user denied camera access in the browser prompt.
  - **Fix**: Reset site permissions in the browser address bar and reload.
- **Cause 3: Hardware Conflict**: Another application (Zoom, OBS, browser tab) is holding exclusive access to the device camera.

### Problem: QR code not recognized
- **Check**: Verify the QR payload starts with `himpil:member:HMP-`.
- **Fix**: Use the manual member code input field immediately below the camera scanner.

---

## 2. Supabase & Authentication Errors

### Error: `NOT_STAFF`
- **Symptom**: Barista console displays "Staff access only" or mutation calls fail.
- **Cause**: The authenticated user's ID does not exist in `public.staff_roles`.
- **Fix**: Execute in the Supabase SQL Editor:
  ```sql
  insert into public.staff_roles (user_id, role)
  select id, 'barista' from auth.users where email = '<staff-email>';
  ```

### Error: `AUTH`
- **Symptom**: API calls reject with an authorization exception.
- **Cause**: Session expired, JWT token invalidated, or user signed out in another tab.
- **Fix**: Sign out and log in again via `/login`.

### Error: `COOLDOWN`
- **Symptom**: Barista sees error: "A stamp was just added to this card. Wait a few seconds before adding another."
- **Cause**: A stamp transaction occurred less than 10 seconds ago on the same account.
- **Fix**: Wait 10 seconds before submitting. If awarding multiple stamps for one order, use the `+` counter to award them together in a single transaction.

### Error: `REWARD_PENDING`
- **Symptom**: Barista cannot add stamps to a card with 9 stamps.
- **Cause**: The loyalty card is complete. The free drink must be redeemed before new stamps can be collected.
- **Fix**: Click the **Redeem free drink** button in the console to redeem and start a new card cycle.

---

## 3. Realtime Updates Not Syncing

### Problem: Stamps added by barista do not appear on the customer's phone
1. **Check Data Mode**:
   - If running in **Demo Mode**, both tabs must be in the **same browser** (so they share `localStorage` and `storage` events). Demo mode cannot sync between two separate physical phones.
   - If running in **Live Mode**, verify both devices are connected to the same Supabase project URL.
2. **Check Realtime Publication**:
   - Ensure `public.loyalty_accounts` is in `supabase_realtime`:
     ```sql
     alter publication supabase_realtime add table public.loyalty_accounts;
     ```
3. **Visibility Fallback**:
   - When the phone unlocks or tab regains focus, `LoyaltyContext` automatically triggers a re-fetch via `document.addEventListener('visibilitychange', ...)`. Switching tabs or pulling down to refresh will force a sync.

---

## 4. Demo Mode Reset

### Problem: Demo data state is stuck or corrupted
- **Fix**:
  1. Navigate to `/profile`.
  2. Click **Reset demo data** at the bottom.
  3. Alternatively, open browser DevTools and execute:
     ```javascript
     localStorage.removeItem('himpil-demo-v2');
     location.reload();
     ```

