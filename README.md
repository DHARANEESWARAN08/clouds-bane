# Cloud’s Bane frontend

Cloud’s Bane is an ML-powered network intrusion detection and security operations frontend built with React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide, and Wouter. It is designed to sit on top of the existing AWS API Gateway → Lambda → ML model → DynamoDB → CloudWatch architecture.

## Run locally

```bash
pnpm install
pnpm dev
```

Set the deployment/runtime variable `VITE_API_BASE_URL` to the approved API Gateway base URL. The frontend uses it for `/predict`, `/alerts`, `/metrics`, `/health`, and `/dataset-analytics`. AWS credentials, DynamoDB credentials, IAM tokens, and session tokens must never be placed in the frontend. When no API base URL is configured, the interface shows explicit unavailable states; it does not fabricate operational data.

## Product routes

- `/` — command center dashboard
- `/detection` — Top-30 network-flow prediction form
- `/alerts` — alert inventory with filtering and sorting
- `/network` — traffic activity analysis
- `/model` — production model and evaluation metrics
- `/mlops` — candidate evaluation and promotion workflow
- `/monitoring` — CloudWatch-aligned metrics, alarms, and drift context
- `/settings` — API and system configuration boundary

## Data behavior

Live cybersecurity values are never fabricated. If the configured API is unavailable or an endpoint has not been implemented, the UI shows an explicit pending, loading, or error state. Verified static model information is sourced from the Cloud’s Bane product specification.

## Verification

```bash
pnpm exec vitest run client/src/services/api.test.ts
pnpm check
pnpm build
```
