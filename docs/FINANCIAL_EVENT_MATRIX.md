# Financial Event Matrix

This document is the absolute source of truth defining every financial event in the GarageKings system.

---

## 1. Customer Payment (Standard Order)
- **Trigger**: Admin approves standard payment verification screenshot.
- **Preconditions**: Order status is `'Verification Pending'`.
- **Tables Updated**: `orders` (status → `'Confirmed'`), `receipts` (pending balance → `0`), `inventory_batches` (available → reserved), `inventory` cache.
- **Ledger Entries Created**: Inflow `(+)` to `cash_ledger` (Type: `'Customer Payment'`).
- **Permissions Required**: `Admin` or `Owner`.
- **Rollback Behavior**: Single database transaction. If ledger creation or status update fails, TypeORM rolls back all stock reservations and updates.

---

## 2. Pre-order Advance Payment
- **Trigger**: Admin approves pre-order payment verification screenshot.
- **Preconditions**: Order status is `'Verification Pending'` and `booking_type = 'pre_order'`.
- **Tables Updated**: `orders` (status → `'Pre-Order'`), `receipts` (pending balance → remaining amount), `inventory_batches` (allocated to reserve if stock exists), `inventory` cache.
- **Ledger Entries Created**: Inflow `(+)` to `cash_ledger` (Type: `'Pre-order Advance'`).
- **Permissions Required**: `Admin` or `Owner`.
- **Rollback Behavior**: Single database transaction rolls back all steps on failure.

---

## 3. Remaining Pre-order Payment
- **Trigger**: Admin approves remaining balance verification screenshot.
- **Preconditions**: Order status is `'Pre-Order'` and `remaining_amount > 0`.
- **Tables Updated**: `orders` (remaining amount → `0`), `receipts` (pending balance → `0`).
- **Ledger Entries Created**: Inflow `(+)` to `cash_ledger` (Type: `'Pre-order Remaining Payment'`).
- **Permissions Required**: `Admin` or `Owner`.
- **Rollback Behavior**: Transaction rollback.

---

## 4. Inventory Receipt (Batch Purchase)
- **Trigger**: Admin records a new inventory batch shipment.
- **Preconditions**: Valid distributor ID and SKU.
- **Tables Updated**: `inventory_batches` (new row), `inventory` cache (quantity available increases), `products` cache (total stock increases).
- **Ledger Entries Created**: Outflow `(-)` to `cash_ledger` (Type: `'Inventory Purchase'`). If funded by founder: Inflow `(+)` to `cash_ledger` (Type: `'Founder Contribution'`).
- **Permissions Required**: `Admin` or `Owner`.
- **Rollback Behavior**: Rollback prevents batch creation if ledger entry writing fails.

---

## 5. Operating Expense
- **Trigger**: Admin registers an operational expense (e.g. shipping, software, marketing).
- **Preconditions**: Valid amount and categorization.
- **Tables Updated**: `expenses` (new row).
- **Ledger Entries Created**: Outflow `(-)` to `cash_ledger` (Type: `'Operating Expense'`).
- **Permissions Required**: `Admin` or `Owner`.
- **Rollback Behavior**: Atomic transaction prevents expense insertion on ledger failure.

---

## 6. Founder Contribution
- **Trigger**: Admin records founder capital injection.
- **Preconditions**: Valid founder name and amount.
- **Tables Updated**: `founder_capital_ledger` (future mapping if needed).
- **Ledger Entries Created**: Inflow `(+)` to `cash_ledger` (Type: `'Founder Contribution'`).
- **Permissions Required**: `Admin` or `Owner`.
- **Rollback Behavior**: Transaction rollback.

---

## 7. Customer Refund
- **Trigger**: Admin cancels an order and returns payment.
- **Preconditions**: Order is in `'Confirmed'`, `'Pre-Order'`, `'Shipped'`, or `'Delivered'` status.
- **Tables Updated**: `orders` (status → `'Cancelled'`), `refunds` (new row), `inventory_batches` (released from reserved/sold), `inventory` cache.
- **Ledger Entries Created**: Outflow `(-)` to `cash_ledger` (Type: `'Refund'`).
- **Permissions Required**: `Admin` or `Owner`.
- **Rollback Behavior**: Complete rollback of refund row, status updates, and stock releases on database error.
