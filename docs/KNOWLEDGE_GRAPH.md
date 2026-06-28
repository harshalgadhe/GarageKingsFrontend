# Repository Knowledge Graph

This document serves as an impact analysis mapping relationship between Features, APIs, Database tables, UI components, User roles, and Security constraints. Use this map before making changes to understand downstream side effects.

---

## 1. Feature Map & Relationship Grid

| Feature | Primary UI Pages / Files | Backend REST Endpoints | Database Tables Involved | Service / Helper Logic | Allowed Roles | Security Constraints / Guards |
|---|---|---|---|---|---|---|
| **Authentication** | `/login`, `/signup`, `src/lib/auth.js` | `POST /auth/login`, `POST /auth/logout` | `users` | `hashPassword`, `verifyPassword`, `signJwt` | Public | None |
| **Marketplace** | `Marketplace.jsx`, `ProductDetail.jsx` | `GET /products`, `GET /products/paginated` | `products`, `product_images`, `marketplace_listings`, `offers` | `getPaginatedProducts` | Viewer, Admin, Owner | CSRF & JWT check |
| **Inventory** | `Admin.jsx` (inventory tab) | `GET /products`, `POST /products`, `PUT /products/:id` | `inventory`, `inventory_transactions` | `updateProduct`, `addProduct` | Admin, Owner | `@UseGuards(AuthGuard('jwt'))` |
| **Orders** | `Account.jsx` (order list) | `GET /orders/my`, `GET /orders/admin` | `orders`, `order_items` | `getCustomerOrders`, `getAdminOrders` | Auth User, Admin, Owner | `@UseGuards(AuthGuard('jwt'))` |
| **Checkout** | `Checkout.jsx` | `POST /products/reserve`, `POST /products/reserve-cart` | `orders`, `order_items`, `customers`, `reservations` | `reserveProduct`, `reserveProductsCart` | Auth User | `@UseGuards(AuthGuard('jwt'))`, Idempotency Lock check |
| **Payment Verification** | `Checkout.jsx`, `Admin.jsx` | `POST /orders/:id/confirm`, `PUT /orders/:id/status` | `orders`, `receipts` | `adminConfirmOrder`, `adminUpdateOrderStatus` | Admin, Owner | `@UseGuards(AuthGuard('jwt'))` |
| **Invoices** | `Admin.jsx` (billing) | `GET /receipts`, `POST /receipts` | `receipts`, `receipt_items`, `receipt_generation_jobs` | `generateBillingReceipt` | Admin, Owner | `@UseGuards(AuthGuard('jwt'))` |
| **Expenses** | `Admin.jsx` (finance) | `GET /expenses`, `POST /expenses` | `expenses` | `addExpense`, `getFinanceMetrics` | Admin, Owner | `@UseGuards(AuthGuard('jwt'))` |
| **Founder Splits** | `Admin.jsx` (finance) | `GET /splits`, `POST /splits/settlement` | `split_settlements`, `expenses` | `getSplits`, `addSettlement` | Admin, Owner | `@UseGuards(AuthGuard('jwt'))` |
| **Analytics** | `Admin.jsx` (dashboard) | `GET /finance/metrics`, `GET /analytics/metrics` | `orders`, `expenses`, `products` | `getFinanceMetrics`, `getAnalyticsMetrics` | Admin, Owner | `@UseGuards(AuthGuard('jwt'))` |
| **Settings** | `Admin.jsx` (settings) | `GET /settings`, `PUT /settings` | `global_settings` | `getGlobalSettings`, `updateGlobalSettings` | Owner | `@UseGuards(AuthGuard('jwt'))` (Owner Only) |

---

## 2. Downstream Impact Analysis Guide
If modifying any of the following components, follow the mapped dependencies to check side effects:

- **Inventory Stock Deductions:**
  - *Triggered by:* Checkout (`reserveProduct`, `reserveProductsCart`) OR manual receipts (`generateBillingReceipt`) OR order status changes (`adminConfirmOrder`, `adminUpdateOrderStatus`).
  - *Impacted UI:* Cart count limits, Product listing counts, Admin dashboard stock charts.
- **Refund / Cancellation:**
  - *Triggered by:* Order status transitions to `Cancelled`.
  - *Impacted UI:* Account order lists, Admin ledger stats.
  - *Stock Rule:* Return quantity back to `available` (release locked stock or decrement sold stock depending on previous state).
- **Settings Override (UPI ID / Splits):**
  - *Triggered by:* Global settings updates.
  - *Impacted UI:* Checkout payment instruction page (Google Pay QR changes).
  - *Impacted Ledger:* Splits balances recalculated on reload.
