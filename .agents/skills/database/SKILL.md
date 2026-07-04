---
name: database
description: Outlines PostgreSQL schema rules, transaction DDL migrations, and inventory ledger checks.
---

# database

This skill card describes database constraints and migrator conventions.

---

## 1. Schema Sync & Migrations
- The single source of truth for the database layout is `server/src/database/schema.sql`.
- Modifications to database tables must be appended to `schema.sql` and run via `npm run migrate` inside transaction blocks.

---

## 2. Table-Specific Guidelines
- **Products**: Use SKU as authoritative canonical identifier.
- **Inventory Batches**: Individual stock batch tracking. Never directly overwrite batch purchase costs or receipt dates.
- **Inventory Ledger**: Immutable, append-only ledger entries for stock movements.
- **Customers**: Uniquely matched on email.
