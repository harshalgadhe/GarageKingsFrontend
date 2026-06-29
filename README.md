# GarageKings

GarageKings is a premium web application built with a React/Vite frontend and a NestJS monolithic backend, deployed on AWS Lambda with a private PostgreSQL RDS instance.

---

## 1. Repository Structure
*   **Root Folder (`/`)**: React + Vite frontend application.
*   **`/server`**: NestJS REST API Monolith.
*   **`/docs/features`**: Detailed feature architecture design docs.

---

## 2. Local Development Setup

### Frontend
1.  Navigate to root directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```

### Backend
1.  Navigate to the `/server` folder:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the NestJS dev server in watch mode:
    ```bash
    npm run start:dev
    ```

---

## 3. Production Deployment Guide

### Frontend (Vercel)
The frontend deployment is fully automated. Pushing any changes to the `main` branch on GitHub automatically triggers a Vercel build and deployment:
```bash
git add .
git commit -m "feat: commit message"
git push origin main
```

### Backend (AWS Lambda)
Because the compiled package size with production dependencies (`node_modules`) exceeds AWS Lambda's 50MB direct CLI upload limit, we stage the package in S3 before updating the Lambda function.

#### Step 1: Compile the Backend
Build the NestJS code using the TypeScript compiler:
```bash
cd server
npm run build
```

#### Step 2: Package into Zip Archive
Create the deployment archive using the fast archiver packager script:
```bash
node pack-lambda.mjs
```
This creates `lambda-deploy.zip` (~55MB) in the `server` directory.

#### Step 3: Upload Package to S3 Staging
Copy the deployment archive to your S3 deployment bucket:
```bash
aws s3 cp lambda-deploy.zip s3://gk-production-public-assets-2026/lambda-deploy.zip --region ap-south-1
```

#### Step 4: Update the AWS Lambda Code
Instruct AWS Lambda to update function code pulling from the S3 file location:
```bash
aws lambda update-function-code --function-name gk-production-api-prod --s3-bucket gk-production-public-assets-2026 --s3-key lambda-deploy.zip --region ap-south-1
```

### Backend (GitHub Actions CI/CD)
Automatic backend deployment is configured via GitHub Actions. Pushing code changes to the `main` branch of the backend repository will automatically run the deployment pipeline in `.github/workflows/deploy.yml` (compiles, packages, uploads to S3, and updates Lambda function code).

**Required Repository Secrets in GitHub**:
To authenticate the deployment run, register the following secrets in your GitHub repository under **Settings > Secrets and variables > Actions**:
1. `AWS_ACCESS_KEY_ID` (AWS CLI IAM credential key)
2. `AWS_SECRET_ACCESS_KEY` (AWS CLI IAM credential secret)

---

## 4. Observability & Diagnostics
For more details on the decoupled system telemetry services, tracing middleware, error logging context-preservation, and admin dashboards, check [observability.md](file:///c:/Users/harsh/Desktop/Project/GarageKings/docs/features/observability.md).