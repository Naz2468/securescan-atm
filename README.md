# SecurePay ATM · 2-Factor Biometric Authentication

Academic prototype: Secure ATM 2-Factor Authentication using **Facial Recognition** (face-api.js)
and **Fingerprint Matching** (OpenCV.js ORB), built on TanStack Start + Lovable Cloud.

## Stack

- **Frontend**: React 19 + TanStack Start + Tailwind v4 (terminal/fintech dark theme)
- **Backend**: Lovable Cloud (managed Supabase: Postgres + Storage)
- **Server logic**: TanStack `createServerFn` (replaces the Edge Functions in the spec)
- **Face Recognition**: [face-api.js](https://github.com/justadudewhohacks/face-api.js) — 128-D descriptors, Euclidean distance < 0.5 = match
- **Fingerprint**: [OpenCV.js](https://docs.opencv.org) — ORB keypoints + brute-force Hamming matching (>= 15 good matches = match)

Both biometric libraries load from CDN at runtime; no native dependencies.

## Routes

| Path      | Purpose                                                  |
| --------- | -------------------------------------------------------- |
| `/`       | Welcome — account # entry + demo quick-fill              |
| `/auth`   | Live face capture + fingerprint upload + 2FA verification |
| `/menu`   | Post-auth ATM: balance, withdraw, transfer, history       |
| `/enroll` | Admin: enroll users (face descriptor + fingerprint image) |
| `/logs`   | Admin: authentication audit trail                         |

## Backend tables

Created automatically by the migration:

- `atm_users` — account holders (full_name, account_no, balance)
- `biometrics` — per-user face descriptor (JSON) + fingerprint storage path
- `auth_logs` — every authentication attempt with scores
- `transactions` — withdrawals, transfers, deposits, balance checks
- `atm_sessions` — short-lived session tokens (60s TTL)

Storage bucket: **`biometrics`** (private; signed URLs only).

> ⚠ RLS is enabled but uses permissive policies for the prototype. Tighten before production use.

## Seeded demo accounts

| Name           | Account No   | Balance     |
| -------------- | ------------ | ----------- |
| Obed Meshach   | 0123456789   | ₦75,000.00  |
| Ada Okonkwo    | 0987654321   | ₦120,000.00 |
| Emeka Bello    | 1122334455   | ₦45,000.00  |

## How to use

1. **Enroll** a demo account at `/enroll`:
   - Type the demo name + account number (e.g. `Obed Meshach` / `0123456789`)
   - Capture your face with the webcam
   - Upload any fingerprint-like image (any clear high-contrast image works for the prototype)
   - Click **ENROLL USER**
2. Go to `/`, type the same account number, and **PROCEED**
3. At `/auth`:
   - **CAPTURE FACE** → face-api detects you & extracts a 128-D vector
   - Upload the **same** fingerprint image → OpenCV ORB matches it against the enrolled one
   - **AUTHENTICATE** → server computes face distance, both factors logged, session token issued
4. You land on `/menu` with a 60-second session timer — withdraw, transfer, view history

## Server functions

Two TanStack server functions (`src/lib/atm.functions.ts`) replace the spec's edge functions:

- **`authenticate`** — fetches stored face descriptor, computes Euclidean distance server-side,
  logs the attempt, issues a session token on success.
- **`transact`** — validates session token + expiry, updates balances atomically,
  records transaction with reference `TXNxxxxx`.

Both use `supabaseAdmin` (service-role) since this prototype intentionally has open access.

## Notes for tightening for production

- Replace permissive RLS policies with row-scoped policies
- Move biometric verification entirely server-side (or use a dedicated biometric SDK)
- Add liveness detection (anti-spoof) to face capture
- Use a real fingerprint sensor SDK instead of image upload + ORB
- Rate-limit `/authenticate`, lock accounts after N failures
- Sign and rotate session tokens (JWT + short expiry)
