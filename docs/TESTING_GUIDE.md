# Testing & Verification Guide

This document outlines the testing strategies, unit-test commands, and manual verification scripts for GarageKings.

---

## 1. Unit & Integration Tests

### Running Tests
To run backend unit tests:
```bash
npm run test
```

To run end-to-end tests:
```bash
npm run test:e2e
```

---

## 2. Manual SQL Verification Queries

Admins can run the following SQL queries to manually verify database consistency:

### Check Cache Discrepancy
```sql
SELECT p.id, p.sku, p.total_stock, SUM(b.quantity_received)::int as batch_total
FROM products p
JOIN inventory_batches b ON b.product_id = p.id
GROUP BY p.id, p.sku, p.total_stock
HAVING p.total_stock != SUM(b.quantity_received)::int;
```

### Check Ledger Sum vs Batch Available
```sql
SELECT b.id, b.sku, b.quantity_available, SUM(l.quantity_changed)::int as ledger_sum
FROM inventory_batches b
JOIN inventory_ledger l ON l.batch_id = b.id
GROUP BY b.id, b.sku, b.quantity_available
HAVING b.quantity_available != SUM(l.quantity_changed)::int;
```

---

## 3. Automated Reconciliation Task

Reconciliation runs automatically at startup and nightly. It can also be triggered manually:
- **Admin API Trigger**:
  `POST /api/v1/admin/inventory/reconcile`
  Returns details of any mismatches found and writes warning logs if issues exist.
