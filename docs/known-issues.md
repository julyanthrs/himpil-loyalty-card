# Known Issues & Technical Debt

> Read this document to understand current technical debt, known limitations, edge cases, and areas requiring future attention.

---

## 1. Technical Debt & Current Limitations

### 1. In-Browser Scope of Demo Mode
- **Limitation**: Demo mode stores all account and transaction data in `localStorage` (`himpil-demo-v2`).
- **Consequence**: Synchronization only works between tabs or windows within the **same browser instance**. It is impossible to test Demo Mode across two separate physical devices (e.g. customer on iPhone, barista on iPad) without setting up Supabase.

### 2. Notifications System Implementation
- **Current State**: The `NotificationsMenu` in `src/components/layout/NotificationsMenu.tsx` constructs notifications on-the-fly from the customer's `activity` feed. Unread status is tracked solely via a local timestamp in `localStorage` (`himpil-notifications-seen`).
- **Technical Debt**: There is no dedicated `notifications` table or push delivery mechanism in the database. Notifications cannot be dismissed individually or synchronized across multiple user devices.

### 3. Camera Scanner Origin Constraints
- **Limitation**: The optical QR scanner in `src/pages/Staff.tsx` relies on the browser `MediaDevices` API, which modern mobile browsers strictly gate behind secure contexts (`https://` or `localhost`).
- **Consequence**: Accessing the dev server from a physical smartphone over local LAN IP (e.g. `http://192.168.x.x:5173`) disables the camera. Baristas must either test on `localhost`, use an HTTPS tunnel (such as ngrok or cloudflare tunnels), or rely on manual code entry.

### 4. Stock Photography Placeholders
- **Current State**: While the hero photo (`hero-himpil.webp`) and card artwork are official Himpil assets, the secondary drink images in `public/images/drinks/` and contextual photos (`together.webp`, `promo-iced.webp`, `reward-pour.webp`) originate from Unsplash stock collections.
- **Future Work**: Replace stock photography with original Himpil café product photography as it becomes available.

### 5. Dependency Installation Requirement
- **Current State**: Clean checkouts do not contain `node_modules`. Running TypeScript compiler or build scripts requires running `npm install` first.

