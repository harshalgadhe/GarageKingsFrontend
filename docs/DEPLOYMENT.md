# Deployment & Production Lifecycle

This document describes the serverless deployment architecture, CI/CD pipeline, and database migration routines in production.

---

## 1. Serverless AWS Architecture

GarageKings is packaged to run in a serverless AWS environment:
- **NestJS API**: Packed as an AWS Lambda function using serverless-express wrapper.
- **React Frontend**: Bundled and hosted on S3, distributed via CloudFront CDN.
- **Database**: Managed RDS PostgreSQL instance.

---

## 2. Packaging & Build Procedures

### Packaging Backend Lambda
A custom packaging script bundles the backend to exclude development packages and create a lightweight zip artifact:
```bash
npm run build
node pack-lambda.js
```

### Static Asset Synchronization
Frontend assets are compiled and uploaded to S3:
```bash
npm run build
aws s3 sync dist/ s3://garagekings-frontend-bucket/ --delete
```

---

## 3. Production Database Migrations

To apply database updates to production RDS instances:
1. **Migration Runner**: Runs the migrate script inside the Lambda environment during deployment:
   ```bash
   npm run migrate
   ```
2. **Transaction Safety**: The script wraps all SQL commands inside a `BEGIN` / `COMMIT` block. If any migration query fails, the entire change is rolled back automatically.
3. **Audit Tracking**: Every migration execution creates a permanent record in `migration_runs` with dates, durations, and outputs.
