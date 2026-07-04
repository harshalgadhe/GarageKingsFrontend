---
name: testing
description: Guidelines for Jest unit/e2e testing and automated database integrity verification rules.
---

# testing

This skill card describes testing conventions.

---

## 1. Automated Tests
- NestJS uses Jest for test coverage.
- Write unit tests under `.spec.ts` files matching the service names.

---

## 2. Integrity Verification Checks
- The codebase executes automatic reconciliation audits at startup and nightly.
- Ensure all business flows pass the post-migration checks:
  - Cache integrity: `total_stock = sum(quantity_received)`.
  - Ledger sanity: `quantity_available = sum(quantity_changed)`.
  - No negative inventory or orphan orders.
