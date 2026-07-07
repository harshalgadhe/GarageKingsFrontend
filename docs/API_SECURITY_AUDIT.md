# API Security Audit

This document identifies security exposures, missing authorization checks, IDOR vulnerabilities, and sensitive field leaks across all active backend REST endpoints, mapping out the migration targets.

---

## 1. Vulnerability & Risk Summary

* **Direct Entity Leakage**: Standard public endpoints return database entities directly, leaking purchase price, internal supplier names, stock quantities, and audit timestamps.
* **Insecure Direct Object Reference (IDOR)**: Endpoints accepting IDs (like order screenshots or payment updates) verify session presence but lack customer ownership validation.
* **Weak Authorization Constraints**: Core operational endpoints (like receipt queries) check authentication but lack role restriction filters, exposing admin capabilities to collectors.

---

## 2. Comprehensive Endpoint Matrix

### 2.1 Public APIs (Unauthenticated)

| Route | Method | Current Response | Security State | Remediation Target |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/public/products` | GET | Database `products` array | **UNSAFE** (leaks purchasePrice, internal SKU, exact stocks) | Project with `PublicProductResponseDto` showing availability status |
| `GET /api/v1/public/products/:id` | GET | Complete product details | **UNSAFE** (leaks supplier, margins, exact stocks) | Project with `PublicProductResponseDto` |
| `GET /api/v1/public/settings` | GET | Global configuration JSON | **SAFE** | Limit to standard public DTO schema |
| `GET /api/v1/public/images/:filename` | GET | Image binary stream | **SAFE** | Public static media router |

### 2.2 Customer APIs (Collector Auth required)

| Route | Method | IDOR Verification | Security State | Remediation Target |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/customer/products/reserve` | POST | None | **SAFE** | Links reservation strictly to authenticated token |
| `POST /api/v1/customer/products/reserve-cart` | POST | None | **SAFE** | Links reservation strictly to authenticated token |
| `GET /api/v1/customer/orders/my` | GET | Filters by session user | **SAFE** | Returns mapped customer orders |
| `GET /api/v1/customer/profile/my` | GET | Filters by session user | **SAFE** | Returns customer contact details |
| `POST /api/v1/customer/profile/my` | POST | Filters by session user | **SAFE** | Modifies own details only |
| `POST /api/v1/customer/orders/:id/screenshot` | POST | Authenticated user only | **VULNERABLE** | Add ownership validation: verify order user matches requesting user |
| `POST /api/v1/customer/orders/:id/submit-remaining` | POST | Authenticated user only | **VULNERABLE** | Add ownership validation: verify order user matches requesting user |

### 2.3 Admin APIs (Admin/Owner privileges required)

| Route | Method | Access Control | Security State | Remediation Target |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/admin/products` | GET | `checkAdmin` | **SAFE** | Full Product details (stocks, suppliers, purchase costs) |
| `POST /api/v1/admin/products` | POST | `checkAdmin` | **SAFE** | Add/edit catalog items |
| `PATCH /api/v1/admin/products/:id` | PATCH | `checkAdmin` | **SAFE** | Update fields |
| `DELETE /api/v1/admin/products/:id` | DELETE | `checkAdmin` | **SAFE** | Archive fields |
| `GET /api/v1/admin/orders` | GET | `checkAdmin` | **SAFE** | Manage order list |
| `PATCH /api/v1/admin/orders/:id` | PATCH | `checkAdmin` | **SAFE** | Confirm and fulfill |
| `GET /api/v1/admin/expenses` | GET | `checkAdmin` | **SAFE** | Expense details |
| `POST /api/v1/admin/expenses` | POST | `checkAdmin` | **SAFE** | Expense details |
| `GET /api/v1/admin/cash-accounts` | GET | `checkAdmin` | **SAFE** | Accounts details |
| `GET /api/v1/admin/cash-ledger` | GET | `checkAdmin` | **SAFE** | Ledger details |
| `GET /api/v1/admin/founder-ledger` | GET | `checkAdmin` | **SAFE** | Splits details |
| `GET /api/v1/admin/supplier-purchases`| GET | `checkAdmin` | **SAFE** | Purchases details |
| `GET /api/v1/receipts` | GET | Token only | **VULNERABLE** | Exposes company invoices to standard customers; restrict to Admin/Owner |
| `DELETE /api/v1/receipts/:id` | DELETE | Token only | **VULNERABLE** | Exposes receipt deletion to standard customers; restrict to Admin/Owner |

---

## 3. Serialization Guidelines

* **DTO Enforcement**: Every endpoint must declare its DTO schema. ORM/Entity classes must never be exported by the controller.
* **No `SELECT *`**: Repository-layer methods must define explicit SQL projection parameters to prevent data leaks.
