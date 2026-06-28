# Feature Contract: Authentication & User Accounts

---

## 1. Authentication
- **Purpose:** Securely log in collectors, admins, and owners. Protect user credentials and sessions.
- **Entry Points:** `/login`, `/signup`, `src/lib/auth.js`
- **User Roles:** Public (to authenticate), Viewer, Admin, Owner
- **Business Rules:**
  - Password hashing must use salt with PBKDF2 (SHA512).
  - Sessions are managed by a secure HTTPOnly cookie named `gk_access_token` containing a signed JWT (HMAC-SHA256).
  - Expired tokens must be treated as unauthorized session blocks.
- **API Endpoints:**
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/google-login`
- **Database Tables:** `users`
- **Dependencies:** None
- **Failure Scenarios:** Database down (prevents login), Invalid secret key (fails JWT verify), expired cookie (forces login page redirect).
- **Edge Cases:** Multiple sessions logged in concurrently (permitted), clock skew on JWT expiry checks.
- **Security Considerations:** Enforce cookie configuration: `HttpOnly`, `Secure` (in production), and `SameSite=Lax`.
- **Regression Risks:** Breaking login prevents checkout and admin controls.
- **Required Tests:** Test credentials verify, sign JWT expires accurately.

---

## 2. User Account (Collector Profile)
- **Purpose:** Allow collectors to manage their display name, WhatsApp notifications status, bio, and view historical purchases.
- **Entry Points:** `/account`, `src/pages/Account.jsx`
- **User Roles:** Viewer, Admin, Owner (Requires Auth)
- **Business Rules:**
  - Customers must opt-in explicitly before WhatsApp notification runs.
  - Profile values must be sanitized before DB insert to prevent Cross-Site Scripting (XSS).
- **API Endpoints:**
  - `GET /api/v1/profile/my`
  - `PUT /api/v1/profile/my`
- **Database Tables:** `profiles`, `users`
- **Dependencies:** Authentication module.
- **Failure Scenarios:** Database failure saves profile state as stale.
- **Edge Cases:** Saving empty profile bios, username changes collision checks (profiles.username unique constraint).
- **Security Considerations:** Users must only access or modify *their own* profiles. IDOR check must be enforced (using backend token `userId` from req.user, never trust user ID passed in client body parameters).
- **Regression Risks:** Break profiles, break profile creation at checkout.
- **Required Tests:** Update display name, confirm profile permissions.
