---
name: project-knowledge
description: High-signal architectural context and business rules for the GarageKings codebase. Always load this skill before implementing modifications.
---

# GarageKings Codebase Knowledge Skill

This skill contains the condensed, high-signal knowledge graph and invariant rules for the GarageKings project. It is optimized for prompt insertion to ensure future AI agents do not violate business logic or reverse-engineer requirements.

---

## 1. Core Invariants (Rules Never to Violate)
1. **Authenticated Checkout Only:** Guest checkout is deprecated. All order reservation API calls (`POST /products/reserve` and `/reserve-cart`) must verify the user is authenticated via JWT session cookie (`gk_access_token`).
2. **First-Come-First-Served:** The active 15-second reservation timer cleanup worker is disabled. Available stock is locked at checkout submission and sold/released upon manual admin payment verification.
3. **No Negative Stock:** Dynamic availability formula: `Available = Total - Locked - Sold`. Available stock must never drop below 0. Checkouts requesting more than available must be rejected.
4. **Email-Unique CRM Records:** The `customers` table unique constraint is mapped to the customer's email, not their phone number.
5. **Private Uploads Guard:** Payment screenshots are private assets. They must be uploaded securely and streamed only via authenticated backend endpoints checking ownership or admin privileges. File magic bytes signatures must be verified.

---

## 2. Dynamic Transaction Ledger
1. **Stock Deductions:** Must occur atomically within a SQL Transaction (`QueryRunner`).
2. **Inventory Logging:** Any stock modification requires an entry in `inventory_transactions` capturing transaction types (`Added`, `Edited`, `Reserved`, `Sold`, `Returned`, `Cancelled`, `Deleted`).
3. **Audit Trails:** Significant operations (order updates, product deletes, CMS section edits, manual billing) must write details to `audit_logs` including before/after states.

---

## 3. Mandatory Workflow for Changes (Definition of Done)
Whenever business logic or code behavior is modified:
1. **Locate affected docs** in `/docs` (and `/docs/features/`).
2. **Update implementation** code.
3. **Update documentation** files, Mermaid charts, and decision logs to match code in the *same* pull request/commit.
4. **Ensure database migration scripts** (`server/src/database/schema.sql` and `onModuleInit` alterations block in `api.service.ts`) remain synchronized with any schema updates.
