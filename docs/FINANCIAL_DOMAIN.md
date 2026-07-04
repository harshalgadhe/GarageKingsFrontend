# Financial Domain Specifications

This document defines the cash transaction ledger model, cash accounts structure, and reporting metrics for GarageKings.

---

## 1. Cash Transaction Ledger vs. General Ledger

To keep the database design simple and maintainable for our current scale:
- **`cash_ledger`**: GarageKings uses a **Cash Transaction Ledger** (`cash_ledger` table) rather than a full double-entry General Ledger (GL).
- **Function**: It tracks cash account inflows and outflows directly, with explicit references to the originating business transaction (Source) and user notes.
- **Traceability**: Every record logs:
  - `source_type`: Category of the originating record (`'Order'`, `'Expense'`, `'Inventory Batch'`, `'Refund'`).
  - `source_id`: UUID reference pointing to the source row.

---

## 2. Cash Account Registry

- **Multi-Account Tracking**: Cash balance is tracked across distinct, active cash accounts registered in `cash_accounts`.
- **Active Accounts**:
  1. `GarageKings Business Bank` (Primary banking ledger).
  2. `GarageKings UPI` (Direct customer collections).
  3. `Cash Drawer` (In-person cash transactions).
  4. `Petty Cash` (Small daily operations).

---

## 3. Financial Metrics & Aggregations

All dashboard analytics and financial KPIs are derived dynamically from the transaction ledger:
- **Revenue**: Sum of `'Customer Payment'` and `'Pre-order Advance'` inflows with status `'Completed'`.
- **COGS**: Computed dynamically by matching completed orders with consumed batches in `order_inventory_allocations`.
- **Operating Expenses**: Sum of `'Operating Expense'` outflows. (Inventory purchases are treated as asset conversions and are excluded from expenses).
- **Net Profit**: `Gross Profit - Operating Expenses` = `Revenue - COGS - Operating Expenses`.
