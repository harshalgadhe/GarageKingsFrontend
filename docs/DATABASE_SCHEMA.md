# Database Schema Reference

This document summarizes the PostgreSQL database table schemas, relationships, and indexes for GarageKings.

---

## 1. Core Tables & Relations

The platform holds standard database relations:
- **`users`**: Customer and administrator login and authentication mappings.
- **`profiles`**: Collector profile metadata.
- **`products`**: Master product castings catalog.
- **`inventory_batches`**: Sourced stock shipments with distributor and purchase price details.
- **`inventory`**: Caches for product availability (`Available = Total - Reserved - Sold`).
- **`orders` / `order_items`**: Customer checkout purchases.
- **`order_inventory_allocations`**: Maps order item depletions to specific batches.
- **`receipts` / `receipt_items`**: Custom invoicing and manual billing.

---

## 2. Cash Flow & Expense Ledger Tables

To support the revised financial domain, the following tables are defined:

### `cash_accounts`
- `id` UUID PRIMARY KEY
- `name` VARCHAR(255) UNIQUE
- `type` VARCHAR(100)
- `opening_balance` NUMERIC(12,2)
- `currency` VARCHAR(10)
- `is_active` BOOLEAN

### `cash_ledger`
- `id` UUID PRIMARY KEY
- `cash_account_id` UUID FK -> `cash_accounts`
- `amount` NUMERIC(12,2)
- `type` VARCHAR(100)
- `status` VARCHAR(50)
- `source_type` VARCHAR(100)
- `source_id` VARCHAR(100)
- `reference_number` VARCHAR(255)
- `reason` TEXT
- `founder_name` VARCHAR(100)
- `date` DATE

### `financial_monthly_snapshots`
- `id` UUID PRIMARY KEY
- `snapshot_month` DATE UNIQUE
- `revenue` NUMERIC(12,2)
- `cogs` NUMERIC(12,2)
- `gross_profit` NUMERIC(12,2)
- `operating_expenses` NUMERIC(12,2)
- `net_profit` NUMERIC(12,2)
- `inventory_value` NUMERIC(12,2)
- `cash_balance` NUMERIC(12,2)
