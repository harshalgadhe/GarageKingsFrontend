# Feature Contract: Checkout & Payments

This contract outlines user cart checkout logic, deposit payments for pre-orders, screenshot uploads, and verification steps.

---

## 1. Purpose & User Roles
- **Purpose**: Authenticated shopping cart checkout and secure manual payment verification.
- **Roles**:
  - `Viewer`: Submits cart details, uploads payment screenshot.
  - `Admin` / `Owner`: Verifies screenshot payment and confirms/declines order.

---

## 2. Validation & Concurrency Checks
- **Authenticity Guard**: Direct checkout requires a valid customer profile with verified email.
- **Low Stock Concurrency**: During checkout, SQL locks (`FOR UPDATE`) checkouts to prevent duplicate sales of limited items.
- **Idempotency Key**: Frontend provides unique submission keys to prevent duplicate transaction charges.
- **Verification screenshots**: Magic bytes signature verification checks if uploads are legitimate image assets.
