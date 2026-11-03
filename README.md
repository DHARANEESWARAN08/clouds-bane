# Cloud's Bane

**ML-assisted network intrusion detection and security operations dashboard.**

Investigate stored alerts, submit network-flow predictions, explore historical analytics, and review AWS service checks in a React and TypeScript interface.

This repository contains the frontend. AWS backend resources, model training, private datasets, and infrastructure deployment are maintained separately.

Cloud’s Bane is an ML-powered network intrusion detection and security operations frontend built with React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide, and Wouter. It is designed to sit on top of the existing AWS API Gateway → Lambda → ML model → DynamoDB → CloudWatch architecture.

## Run locally

Use Node.js 22.12 or newer and the pnpm version declared in `package.json`. Clone this repository, copy `.env.example` to `.env.local`, and set your approved backend URL. On Windows Command Prompt, use `copy .env.example .env.local`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Set the deployment/runtime variable `VITE_API_BASE_URL` to the approved API Gateway base URL. The frontend uses it for `/predict`, `/alerts`, `/metrics`, `/health`, and `/dataset-analytics`. AWS credentials, DynamoDB credentials, IAM tokens, and session tokens must never be placed in the frontend. When no API base URL is configured, the interface shows explicit unavailable states; it does not fabricate operational data.

Open the URL printed by Vite. It starts at port 3000 and selects another available port if necessary. `VITE_API_BASE_URL` is embedded at build time for production; changing it requires rebuilding.

## API integration

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/predict` | POST | Classify submitted network-flow features |
| `/alerts` | GET | Retrieve stored alert history |
| `/metrics` | GET | Operational counters and stored-alert severity summary |
| `/health` | GET | Backend-reported service checks |
| `/dataset-analytics` | GET | Historical offline analytics |

The local development server proxies `/api/*` requests to the configured API. Production builds call the API directly. The Vite proxy is development-only.

## Product routes

- `/` — command center dashboard
- `/detection` — Top-30 network-flow prediction form
- `/alerts` — alert inventory with filtering and sorting
- `/network` — traffic activity analysis
- `/model` — model metadata and offline evaluation information
- `/mlops` — model lifecycle overview and available release information
- `/monitoring` — operational counters and reported service health
- `/settings` — API and system configuration boundary

## Data behavior

Live cybersecurity values are never fabricated. If the configured API is unavailable or an endpoint has not been implemented, the UI shows an explicit pending, loading, or error state. Verified static model information is sourced from the Cloud’s Bane product specification.

Operational metrics, stored alerts, and offline dataset analytics represent different data sources and time windows. Zero recent operational counters do not imply an empty historical alert inventory or a threat-free environment. Missing addresses remain unavailable while reported ports are retained. Model deployment health is unavailable when the backend does not report it.

## Verification

```bash
pnpm exec vitest run client/src/services/api.test.ts
pnpm check
pnpm build
```

The API tests include a real `/health` connectivity check requiring `VITE_API_BASE_URL` and network access. This is not a comprehensive AWS integration test. For offline response-normalization tests, run:

```sh
pnpm exec vitest run client/src/services/api.test.ts -t "alerts response normalization"
```

## Build and hosting

`pnpm build` generates static assets in `dist/public`; `pnpm preview` serves the build locally. Configure static hosting with that output directory and an SPA fallback to `index.html`. A Vercel rewrite is included in `vercel.json`.

The current build does not compile `server/index.ts`, so `pnpm start` is not a complete production build workflow. Set the public API base URL before building. Never put credentials in `VITE_*` variables because they are exposed to the browser.

Production browser access requires API CORS configured for the intended hosting origin, used methods and headers, and applicable error responses. Verify this with the deployed frontend; the development proxy does not resolve production CORS.

## Structure

```text
client/src/components/   Layout and reusable UI components
client/src/pages/        Application screens
client/src/services/     API client and response tests
client/src/types/        Types and model metadata
server/                 Optional static-server source
shared/                 Shared constants
patches/                Dependency patches used by pnpm
```

## Current scope

This interface does not establish automatic live packet capture, attack blocking, continuous retraining, or verified model production health. Those capabilities require backend implementation and evidence. Static model evaluation values are distinct from live operational telemetry.

## Contributing and security

Keep changes focused, preserve API contracts, and run the validation commands before submitting a change. Document loading, empty, error, and unavailable states for new features. Environment files, generated review reports, logs, private datasets, and build outputs belong outside version control. Never commit AWS credentials, private keys, or sensitive alert exports.
