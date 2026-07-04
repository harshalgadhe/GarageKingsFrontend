---
name: backend
description: Documents NestJS patterns, transaction scopes, DTO validations, and runtime error handlers.
---

# backend

This skill card defines backend guidelines.

---

## 1. Controller Design
- Endpoints must reside inside class-based NestJS Controllers.
- Mark admin routes with `@UseGuards(AuthGuard('jwt'))` and verify roles (`Admin` or `Owner`).

---

## 2. Service Transaction Integrity
- Any database mutation modifying inventory or cash reserves must use a TypeORM QueryRunner transaction:
  ```typescript
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
     // queries...
     await queryRunner.commitTransaction();
  } catch (err) {
     await queryRunner.rollbackTransaction();
     throw err;
  } finally {
     await queryRunner.release();
  }
  ```
