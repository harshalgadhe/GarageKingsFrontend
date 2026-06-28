# Feature Contract: Founder Finances (Ledger) & Analytics

---

## 1. Expenses & Splits
- **Purpose:** Log company expenses, verify split ratios (default 25% per founder), and compute settlement adjustments.
- **Entry Points:** `/admin` (finances tab)
- **User Roles:** Admin, Owner
- **Business Rules:**
  - Ledgers track four founders: Harshal, Anutosh, Sanchit, Anish.
  - Split ratios (default equal 25% share) can be edited in global settings.
  - Settlement transfers calculation follows:
    $$\text{Balance} = (\text{Actual Paid} + \text{Settlements Received}) - (\text{Target Owed} + \text{Settlements Sent})$$
  - ledger must compile a list recommending transfers from debtors to creditors.
- **API Endpoints:**
  - `GET /api/v1/expenses`
  - `POST /api/v1/expenses`
  - `DELETE /api/v1/expenses/:id`
  - `GET /api/v1/splits`
  - `POST /api/v1/splits/settlement`
- **Database Tables:** `expenses`, `split_settlements`, `global_settings`
- **Dependencies:** Settings module.
- **Failure Scenarios:** Incorrect split configurations (must sum to 100%).
- **Edge Cases:** Founder leaves company (splits must adjust).
- **Security Considerations:** Protected endpoints; standard viewers must not inspect financial metrics or add settlements.
- **Regression Risks:** Calculation errors skew who owes who money, broken expense additions.
- **Required Tests:** Add expense, calculate ledger splits balance, assert split balance sums to 0.

---

## 2. Analytics
- **Purpose:** Aggregate sales metrics, track top products/brands, compute profit and dead stock.
- **Entry Points:** `/admin` (analytics tab / overview)
- **User Roles:** Admin, Owner
- **Business Rules:**
  - Profit is calculated as:
    $$\text{Profit} = \text{Revenue} - \text{Expenses}$$
    Where revenue counts orders in `Confirmed`, `Shipped`, or `Delivered` states.
  - Dead stock includes castings loaded 90+ days ago with zero sales history.
- **API Endpoints:**
  - `GET /api/v1/finance/metrics`
  - `GET /api/v1/analytics/metrics`
- **Database Tables:** `orders`, `expenses`, `products`, `order_items`
- **Dependencies:** Orders, Expenses.
- **Failure Scenarios:** Database timeout on massive orders datasets.
- **Edge Cases:** Negative profit due to high operational startup expenses.
- **Security Considerations:** Protect financial aggregation data behind role verification guards.
- **Regression Risks:** Skewed business health reports, missing dead stock counts.
- **Required Tests:** Aggregate financial metrics, query analytics dashboard values.
