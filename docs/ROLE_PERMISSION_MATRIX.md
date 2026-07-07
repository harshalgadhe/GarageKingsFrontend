# Role Permission Matrix

This document defines access rights connecting active client roles to route prefix boundaries.

---

## 1. System Roles

* **Anonymous**: Unauthenticated web visitors.
* **Collector (Customer)**: Authenticated collectors.
* **Admin / Owner**: Administrative workspace managers.

---

## 2. Permission Mapping Grid

| Route Namespace | Anonymous | Collector | Admin | Owner |
| :--- | :---: | :---: | :---: | :---: |
| `/api/v1/public/*` | ✓ | ✓ | ✓ | ✓ |
| `/api/v1/customer/*` | ✗ | ✓ (Own data) | ✓ | ✓ |
| `/api/v1/admin/*` | ✗ | ✗ | ✓ | ✓ |
| `/api/v1/receipts/*` | ✗ | ✗ | ✓ | ✓ |
| `/api/v1/admin/splits/*` | ✗ | ✗ | ✗ | ✓ |

---

## 3. Enforcement Layers

1. **Authentication Guard**: `AuthGuard('jwt')` parses JWT cookie tokens to verify token validity.
2. **Role Guard**: Decorators specify endpoint clearance matching role levels.
3. **IDOR Ownership Guard**: Database filters verify user association on customer records.
