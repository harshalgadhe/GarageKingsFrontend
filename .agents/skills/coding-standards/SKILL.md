---
name: coding-standards
description: Enforces codebase conventions, naming rules, ESM formats, and pull request checklist constraints.
---

# coding-standards

This skill card defines coding standards, conventions, and style constraints.

---

## 1. Naming Conventions & Structure
- **Backend (NestJS)**:
  - Controllers: Use kebab-case names ending in `.controller.ts`.
  - Services: Use kebab-case names ending in `.service.ts`.
  - Modules: CamelCase name in `src/modules/` folders.
- **Frontend (React)**:
  - Components: PascalCase filenames (e.g. `AdminDashboard.jsx`).
  - Styles: Vanilla CSS files.

---

## 2. ESM & Node imports
- All files in the NestJS backend use ES Modules (`"type": "module"`) and imports must include the `.js` extension (e.g. `import { ApiService } from './api.service.js'`).
- Environmental variables must be loaded via `dotenv.config()`.

---

## 3. Pull Request / Commit Checklist
- Commits must use Conventional Commits (e.g. `feat: ...`, `fix: ...`, `docs: ...`).
- Code changes must keep documentation and AI skills in sync within the same commit.
