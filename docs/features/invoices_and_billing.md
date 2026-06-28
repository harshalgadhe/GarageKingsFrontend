# Feature Contract: Invoices & Billing (Receipts)

---

## 1. Manual Billing & Invoices
- **Purpose:** Allow administrators to create manual customer billing logs, invoice customers, deduct warehouse inventory, and spawn PDF receipt generation tasks.
- **Entry Points:** `/admin` (billing tab)
- **User Roles:** Admin, Owner
- **Business Rules:**
  - Generating billing receipts must occur inside a PostgreSQL Transaction.
  - Custom customer details (name, email, WhatsApp, address) can be passed. If they don't match an existing profile, a guest customer profile and placeholder user account are automatically generated.
  - Inventory stock deduction must occur dynamically using products table row-locking (`FOR UPDATE`) to prevent selling de-listed or out-of-stock items.
  - Spawning invoice generation must insert a job row in `receipt_generation_jobs` table.
- **API Endpoints:**
  - `POST /api/v1/receipts`
  - `GET /api/v1/receipts`
  - `DELETE /api/v1/receipts/:id`
- **Database Tables:** `receipts`, `receipt_items`, `receipt_generation_jobs`, `customers`, `users`, `orders`, `order_items`, `products`, `inventory`
- **Dependencies:** Inventory module.
- **Failure Scenarios:** Parallel checkouts lock product row, causing manual invoice page to block briefly (handled by connection pool retry). Duplicate receipt numbers throw standard unique constraints error.
- **Edge Cases:** Billed casting has zero stock (thrown out before execution), customer phone number is empty (defaulted to '0000000000').
- **Security Considerations:** Manual billing endpoint must require JWT Auth and Admin/Owner check.
- **Regression Risks:** Stock double-deductions, broken billing pdf outputs, 500 error on customer records duplicate conflict.
- **Required Tests:** Create receipt with new customer, check stock levels before/after receipt execution, verify audit logs table entry.
