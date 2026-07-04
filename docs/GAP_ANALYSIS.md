# Financial Domain Gap Analysis

This document provides a comparative analysis of the previous simple calculations versus the new Cash Transaction Ledger architecture.

---

## 1. Comparative Analysis

| Feature | Previous State | New Ledger Architecture |
| :--- | :--- | :--- |
| **Accounting Model** | Basic revenue/expenses. Profit calculated incorrectly as `Revenue - Expenses`. | **Accrual/Cash Hybrid**: profit is calculated as `Revenue - COGS - Operating Expenses`. Inventory purchases are treated as asset conversions. |
| **Transaction Logs** | No central ledger. Expenses and batch purchases are completely separate. | **Cash Transaction Ledger (`cash_ledger`)**: Centralized, immutable ledger table tracking all inflows and outflows. |
| **Account Splits** | Splits computed directly from raw expenses table. | **Founder Capital Ledger**: Unifies contributions, draws, reimbursements, and settlements. |
| **Reconciliation** | No diagnostics checks. | **Reconciliation Diagnostic Checks**: Compares balances at startup and nightly, writing failures to system notifications. |
| **Drill-down Analytics**| KPIs were static. | **Transaction Drill-down**: Clickable frontend cards that retrieve ledger rows with CSV exporter. |

---

## 2. Transition Plan & Integrity Constraints
1. **Historical Ledger Seeding**: Database migrations populate the `cash_ledger` with entries for all previous orders, expenses, and splits.
2. **Immutability Invariant**: Database queries block modifications to the `cash_ledger` table. Adjustments require offsetting entries.
3. **Transaction Safety**: All order approvals, batch receipts, and refund flows run inside TypeORM query runner transaction blocks.
