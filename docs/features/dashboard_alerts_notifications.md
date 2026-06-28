# Feature Contract: Admin Dashboard, Alerts & System Notifications

---

## 1. Admin Dashboard
- **Purpose:** Serve as a control center for store owners. Manage listings, orders, CMS banners, CMS section visibilities, and audit logs.
- **Entry Points:** `/admin`, `src/pages/Admin.jsx`
- **User Roles:** Admin, Owner
- **Business Rules:**
  - Owner-exclusive actions: modify global splits configuration, update settings, delete products permanently.
  - Audit logging is mandatory for all dashboard updates (e.g. updating pricing, editing stock).
- **API Endpoints:**
  - `GET /api/v1/homepage/cms`
  - `PUT /api/v1/homepage/visibility`
  - `GET /api/v1/audit/logs`
- **Database Tables:** `homepage_sections`, `homepage_items`, `audit_logs`
- **Dependencies:** Products, Orders.
- **Failure Scenarios:** CMS section visibility changes do not reflect immediately on client side (requires clearing cache).
- **Edge Cases:** CMS sections table empty (re-bootstrapped on server startup).
- **Security Considerations:** Protect admin page view with frontend user check and backend token validation.
- **Regression Risks:** Breaks CMS visibilities, broken layout formatting.
- **Required Tests:** Toggle CMS section display, retrieve audit logs.

---

## 2. Alerts & Notifications
- **Purpose:** Inform admins of critical events (low stock, pending payments, new prebook screenshots) and notify collectors of order updates.
- **Entry Points:** Dashboard header, client notifications toast
- **User Roles:** Viewer (to receive customer alerts), Admin, Owner (to receive system alerts)
- **Business Rules:**
  - Alerts are spawned when product stock falls below 3 units.
  - Receipt PDF generation failure logs a system notification.
- **API Endpoints:**
  - `GET /api/v1/notifications`
  - `POST /api/v1/notifications/read`
  - `DELETE /api/v1/notifications/:id`
- **Database Tables:** `system_notifications`, `notifications`
- **Dependencies:** Orders, Invoices.
- **Failure Scenarios:** UI fails to fetch notifications (handled gracefully in layout without 500 block).
- **Edge Cases:** Overflowing unread alerts list.
- **Security Considerations:** Customers must only access *their own* notifications (no cross-user leak).
- **Regression Risks:** Missing critical low stock alerts, notification queue blocking database connections.
- **Required Tests:** Create system notification, mark notification list as read.
