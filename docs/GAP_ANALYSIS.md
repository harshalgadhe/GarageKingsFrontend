# Architecture & Security Gap Analysis

This document reports the findings of a repository-wide audit analyzing architectural consistency, security vulnerability risks, duplicate logic, and performance concerns within GarageKings.

---

## 1. Security Analysis

### Obvious Vulnerability: Unprotected Screenshot Upload Route [REMEDIATED]
- **Issue:** The API route `POST /api/v1/orders/:id/screenshot` previously had no authorization guards (`@UseGuards(AuthGuard('jwt'))`) and did not perform ownership checks. Anyone could submit arbitrary files and change the status of any order UUID.
- **Fix Applied:**
  - Added `@UseGuards(AuthGuard('jwt'))` to the controller route.
  - Passed `req.user.userId` into `saveScreenshotReceipt`.
  - Added SQL check in service layer asserting `order.user_id === authenticatedUserId`.
- **Status:** **Resolved** (Safe & Verified).

### Cryptography: Custom JWT Verification Helper
- **Issue:** `api.helpers.ts` contains custom PBKDF2 hashing and raw JWT signature signing/verifying functions. Standard security practices advise against deploying custom cryptography implementations when established libraries (like `@nestjs/jwt` or `jsonwebtoken`) are available.
- **Recommendation:** Refactor JWT verification logic to use `@nestjs/jwt`, which is already declared in `package.json`.

---

## 2. Architectural Inconsistencies

### Database Schema Drift (Lack of Migrations Engine)
- **Issue:** The backend does not utilize a standard schema migration framework (e.g. TypeORM migrations or Knex). Schema configurations are loaded by running raw SQL scripts from `schema.sql` on server bootstrap. This is prone to race conditions and makes schema rollbacks in production highly complex.
- **Recommendation:** Implement NestJS TypeORM migration commands and manage database schema version control cleanly.

---

## 3. Duplicate Logic

### Customer Upsert Redundancy
- **Issue:** Creating/upserting a customer record (`customers` table) from user registration data is executed separately in the manual invoicing route (`POST /receipts`) and the checkout flow (`POST /products/reserve`). This leads to duplicate business rules defining customer creation (e.g., fallback phone numbers or name structures).
- **Recommendation:** Extract customer upserting into a reusable helper method in a shared service module.

---

## 4. Performance Concerns

### Missing Database Indices on Foreign Keys
- **Issue:** Foreign keys and frequently queried status columns lack explicit indices in the database schema:
  - `orders(user_id)`
  - `orders(status)`
  - `inventory_transactions(product_id)`
  - `audit_logs(entity_id)`
- **Impact:** As the database volume expands, querying historical customer receipts and compiled splits balances will experience performance degradation due to sequential scans.
- **Recommendation:** Execute SQL scripts to add indexes on these columns.
